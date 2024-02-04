"use client";
import PlayLoop from "@/components/PlayLoop";
import Piano from "@/components/instruments/Piano";
import { db } from "@/utils/firebase";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { useState, useEffect } from "react";
import { FaPause, FaPlus, FaPlusCircle } from "react-icons/fa";
import { FaCircle, FaPlay } from "react-icons/fa6";

export default function Page({ params }: { params: { studio: string } }) {
	const { studio } = params;
	const [bpm, setbpm] = useState("120");
	const [play, setPlay] = useState("FaPlay");

	const [selectedCell, setSelectedCell] = useState([-1, -1]);
	const [track1, setTrack1] = useState<Array<any>>([]);
	const loops = ["singersongwriter"];

	useEffect(() => {
		const unsub = onSnapshot(doc(db, "studios", studio), (doc) => {
			const source = doc.metadata.hasPendingWrites ? "Local" : "Server";
			console.log("updating");
			setTrack1(doc.data()!.track1);
		});
	}, []);

	const [selectedOption, setSelectedOption] = useState("loops");
	return (
		<div className="grid grid-cols-3">
			{/* Left column */}
			<div className="col-span-1 bg-blue text-black h-screen border-r-8 border-black">
				<div className="pt-[10px] px-4 pb-[7px]">
					<div className="flex items-center justify-between">
						<img src="/keybuddies-logo.png" className="h-[45px]"></img>
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
							onChange={(e) => setbpm(e.target.value)}
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
							onClick={() =>
								play === "FaPlay" ? setPlay("FaPause") : setPlay("FaPlay")
							}
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
					</div>
				</div>
			</main>
		</div>
	);
}
