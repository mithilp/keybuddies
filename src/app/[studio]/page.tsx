"use client";
import PlayLoop from "@/components/PlayLoop";
import Piano from "@/components/instruments/Piano";
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
import Image from "next/image";
import { useState, useEffect } from "react";
import { FaPause, FaPlus, FaPlusCircle } from "react-icons/fa";
import { FaCircle, FaPlay } from "react-icons/fa6";
import logo from "../../../public/images/keybuddies-logo.png";
import Guitar from "@/components/instruments/Guitar";
import { IoMdTrash } from "react-icons/io";
import { piano } from "@/utils/instruments";
import { MdPiano } from "react-icons/md";
import { drum } from "@/utils/instruments";
import Drum from "@/components/instruments/Drum";
import { Track } from "@/utils/types";

export default function Page({ params }: { params: { studio: string } }) {
	const { studio } = params;
	const [bpm, setbpm] = useState("120");
	const [play, setPlay] = useState("FaPlay");

	const [selectedCell, setSelectedCell] = useState<Array<any>>([-1, -1]);
	const [track1, setTrack1] = useState<Array<any>>([]);
	const [track2, setTrack2] = useState<Array<any>>([]);
	const [track3, setTrack3] = useState<Array<any>>([]);
	const [track4, setTrack4] = useState<Array<any>>([]);
	const [track5, setTrack5] = useState<Array<any>>([]);
	const [track6, setTrack6] = useState<Array<any>>([]);
	const loops = [
		"singersongwriter",
		"bass_1",
		"bass_2",
		"bass_3",
		"bass_4",
		"piano_1",
		"piano_2",
		"piano_3",
		"piano_4",
	];

	const [sounds, setSounds] = useState<
		Array<{
			name: string;
			type: string;
			sequence: { note: number; start: number; end: number };
		}>
	>([]);

	const [tracks, setTracks] = useState<Array<Track>>([]);

	useEffect(() => {
		const unsub = onSnapshot(doc(db, "studios", studio), (doc) => {
			const source = doc.metadata.hasPendingWrites ? "Local" : "Server";
			setbpm(doc.data()!.bpm);
		});

		const soundsUnsub = onSnapshot(
			collection(db, `studios/${studio}/sounds`),
			(querySnapshot) => {
				const freshSounds: Array<{
					name: string;
					type: string;
					sequence: { note: number; start: number; end: number };
				}> = [];
				querySnapshot.forEach((doc) => {
					freshSounds.push({
						name: doc.data().name,
						type: doc.data().type,
						sequence: doc.data().sequence,
					});
				});
				setSounds(freshSounds);
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
			}
		);
	}, []);

	function playTrack(play: string) {
		// const audios1: Array<HTMLAudioElement> = track1.map(
		// 	(track) => new Audio(`/loops/${track}_${bpm}.mp3`)
		// );
		// const audios2: Array<HTMLAudioElement> = track2.map(
		// 	(track) => new Audio(`/loops/${track}_${bpm}.mp3`)
		// );
		// const audios3: Array<HTMLAudioElement> = track3.map(
		// 	(track) => new Audio(`/loops/${track}_${bpm}.mp3`)
		// );
		// if (play === "FaPlay") {
		// 	// playing
		// 	setPlay("FaPause");
		// 	let i: number = 0;
		// 	const interval1 = setInterval(() => {
		// 		audios1[i].play();
		// 		i++;
		// 		if (i == audios1.length) {
		// 			clearInterval(interval1);
		// 		}
		// 		if (i > audios1.length && j > audios2.length && k > audios3.length) {
		// 			setPlay("FaPlay");
		// 		}
		// 	}, 4000);
		// 	let j = 0;
		// 	const interval2 = setInterval(() => {
		// 		audios2[j].play();
		// 		j++;
		// 		if (j == audios2.length) {
		// 			clearInterval(interval2);
		// 		}
		// 		if (i > audios1.length && j > audios2.length && k > audios3.length) {
		// 			setPlay("FaPlay");
		// 		}
		// 	}, 4000);
		// 	let k = 0;
		// 	const interval3 = setInterval(() => {
		// 		audios3[k].play();
		// 		k++;
		// 		if (k == audios3.length) {
		// 			clearInterval(interval3);
		// 		}
		// 		if (i > audios1.length && j > audios2.length && k > audios3.length) {
		// 			setPlay("FaPause");
		// 		}
		// 	}, 4000);
		// } else {
		// 	// pausing
		// 	setPlay("FaPlay");
		// 	audios1.forEach((cell, index) => {
		// 		cell.pause();
		// 	});
		// 	audios2.forEach((cell, index) => {
		// 		cell.pause();
		// 	});
		// 	audios3.forEach((cell, index) => {
		// 		cell.pause();
		// 	});
		// }
	}

	const [selectedOption, setSelectedOption] = useState("loops");
	return (
		<div className="grid grid-cols-3">
			{/* Left column */}
			<div className="col-span-1 bg-blue text-black overflow-y-scroll h-screen border-r-8 border-black">
				<div className="pt-[10px] px-4 pb-[7px]">
					<div className="flex items-center justify-between">
						<Image alt="KeyBuddies Logo" src={logo} width={200} height={45} />
					</div>
					<div className="mt-[10px] w-[100%]">
						<button
							className={`w-[50%] px-4  py-2 rounded-xl font-medium focus:outline-none ${
								selectedOption === "loops" &&
								"bg-yellow border-black border-[8px]"
							}`}
							onClick={() => setSelectedOption("loops")}
						>
							Loops
						</button>
						<button
							className={`w-[50%] px-4 py-2 rounded-xl font-medium focus:outline-none ${
								selectedOption === "instruments" &&
								"bg-yellow border-black border-[8px]"
							}`}
							onClick={() => setSelectedOption("instruments")}
						>
							Instruments
						</button>
					</div>
				</div>

				{/* Content for the selected option will go here */}
				{selectedOption === "loops" && (
					<div className="p-4 space-y-2">
						{loops.map((loop, index) => (
							<div
								key={index}
								onClick={async () => {
									if (selectedCell[0] != -1) {
										const track = tracks.find(
											(track) => track.id === selectedCell[0]
										);
										if (track) {
											track.notes[selectedCell[1]] = loop;
											await updateDoc(
												doc(db, "studios", studio, "tracks", selectedCell[0]),
												{
													notes: track.notes,
												}
											);
										}
										setSelectedCell([-1, -1]);
									}
								}}
								className={`bg-yellow cursor-pointer flex justify-between p-4 rounded-xl border-8 ${
									selectedCell[0] != -1 ? "border-pink" : "border-black"
								}`}
							>
								<div>{loop}</div>
								<PlayLoop
									bpm={bpm}
									selected={selectedCell[0] != -1}
									id={loop}
								/>
							</div>
						))}
					</div>
				)}

				{selectedOption === "instruments" && (
					<div className="p-4 space-y-2">
						<h3 className="text-lg font-medium">Record a New Sound</h3>
						<Piano piano={piano} studio={studio} bpm={Number(bpm)} />
						<Guitar bpm={Number(bpm)} />
						<Drum bpm={Number(bpm)} studio={studio} drum={drum} />
						<h3 className="text-lg font-medium">Recorded Sounds</h3>
						{/* {sounds.map((sound, index) => (
							<div
								key={index}
								onClick={async () => {
									if (selectedCell[0] != -1) {
										const selected = selectedCell;
										if (selected[0] == 1) {
											track1[selected[1]] = sound.name;
											await updateDoc(doc(db, "studios", studio), {
												track1: track1,
											});
										} else if (selected[0] == 2) {
											track2[selected[1]] = sound.name;
											await updateDoc(doc(db, "studios", studio), {
												track2: track2,
											});
										} else if (selected[0] == 3) {
											track3[selected[1]] = sound.name;
											await updateDoc(doc(db, "studios", studio), {
												track3: track3,
											});
										}
										setSelectedCell([-1, -1]);
									}
								}}
								className={`bg-yellow cursor-pointer flex justify-between p-4 rounded-xl border-8 ${
									selectedCell[0] != -1 ? "border-pink" : "border-black"
								}`}
							>
								<div className="flex items-center space-x-2">
									{sound.type == "piano" ? (
										<MdPiano size={32} />
									) : (
										<FaGuitar size={32} />
									)}

									<div className="text-xl">{sound.name}</div>
								</div>
							</div>
						))} */}
					</div>
				)}
			</div>

			{/* Right column (two-thirds of the screen) */}
			<main className="col-span-2 h-screen overflow-y-scroll">
				{/* Main content will go here */}

				{/* header */}
				<div className="flex sticky top-0 justify-between border-black border-b-8 py-6 px-4">
					<div>
						<span className="leading-7 uppercase font-black">Studio Code</span>
						<br />
						<span className="leading-8 text-5xl font-black">{studio}</span>
					</div>

					<div className="flex space-x-2 items-center">
						<h1 className="text-3xl font-black">BPM:</h1>
						<select
							value={bpm}
							onChange={(e) => {
								updateDoc(doc(db, "studios", studio), {
									bpm: e.target.value,
								});
							}}
							className="bg-yellow border-8 px-2 rounded-xl border-black h-16 text-3xl font-black"
						>
							<option value="80">80</option>
							<option value="120">120</option>
							<option value="160">160</option>
						</select>
						<button className="bg-yellow border-8 border-black grid place-items-center h-16 w-16 rounded-xl text-3xl font-black">
							<FaCircle color="#ff6767" />
						</button>
						<button
							onClick={() => playTrack(play)}
							className="bg-yellow border-8 border-black grid place-items-center h-16 w-16 rounded-xl text-3xl font-black"
						>
							{play === "FaPlay" ? (
								<FaPlay color="#000000" />
							) : (
								<FaPause color="#000000" />
							)}
						</button>
					</div>
				</div>

				{/* rows content */}
				<div className="p-10 space-y-4 w-full overflow-x-scroll">
					{tracks.map((track, index) => (
						<div key={index}>
							<h3 className="text-lg uppercase font-black">{track.name}</h3>
							<div className="flex items-center space-x-2">
								{track.notes.map((note, index) => (
									<div
										key={index}
										className={`flex bg-yellow p-4 rounded-xl border-8 cursor-pointer ${
											track.id == selectedCell[0] && index == selectedCell[1]
												? "border-blue"
												: "border-black"
										}`}
									>
										<div
											className="w-36"
											onClick={() => {
												if (
													selectedCell[0] == track.id &&
													selectedCell[1] == index
												) {
													setSelectedCell([-1, -1]);
												}

												setSelectedCell([track.id, index]);
											}}
										>
											{note == -1 ? "Select a loop" : note}
										</div>
										<button
											className="text-2xl"
											onClick={async () => {
												track.notes.splice(index, 1);
												await updateDoc(doc(db, "studios", studio, track.id), {
													notes: track.notes,
												});
											}}
										>
											<IoMdTrash />
										</button>
									</div>
								))}

								<button
									className="pr-4"
									onClick={async () => {
										await updateDoc(doc(db, "studios", studio, track.id), {
											notes: [...track.notes, -1],
										});
									}}
								>
									<FaPlusCircle color="black" size={32} />
								</button>
							</div>
						</div>
					))}

					<div className="border-t-2 border-black pt-4 sticky left-0">
						<button
							onClick={async () => {
								await addDoc(collection(db, `studios/${studio}/tracks`), {
									createdAt: Timestamp.now(),
									name: `Track ${tracks.length + 1}`,
									order: tracks.length,
									notes: [-1, -1, -1, -1],
								});
							}}
							className="bg-yellow border-8 p-2 border-black flex items-center space-x-2 rounded-xl text-xl font-bold"
						>
							<FaPlus />
							<div>New Track</div>
						</button>
					</div>
				</div>
			</main>
		</div>
	);
}
