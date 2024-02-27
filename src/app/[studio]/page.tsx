"use client";

import { db } from "@/utils/firebase";
import {
	collection,
	doc,
	getDoc,
	onSnapshot,
	orderBy,
	query,
} from "firebase/firestore";
import { useState, useEffect, useCallback } from "react";
import { Key, Track } from "@/utils/types";

import Sidebar from "@/components/Sidebar/Sidebar";
import Header from "@/components/Header";
import Tracks from "@/components/Tracks";
import crunker from "@/utils/crunker";
import { playDrum, playPiano } from "@/utils/instruments";
import MIDI from "@/utils/MIDI";

export default function Page({ params }: { params: { studio: string } }) {
	const { studio } = params;
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

	const [audios, setAudios] = useState<HTMLAudioElement[]>([]);

	const play = async (onFinish: Function) => {
		const newAudios: HTMLAudioElement[] = [];

		for await (const track of tracks) {
			if (crunker) {
				const loopsToPlay: string[] = [];

				let i = 0;
				for await (const cell of track.notes) {
					if (cell.type == "loop") {
						loopsToPlay.push(`/loops/${cell.id}_${bpm}.mp3`);
					} else if (cell.type == "sound") {
						const snap = await getDoc(doc(db, "sounds", cell.id));

						const time = 7500 / Number(bpm);

						const music = snap.data()!.sequence;

						const audios: AudioBuffer[] = [];

						for await (const key of music) {
							const note: any = MIDI.filter(
								(midi) => midi.value === key.note
							)[0].text;
							const start = key.start;
							const end = key.end;

							const buffers = await crunker?.fetchAudio(
								`/sounds/piano/${note}.ogg`
							);

							if (buffers) {
								const trimmed = crunker?.sliceAudio(
									buffers[0],
									0,
									((end - start) * time) / 1000
								);
								const padded = crunker?.padAudio(
									trimmed!,
									0,
									(start * time) / 1000
								);

								audios.push(padded!);
							} else {
								console.log("Something went wrong loading key", note);
							}
						}

						const merged = crunker?.mergeAudio(
							audios.concat(
								await crunker.fetchAudio(`/loops/silent_${bpm}.mp3`)
							)
						);

						const exported = crunker?.export(merged!, "audio/mp3");
						loopsToPlay.push(exported.url);
					} else {
						loopsToPlay.push(`/loops/silent_${bpm}.mp3`);
					}
					i++;
				}

				const buffers = await crunker.fetchAudio(...loopsToPlay);
				const concat = crunker.concatAudio(buffers);
				const exported = crunker.export(concat, "audio/mp3");
				const audio = new Audio(exported.url);
				audio.play();

				newAudios.push(audio);

				setTimeout(() => onFinish(), concat.duration * 1000);
			}
		}

		setAudios(newAudios);
	};

	const stop = () => {
		for (const audio of audios) {
			audio.pause();
		}

		setAudios([]);
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
				/>
			</main>
		</div>
	);
}
