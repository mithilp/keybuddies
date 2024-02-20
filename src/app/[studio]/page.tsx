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
import { useState, useEffect } from "react";
import { Key, Track } from "@/utils/types";

import Sidebar from "@/components/Sidebar/Sidebar";
import Header from "@/components/Header";
import Tracks from "@/components/Tracks";
import crunker from "@/utils/crunker";
import { playPiano } from "@/utils/instruments";

export default function Page({ params }: { params: { studio: string } }) {
	const { studio } = params;
	const [bpm, setbpm] = useState("120");

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
			}
		);
	}, []);

	const play = async (onFinish: Function) => {
		for await (const track of tracks) {
			if (crunker) {
				const loopsToPlay: string[] = [];
				const sequences: { start: number; sequence: Key[] }[] = [];

				let i = 0;
				for await (const cell of track.notes) {
					console.log(cell);
					if (cell.type == "loop") {
						loopsToPlay.push(`/loops/${cell.id}_${bpm}.mp3`);
					} else if (cell.type == "sound") {
						const snap = await getDoc(
							doc(db, "studios", studio, "sounds", cell.id)
						);
						sequences.push({
							start: (480000 * i) / Number(bpm),
							sequence: snap.data()!.sequence,
						});
						loopsToPlay.push(`/loops/silent_${bpm}.mp3`);
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

				sequences.forEach(({ start, sequence }) => {
					setTimeout(() => {
						playPiano(sequence, Number(bpm));
					}, start);
				});

				setTimeout(() => onFinish(), concat.duration * 1000);
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
				<Header studio={studio} bpm={bpm} play={play} />

				{/* rows content */}
				<Tracks
					setSelectedCell={setSelectedCell}
					selectedCell={selectedCell}
					tracks={tracks}
					bpm={bpm}
					studio={studio}
				/>
			</main>
		</div>
	);
}
