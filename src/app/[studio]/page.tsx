"use client";

import { db } from "@/utils/firebase";
import {
	collection,
	doc,
	onSnapshot,
	orderBy,
	query,
} from "firebase/firestore";
import { use, useState, useEffect, useRef, useCallback } from "react";
import { Playback, Track } from "@/utils/types";

import Sidebar from "@/components/Sidebar/Sidebar";
import Header from "@/components/Header";
import Tracks from "@/components/Tracks";
import Notice from "@/components/Notice";
import StudioNotFound from "@/components/StudioNotFound";
import crunker, { awake, wake } from "@/utils/crunker";
import { renderSong, SongError } from "@/utils/song";
import { Transport } from "@/utils/transport";
import { mixDown, save, toWav } from "@/utils/export";

export default function Page(props: { params: Promise<{ studio: string }> }) {
	const { studio } = use(props.params);
	const [bpm, setbpm] = useState("120");

	// null until firestore says whether this studio exists
	const [found, setFound] = useState<boolean | null>(null);

	const [loading, setLoading] = useState(true);

	const [selectedCell, setSelectedCell] = useState<Array<any>>([-1, -1]);

	const [tracks, setTracks] = useState<Array<Track>>([]);

	useEffect(() => {
		// metadata changes are included so a studio that isn't in the cache
		// still gets a second snapshot once the server has answered
		const unsub = onSnapshot(
			doc(db, "studios", studio),
			{ includeMetadataChanges: true },
			(snap) => {
				const data = snap.data();

				if (!data) {
					// an empty cache only means firestore hasn't been reached yet.
					// keep the spinner until the server says it isn't there.
					if (!snap.metadata.fromCache) setFound(false);
					return;
				}

				setFound(true);
				setbpm(data.bpm ?? "120");
			},
			(error) => {
				// a code firestore won't even look up isn't a studio either
				console.error(error);
				setFound(false);
			}
		);

		const tracksUnsub = onSnapshot(
			query(collection(db, `studios/${studio}/tracks`), orderBy("order")),
			(querySnapshot) => {
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
			}
		);

		return () => {
			unsub();
			tracksUnsub();
		};
	}, [studio]);

	const [playback, setPlayback] = useState<Playback>("stopped");

	const [notice, setNotice] = useState("");

	// Where the playhead rests while nothing is playing, in beats from the
	// start of the song. Play starts from here.
	const [beat, setBeat] = useState(0);
	const beatRef = useRef(0);

	const place = (to: number) => {
		beatRef.current = to;
		setBeat(to);
	};

	const [transport] = useState(() => new Transport());

	// the tempo the playing song was rendered at. the studio's can change
	// under it.
	const playingBpm = useRef(120);

	// where the song is right now, in beats. the playhead reads this on every
	// frame while the song plays.
	const liveBeat = useCallback(
		() => (transport.position() * playingBpm.current) / 60,
		[transport]
	);

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

	// stops everything and leaves the playhead at `at`
	const halt = (at: number) => {
		run.current++;
		transport.stop();
		setPlayback("stopped");
		place(at);
	};

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

			playingBpm.current = song.bpm;

			// the song is over when its longest track is, and only then
			transport.onEnded = () => {
				if (!stopped()) halt(0);
			};

			// muted tracks start silent instead of being turned down after
			transport.start(song, (beatRef.current * 60) / song.bpm, (track) =>
				mutedRef.current.has(track)
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
		if (
			transport.playing &&
			(to * 60) / playingBpm.current >= transport.duration
		) {
			return;
		}

		place(to);

		if (transport.playing) {
			transport.seek((to * 60) / playingBpm.current);
		}
	};

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
	useEffect(() => {
		return () => {
			run.current++;
			transport.stop();
		};
	}, [transport]);

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

	if (found === false) {
		return <StudioNotFound studio={studio} />;
	}

	if (found === null) {
		return (
			<div className="h-screen w-screen grid place-items-center">
				<div className="animate-spin w-16 h-16 border-8 border-yellow border-b-transparent rounded-full"></div>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-3">
			{/* Left column */}
			<Sidebar
				setSelectedCell={setSelectedCell}
				selectedCell={selectedCell}
				tracks={tracks}
				bpm={bpm}
				studio={studio}
			/>

			{/* Right column (two-thirds of the screen) */}
			<main className="col-span-2 h-screen overflow-y-scroll">
				{/* Main content will go here */}

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
					setSelectedCell={setSelectedCell}
					selectedCell={selectedCell}
					tracks={tracks}
					bpm={bpm}
					loading={loading}
					studio={studio}
					mute={mute}
					muted={muted}
					beat={beat}
					playing={playback == "playing"}
					liveBeat={liveBeat}
					seek={seek}
				/>
			</main>

			{notice && <Notice message={notice} close={() => setNotice("")} />}
		</div>
	);
}
