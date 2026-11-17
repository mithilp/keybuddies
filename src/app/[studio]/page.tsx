"use client";

import { db } from "@/utils/firebase";
import {
	collection,
	doc,
	onSnapshot,
	orderBy,
	query,
} from "firebase/firestore";
import { use, useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Playback, Track } from "@/utils/types";

import Sidebar from "@/components/Sidebar/Sidebar";
import Header from "@/components/Header";
import Tracks from "@/components/Tracks";
import Notice from "@/components/Notice";
import StudioNotFound from "@/components/StudioNotFound";
import StudioFailed from "@/components/StudioFailed";
import { isStudioCode } from "@/utils/studio-code";
import crunker, { awake, wake } from "@/utils/crunker";
import { renderSong, songKey, SongError } from "@/utils/song";
import { Transport } from "@/utils/transport";
import { usePlacing } from "@/utils/placing";
import { studioLoops } from "@/utils/loops";
import { mixDown, save, toWav } from "@/utils/export";

// how long firestore gets to answer before the studio counts as not loading
const PATIENCE = 10000;

// How long the song waits after an edit before it's rendered again, in ms.
// Edits come in bursts and every render is a whole song.
const SETTLE = 150;

export default function Page(props: { params: Promise<{ studio: string }> }) {
	const { studio } = use(props.params);

	// only a code that can't be a studio is known to be nothing without asking
	if (!isStudioCode(studio)) {
		return <StudioNotFound studio={studio} />;
	}

	// another studio is another page, with nothing left over from this one
	return <Studio key={studio} studio={studio} />;
}

function Studio({ studio }: { studio: string }) {
	const [bpm, setbpm] = useState("120");

	// What firestore has said about the studio so far. "missing" is the server
	// saying there's no such studio. "failed" is not getting an answer, and
	// says nothing about whether the studio exists.
	const [load, setLoad] = useState<"loading" | "ready" | "missing" | "failed">(
		"loading"
	);

	// goes up to ask firestore again
	const [attempt, setAttempt] = useState(0);

	const retry = () => {
		setLoad("loading");
		setAttempt(attempt + 1);
	};

	const [loading, setLoading] = useState(true);

	const [tracks, setTracks] = useState<Array<Track>>([]);

	// The studio's `library` and `libraryRemoved` fields, as they came. A
	// studio from before the library has neither.
	const [library, setLibrary] = useState<{ added: unknown; removed: unknown }>(
		{ added: undefined, removed: undefined }
	);

	// the library loops this studio has, for the sidebar
	const loops = useMemo(
		() => studioLoops(tracks, library.added, library.removed),
		[tracks, library]
	);

	const [playback, setPlayback] = useState<Playback>("stopped");

	const [notice, setNotice] = useState("");

	// which cell or which loop or sound is picked, and putting one in the other
	const placing = usePlacing(studio, tracks, setNotice);

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

	useEffect(() => {
		// A listener that got an error is over, nothing more comes from it.
		// The other one is ignored from then on, half a studio isn't shown.
		let over = false;

		const failed = (error: Error) => {
			console.error(error);
			over = true;

			// the song would go on playing behind the message
			halt(beatRef.current);
			setLoad("failed");
		};

		// With no connection firestore doesn't fail, it waits. The listeners
		// stay on, so the studio still shows up if the answer comes late.
		const slow = setTimeout(() => {
			setLoad((load) => (load == "loading" ? "failed" : load));
		}, PATIENCE);

		// metadata changes are included so a studio that isn't in the cache
		// still gets a second snapshot once the server has answered
		const unsub = onSnapshot(
			doc(db, "studios", studio),
			{ includeMetadataChanges: true },
			(snap) => {
				if (over) return;

				const data = snap.data();

				if (!data) {
					// an empty cache only means firestore hasn't been reached yet.
					// keep the spinner until the server says it isn't there.
					if (!snap.metadata.fromCache) setLoad("missing");
					return;
				}

				setLoad("ready");
				setbpm(data.bpm ?? "120");
				setLibrary({ added: data.library, removed: data.libraryRemoved });
			},
			failed
		);

		const tracksUnsub = onSnapshot(
			query(collection(db, `studios/${studio}/tracks`), orderBy("order")),
			(querySnapshot) => {
				if (over) return;

				const freshTracks: Array<Track> = [];

				querySnapshot.forEach((doc) => {
					freshTracks.push({
						name: doc.data().name,
						createdAt: doc.data().createdAt,
						order: doc.data().order,
						notes: doc.data().notes,
						id: doc.id,
					});
				});
				setTracks(freshTracks);

				setLoading(false);
			},
			failed
		);

		return () => {
			clearTimeout(slow);
			unsub();
			tracksUnsub();
		};
	}, [studio, attempt, halt]);

	// the pause button. the playhead stays where the song got to.
	const stop = () => {
		halt(transport.playing ? liveBeat() : beatRef.current);
	};

	const play = async () => {
		const id = ++run.current;
		const stopped = () => run.current !== id;

		// browsers only let audio start from a click, and by the time the
		// song is rendered this isn't one anymore
		if (crunker) wake();

		setNotice("");
		setPlayback("loading");

		try {
			// build every track before any of them starts, so they begin together
			const song = await renderSong(tracks, bpm);

			if (stopped()) return;

			if (song.tracks.length == 0) {
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

			if (error instanceof SongError) {
				setNotice(error.message);
			} else {
				setNotice("Something went wrong playing the song. Try again.");
			}
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

	// An edit while the song plays: a loop swapped, a cell added or taken
	// out, another tempo. The song is rendered again and the new one takes
	// over from the one that's playing, on the same beat. Until it's ready
	// the old one keeps playing.
	useEffect(() => {
		if (playback != "playing") return;

		const key = songKey(tracks, bpm);
		if (key == playingKey.current) return;

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

				setNotice(
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
	}, [tracks, bpm, playback, transport, halt]);

	// null when no download is being made, otherwise how far along it is
	// from 0 to 1
	const [exporting, setExporting] = useState<number | null>(null);

	// Saves the song as one WAV file. It's the whole song, muted tracks
	// too: mute only lives in this browser, so the file would depend on
	// what happened to be muted here.
	const download = async () => {
		if (exporting !== null) return;

		const hasSound = (track: Track) =>
			track.notes.some((cell) => cell.type != "empty");

		if (!tracks.some(hasSound)) {
			setNotice("There's nothing to export yet.");
			return;
		}

		setNotice("");
		setExporting(0);

		try {
			const song = await renderSong(tracks, bpm, (ready, total) =>
				setExporting(ready / total)
			);

			save(toWav(mixDown(song)), `keybuddies-${studio}.wav`);
		} catch (error) {
			console.error(error);

			if (error instanceof SongError) {
				setNotice(error.message);
			} else {
				setNotice("Something went wrong exporting the song. Try again.");
			}
		} finally {
			setExporting(null);
		}
	};

	// leaving the studio stops the song
	useEffect(() => silence, [silence]);

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

	if (load == "missing") {
		return <StudioNotFound studio={studio} />;
	}

	if (load == "failed") {
		return <StudioFailed studio={studio} retry={retry} />;
	}

	if (load == "loading") {
		return (
			<div className="h-screen w-screen grid place-items-center">
				<div className="animate-spin w-16 h-16 border-8 border-yellow border-b-transparent rounded-full"></div>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-3">
			{/* Left column */}
			<Sidebar placing={placing} bpm={bpm} studio={studio} loops={loops} />

			{/* Right column (two-thirds of the screen). The header is not inside
			    the part that scrolls, so the tracks can't end up over or under
			    it whichever way they're scrolled. */}
			<main className="col-span-2 h-screen min-w-0 flex flex-col">
				{/* header */}
				<Header
					studio={studio}
					bpm={bpm}
					playback={playback}
					play={play}
					stop={stop}
					looping={looping}
					toggleLoop={toggleLoop}
					exporting={exporting}
					download={download}
				/>

				{/* rows content */}
				<Tracks
					placing={placing}
					tracks={tracks}
					loading={loading}
					studio={studio}
					mute={mute}
					muted={muted}
					beat={beat}
					playing={playback == "playing"}
					liveBeat={liveBeat}
					seek={seek}
					failed={setNotice}
				/>
			</main>

			{notice && <Notice message={notice} close={() => setNotice("")} />}
		</div>
	);
}
