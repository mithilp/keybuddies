"use client";
import PlayLoop from "@/components/PlayLoop";
import Piano from "@/components/instruments/Piano";
import { db } from "@/utils/firebase";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import Image from "next/image";
import { useState, useEffect } from "react";
import { FaPause, FaPlus, FaPlusCircle } from "react-icons/fa";
import { FaCircle, FaPlay } from "react-icons/fa6";

export default function Page({ params }: { params: { studio: string } }) {
	const { studio } = params;
	const [bpm, setbpm] = useState("120");
	const [play, setPlay] = useState("FaPlay");

	const [selectedCell, setSelectedCell] = useState([-1, -1]);
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

	useEffect(() => {
		const unsub = onSnapshot(doc(db, "studios", studio), (doc) => {
			const source = doc.metadata.hasPendingWrites ? "Local" : "Server";
			console.log("updating");
			setTrack1(doc.data()!.track1);
			setTrack2(doc.data()!.track2);
			setTrack3(doc.data()!.track3);
			setbpm(doc.data()!.bpm);
		});
	}, []);

	function playTrack(play: string) {
		const audios1: Array<HTMLAudioElement> = track1.map(
			(track) => new Audio(`/loops/${track}_${bpm}.mp3`)
		);
		const audios2: Array<HTMLAudioElement> = track2.map(
			(track) => new Audio(`/loops/${track}_${bpm}.mp3`)
		);
		const audios3: Array<HTMLAudioElement> = track3.map(
			(track) => new Audio(`/loops/${track}_${bpm}.mp3`)
		);

		if (play === "FaPlay") {
			// playing
			setPlay("FaPause");
			let i: number = 0;
			const interval1 = setInterval(() => {
				audios1[i].play();

				i++;

				if (i == audios1.length) {
					clearInterval(interval1);
				}
				if (i > audios1.length && j > audios2.length && k > audios3.length) {
					setPlay("FaPlay");
				}
			}, 4000);

			let j = 0;
			const interval2 = setInterval(() => {
				audios2[j].play();
				j++;
				if (j == audios2.length) {
					clearInterval(interval2);
				}
				if (i > audios1.length && j > audios2.length && k > audios3.length) {
					setPlay("FaPlay");
				}
			}, 4000);

			let k = 0;
			const interval3 = setInterval(() => {
				audios3[k].play();
				k++;
				if (k == audios3.length) {
					clearInterval(interval2);
				}
				if (i > audios1.length && j > audios2.length && k > audios3.length) {
					setPlay("FaPause");
				}
			}, 4000);
		} else {
			// pausing
			setPlay("FaPlay");
			audios1.forEach((cell, index) => {
				cell.pause();
			});
			audios2.forEach((cell, index) => {
				cell.pause();
			});
			audios3.forEach((cell, index) => {
				cell.pause();
			});
		}
	}

	const [selectedOption, setSelectedOption] = useState("loops");
	return (
		<div className="grid grid-cols-3">
			{/* Left column */}
			<div className="col-span-1 bg-blue text-black h-screen border-r-8 border-black">
				<div className="pt-[10px] px-4 pb-[7px]">
					<div className="flex items-center justify-between">
						<Image
							alt="KeyBuddies Logo"
							src="/images/keybuddies-logo.png"
							width={200}
							height={45}
						/>
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
								selectedOption === "sounds" &&
								"bg-yellow border-black border-[8px]"
							}`}
							onClick={() => setSelectedOption("sounds")}
						>
							Sounds
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
										const selected = selectedCell;
										if (selected[0] == 1) {
											track1[selected[1]] = loop;
											await updateDoc(doc(db, "studios", studio), {
												track1: track1,
											});
										} else if (selected[0] == 2) {
											track2[selected[1]] = loop;
											await updateDoc(doc(db, "studios", studio), {
												track2: track2,
											});
										} else if (selected[0] == 3) {
											track3[selected[1]] = loop;
											await updateDoc(doc(db, "studios", studio), {
												track3: track3,
											});
										}
										setSelectedCell([-1, -1]);
									}
								}}
								className={`transition bg-yellow cursor-pointer flex justify-between p-4 rounded-xl border-8 ${
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
				{selectedOption === "sounds" && (
					<div className="p-4">
						<h3 className="text-lg font-medium">Sounds content</h3>
						<Piano />
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
				<div className="py-6 px-4 space-y-2 w-full">
					<div className="rounded-xl px-4 py-2 relative">
						<h3 className="text-lg uppercase font-black ">Track 1</h3>
						<div className="overflow-x-scroll flex items-center space-x-2">
							{track1.map((track, index) => (
								<div
									key={index}
									className="bg-yellow p-4 rounded-xl border-8 border-black cursor-pointer"
									onClick={() => {
										if (selectedCell[0] == 1 && selectedCell[1] == index) {
											setSelectedCell([-1, -1]);
										}

										setSelectedCell([1, index]);
									}}
								>
									<div className="w-36">
										{track == -1 ? "Select a loop" : track}
									</div>
								</div>
							))}

							<button
								onClick={async () => {
									await updateDoc(doc(db, "studios", studio), {
										track1: [...track1, -1],
									});
								}}
							>
								<FaPlusCircle color="black" size={32} />
							</button>
						</div>

						<h3 className="text-lg uppercase font-black ">Track 2</h3>
						<div className="overflow-x-scroll flex items-center space-x-2">
							{track2.map((track, index) => (
								<div
									key={index}
									className="bg-yellow p-4 rounded-xl border-8 border-black cursor-pointer"
									onClick={() => {
										if (selectedCell[0] == 2 && selectedCell[1] == index) {
											setSelectedCell([-1, -1]);
										}

										setSelectedCell([2, index]);
									}}
								>
									<div className="w-36">
										{track == -1 ? "Select a loop" : track}
									</div>
								</div>
							))}

							<button
								onClick={async () => {
									await updateDoc(doc(db, "studios", studio), {
										track2: [...track2, -1],
									});
								}}
							>
								<FaPlusCircle color="black" size={32} />
							</button>
						</div>

						<h3 className="text-lg uppercase font-black ">Track 3</h3>
						<div className="overflow-x-scroll flex items-center space-x-2">
							{track3.map((track, index) => (
								<div
									key={index}
									className="bg-yellow p-4 rounded-xl border-8 border-black cursor-pointer"
									onClick={() => {
										if (selectedCell[0] == 3 && selectedCell[1] == index) {
											setSelectedCell([-1, -1]);
										}

										setSelectedCell([3, index]);
									}}
								>
									<div className="w-36">
										{track == -1 ? "Select a loop" : track}
									</div>
								</div>
							))}

							<button
								onClick={async () => {
									await updateDoc(doc(db, "studios", studio), {
										track3: [...track3, -1],
									});
								}}
							>
								<FaPlusCircle color="black" size={32} />
							</button>
						</div>

						<h3 className="text-lg uppercase font-black ">Track 4</h3>
						<div className="overflow-x-scroll flex items-center space-x-2">
							{track4.map((track, index) => (
								<div
									key={index}
									className="bg-yellow p-4 rounded-xl border-8 border-black cursor-pointer"
									onClick={() => {
										if (selectedCell[0] == 4 && selectedCell[1] == index) {
											setSelectedCell([-1, -1]);
										}

										setSelectedCell([4, index]);
									}}
								>
									<div className="w-36">
										{track == -1 ? "Select a loop" : track}
									</div>
								</div>
							))}

							<button
								onClick={async () => {
									await updateDoc(doc(db, "studios", studio), {
										track4: [...track4, -1],
									});
								}}
							>
								<FaPlusCircle color="black" size={32} />
							</button>
						</div>

						<h3 className="text-lg uppercase font-black ">Track 5</h3>
						<div className="overflow-x-scroll flex items-center space-x-2">
							{track5.map((track, index) => (
								<div
									key={index}
									className="bg-yellow p-4 rounded-xl border-8 border-black cursor-pointer"
									onClick={() => {
										if (selectedCell[0] == 5 && selectedCell[1] == index) {
											setSelectedCell([-1, -1]);
										}

										setSelectedCell([5, index]);
									}}
								>
									<div className="w-36">
										{track == -1 ? "Select a loop" : track}
									</div>
								</div>
							))}

							<button
								onClick={async () => {
									await updateDoc(doc(db, "studios", studio), {
										track5: [...track5, -1],
									});
								}}
							>
								<FaPlusCircle color="black" size={32} />
							</button>
						</div>

						<h3 className="text-lg uppercase font-black ">Track 6</h3>
						<div className="overflow-x-scroll flex items-center space-x-2">
							{track6.map((track, index) => (
								<div
									key={index}
									className="bg-yellow p-4 rounded-xl border-8 border-black cursor-pointer"
									onClick={() => {
										if (selectedCell[0] == 6 && selectedCell[1] == index) {
											setSelectedCell([-1, -1]);
										}

										setSelectedCell([6, index]);
									}}
								>
									<div className="w-36">
										{track == -1 ? "Select a loop" : track}
									</div>
								</div>
							))}

							<button
								onClick={async () => {
									await updateDoc(doc(db, "studios", studio), {
										track6: [...track6, -1],
									});
								}}
							>
								<FaPlusCircle color="black" size={32} />
							</button>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
