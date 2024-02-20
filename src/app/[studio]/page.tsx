"use client";

import { db } from "@/utils/firebase";
import {
	Timestamp,
	addDoc,
	collection,
	doc,
	onSnapshot,
	orderBy,
	query,
	updateDoc,
} from "firebase/firestore";
import { useState, useEffect } from "react";
import {
	FaPause,
	FaPlus,
	FaPlusCircle,
	FaCircle,
	FaPlay,
	FaTrash,
} from "react-icons/fa";
import { Track } from "@/utils/types";

import Sidebar from "@/components/Sidebar/Sidebar";
import Header from "@/components/Header";
import Tracks from "@/components/Tracks";

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
				<Header studio={studio} bpm={bpm} />

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
