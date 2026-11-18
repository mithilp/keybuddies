"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Playback, Track } from "@/utils/types";
import crunker, { awake, wake } from "@/utils/crunker";
import { renderSong, songKey, SongError } from "@/utils/song";
import { Transport } from "@/utils/transport";

// How long the song waits after an edit before it's rendered again, in ms.
// Edits come in bursts and every render is a whole song.
const SETTLE = 150;

// Playing the studio's song: play, pause, the playhead, loop and mute. The
// song stops when the page that uses this goes away. `report` gets a message
// when something goes wrong, and an empty one when play starts over.
export const usePlayback = (
	tracks: Track[],
	bpm: string,
	report: (message: string) => void
) => {
	const [playback, setPlayback] = useState<Playback>("stopped");

	// Where the playhead rests while nothing is playing, in beats from the
	// start of the song. Play starts from here.
	const [beat, setBeat] = useState(0);
	const beatRef = useRef(0);

	const place = useCallback((to: number) => {
		beatRef.current = to;
		setBeat(to);
	}, []);

	const [transport] = useState(() => new Transport());

	// Where the song is right now, in beats. The playhead reads this on every
	// frame while the song plays. The tempo is the one the playing song was
	// rendered at, the studio's can already be another.
	const liveBeat = useCallback(
		() => (transport.position() * transport.bpm) / 60,
		[transport]
	);

	// the songKey of the song that's playing
	const playingKey = useRef("");

	// Goes up on every play and every stop. A play that finds a different
	// number than the one it started with was stopped and gives up.
	const run = useRef(0);

	// The ids of the muted tracks. Mute goes by the track, not by where it is
	// in the list, so it stays on the right one when a track above is deleted.
	const [muted, setMuted] = useState<ReadonlySet<string>>(new Set());

	// play() reads this when the tracks start, which is after it was called
	const mutedRef = useRef<ReadonlySet<string>>(new Set());

	// when it's on the song starts over at its end until it's paused
	const [looping, setLooping] = useState(false);

	const toggleLoop = () => {
		setLooping(!looping);
		transport.setLoop(!looping);
	};

	// stops the sound, and any play that's still getting ready
	const silence = useCallback(() => {
		run.current++;
		transport.stop();
	}, [transport]);

	// stops everything and leaves the playhead at `at`
	const halt = useCallback(
		(at: number) => {
			silence();
			setPlayback("stopped");
			place(at);
		},
		[silence, place]
	);

	// the pause button. the playhead stays where the song got to.
	const stop = () => {
		halt(transport.playing ? liveBeat() : beatRef.current);
	};

	const play = async () => {
		const id = ++run.current;
		const stopped = () => run.current !== id;

		// browsers only let audio start from a click, and by the time the song
		// is rendered this isn't one anymore
		if (crunker) wake();

		report("");
		setPlayback("loading");

		try {
			// build every track before any of them starts, so they begin together
			const song = await renderSong(tracks, bpm);

			if (stopped()) return;

			if (song.tracks.length === 0) {
				throw new SongError("There's nothing to play yet.");
			}

			if (!(await awake())) {
				throw new SongError(
					"The browser wouldn't start the audio. Press play again."
				);
			}

			if (stopped()) return;

			// what this song was made from. the studio can have moved on since.
			playingKey.current = songKey(tracks, bpm);

			transport.start(
				song,
				(beatRef.current * 60) / song.bpm,
				// muted tracks start silent instead of being turned down after
				(track) => mutedRef.current.has(track),
				// the song is over when its longest track is, and only then
				() => {
					if (!stopped()) halt(0);
				}
			);

			setPlayback("playing");
		} catch (error) {
			if (stopped()) return;

			console.error(error);
			halt(beatRef.current);

			report(
				error instanceof SongError
					? error.message
					: "Something went wrong playing the song. Try again."
			);
		}
	};

	// A click on the ruler. While stopped it sets where play starts, while
	// playing the song jumps there.
	const seek = (to: number) => {
		// the song that's playing is the one rendered at play. the ruler can
		// have grown since, and a beat past the song's end isn't in it.
		if (transport.playing && (to * 60) / transport.bpm >= transport.duration) {
			return;
		}

		place(to);

		if (transport.playing) {
			transport.seek((to * 60) / transport.bpm);
		}
	};

	// An edit while the song plays: a loop swapped, a clip added or taken out,
	// another tempo. The song is rendered again and the new one takes over
	// from the one that's playing, on the same beat. Until it's ready the old
	// one keeps playing.
	useEffect(() => {
		if (playback !== "playing") return;

		const key = songKey(tracks, bpm);
		if (key === playingKey.current) return;

		const id = run.current;
		let dropped = false;
		const stale = () => dropped || run.current !== id;

		const timer = setTimeout(async () => {
			try {
				const song = await renderSong(tracks, bpm);

				// paused, or edited again while this was rendering
				if (stale()) return;

				const swapped =
					song.tracks.length > 0 &&
					transport.swap(song, (track) => mutedRef.current.has(track));

				if (swapped) {
					playingKey.current = key;
				} else {
					// the song got shorter than where it was, so it's over
					halt(0);
				}
			} catch (error) {
				if (stale()) return;

				console.error(error);

				report(
					error instanceof SongError
						? error.message
						: "Couldn't update the song while it plays. Pause and play again."
				);
			}
		}, SETTLE);

		return () => {
			dropped = true;
			clearTimeout(timer);
		};
	}, [tracks, bpm, playback, transport, halt, report]);

	// leaving the studio stops the song
	useEffect(() => silence, [silence]);

	// On a phone or tablet, going to another tab or locking the screen pauses
	// the song where it got to. iOS stops the audio in the background anyway,
	// and the song would come back out of step with the playhead. Play picks
	// it up again. Desktop keeps playing, since it doesn't cut the audio off.
	useEffect(() => {
		const away = () => {
			if (document.visibilityState !== "hidden") return;
			if (!matchMedia("(pointer: coarse)").matches) return;
			if (transport.playing) {
				halt(liveBeat());
			} else if (playback === "loading") {
				halt(beatRef.current);
			}
		};

		document.addEventListener("visibilitychange", away);
		return () => document.removeEventListener("visibilitychange", away);
	}, [transport, halt, liveBeat, playback]);

	const mute = (track: Track) => {
		const next = new Set(mutedRef.current);
		const on = !next.has(track.id);

		if (on) {
			next.add(track.id);
		} else {
			next.delete(track.id);
		}

		mutedRef.current = next;
		setMuted(next);

		transport.mute(track.id, on);
	};

	return {
		playback,
		play,
		stop,
		seek,
		beat,
		liveBeat,
		looping,
		toggleLoop,
		muted,
		mute,
	};
};
