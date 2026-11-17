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
import { Track } from "@/utils/types";

import Sidebar from "@/components/Sidebar/Sidebar";
import Header from "@/components/Header";
import Tracks from "@/components/Tracks";
import crunker from "@/utils/crunker";
import { renderSong } from "@/utils/song";

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

	const [audios, setAudios] = useState<
		{ audio: HTMLAudioElement; track: string }[]
	>([]);

	const [muted, setMuted] = useState<boolean[]>([]);

	// play() reads this when the tracks start, which is after it was called
	const mutedRef = useRef<boolean[]>([]);

	const play = async (onFinish: Function) => {
		// build every track before any of them starts, so they begin together
		const song = await renderSong(tracks, bpm);

		const newAudios = song.map(({ track, buffer }) => {
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

		await Promise.all(newAudios.map(({ audio }) => loaded(audio)));

		for (const { audio } of newAudios) {
			audio.play();
		}

		setAudios(newAudios);

		const longest = Math.max(0, ...song.map(({ buffer }) => buffer.duration));
		setTimeout(() => onFinish(), longest * 1000);
	};

	const stop = () => {
		for (const track of audios) {
			track.audio.pause();
		}

		setAudios([]);
	};

	const mute = (track: Track, index: number) => {
		const newMuted = [...mutedRef.current];
		newMuted[index] = !newMuted[index];
		mutedRef.current = newMuted;
		setMuted(newMuted);

		for (const playing of audios) {
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
				<Header studio={studio} bpm={bpm} play={play} stop={stop} />

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
		</div>
	);
}
