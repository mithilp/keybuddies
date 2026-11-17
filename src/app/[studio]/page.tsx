"use client";

import { db } from "@/utils/firebase";
import {
	collection,
	doc,
	onSnapshot,
	orderBy,
	query,
} from "firebase/firestore";
import { use, useState, useEffect, useRef } from "react";
import { Playback, Track } from "@/utils/types";

import Sidebar from "@/components/Sidebar/Sidebar";
import Header from "@/components/Header";
import Tracks from "@/components/Tracks";
import Notice from "@/components/Notice";
import crunker from "@/utils/crunker";
import { renderSong, SongError } from "@/utils/song";

// resolves once an audio element has enough loaded to start without a gap
const loaded = (audio: HTMLAudioElement) =>
	new Promise<void>((resolve, reject) => {
		if (audio.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
			resolve();
			return;
		}

		// some browsers won't buffer ahead of a play() call, don't wait forever
		const timer = setTimeout(resolve, 2000);

		audio.addEventListener(
			"canplaythrough",
			() => {
				clearTimeout(timer);
				resolve();
			},
			{ once: true }
		);
		audio.addEventListener(
			"error",
			() => {
				clearTimeout(timer);
				reject(new Error("The rendered audio couldn't be loaded."));
			},
			{ once: true }
		);

		audio.load();
	});

export default function Page(props: { params: Promise<{ studio: string }> }) {
	const { studio } = use(props.params);
	const [bpm, setbpm] = useState("120");

	const [loading, setLoading] = useState(true);

	const [selectedCell, setSelectedCell] = useState<Array<any>>([-1, -1]);

	const [tracks, setTracks] = useState<Array<Track>>([]);

	useEffect(() => {
		const unsub = onSnapshot(doc(db, "studios", studio), (doc) => {
			const source = doc.metadata.hasPendingWrites ? "Local" : "Server";
			setbpm(doc.data()!.bpm);
		});

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
	}, [studio]);

	const [playback, setPlayback] = useState<Playback>("stopped");

	const [notice, setNotice] = useState("");

	// the tracks that are playing, or about to
	const audios = useRef<{ audio: HTMLAudioElement; track: string }[]>([]);

	// Goes up on every play and every stop. A play that finds a different
	// number than the one it started with was stopped and gives up.
	const run = useRef(0);

	const [muted, setMuted] = useState<boolean[]>([]);

	// play() reads this when the tracks start, which is after it was called
	const mutedRef = useRef<boolean[]>([]);

	const silence = () => {
		for (const { audio } of audios.current) {
			audio.pause();
			URL.revokeObjectURL(audio.src);
		}

		audios.current = [];
	};

	const stop = () => {
		run.current++;
		silence();
		setPlayback("stopped");
	};

	const play = async () => {
		const id = ++run.current;
		const stopped = () => run.current !== id;

		silence();
		setNotice("");
		setPlayback("loading");

		try {
			// build every track before any of them starts, so they begin together
			const song = await renderSong(tracks, bpm);

			if (stopped()) return;

			if (song.length == 0) {
				throw new SongError("There's nothing to play yet.");
			}

			audios.current = song.map(({ track, buffer }) => {
				// crunker hands back a url and an element with a url of its own.
				// the element is the one that plays.
				const exported = crunker!.export(buffer, "audio/wav");
				URL.revokeObjectURL(exported.url);

				const audio = exported.element;
				audio.preload = "auto";

				// muted tracks start silent instead of being turned down after
				const index = tracks.findIndex((each) => each.id === track);
				audio.volume = mutedRef.current[index] ? 0 : 1;

				return { audio: audio, track: track };
			});

			const starting = audios.current;

			await Promise.all(starting.map(({ audio }) => loaded(audio)));

			if (stopped()) return;

			// the song is over when its longest track is, and only then
			let longest = 0;
			song.forEach(({ buffer }, index) => {
				if (buffer.duration > song[longest].buffer.duration) {
					longest = index;
				}
			});

			starting[longest].audio.addEventListener(
				"ended",
				() => {
					if (!stopped()) stop();
				},
				{ once: true }
			);

			await Promise.all(starting.map(({ audio }) => audio.play()));

			if (stopped()) return;

			setPlayback("playing");
		} catch (error) {
			// stop() already cleaned up, and pausing is what made play() throw
			if (stopped()) return;

			console.error(error);
			stop();

			if (error instanceof SongError) {
				setNotice(error.message);
			} else if (
				error instanceof DOMException &&
				error.name == "NotAllowedError"
			) {
				setNotice("The browser wouldn't start the audio. Press play again.");
			} else {
				setNotice("Something went wrong playing the song. Try again.");
			}
		}
	};

	// leaving the studio stops the song
	useEffect(() => {
		return () => {
			run.current++;

			for (const { audio } of audios.current) {
				audio.pause();
				URL.revokeObjectURL(audio.src);
			}
		};
	}, []);

	const mute = (track: Track, index: number) => {
		const newMuted = [...mutedRef.current];
		newMuted[index] = !newMuted[index];
		mutedRef.current = newMuted;
		setMuted(newMuted);

		for (const playing of audios.current) {
			if (playing.track === track.id) {
				playing.audio.volume = newMuted[index] ? 0 : 1;
			}
		}
	};

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
				/>
			</main>

			{notice && <Notice message={notice} close={() => setNotice("")} />}
		</div>
	);
}
