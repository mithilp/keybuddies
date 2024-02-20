"use client";

import { DrumMachine } from "smplr";
import { db } from "@/utils/firebase";
import { playDrum } from "@/utils/instruments";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { FaDrum, FaCheck, FaVolumeUp } from "react-icons/fa";
import { FaCircleXmark } from "react-icons/fa6";
import { useState } from "react";

const Drum = ({
	drum,
	studio,
	bpm,
}: {
	drum: DrumMachine;
	studio: string;
	bpm: number;
}) => {
	const [open, setOpen] = useState(false);

	const [sequence, setSequence] = useState<
		Array<{ note: string; start: number }>
	>([{ note: "kick", start: 1 }]);

	const [playing, setPlaying] = useState(false);

	const sounds = [
		"clap",
		"kick",
		"hihat-open",
		"hihat-close",
		"snare",
		"tom-low",
	];

	function playDrums(
		sequence: Array<{ note: string; start: number }>,
		bpm: number
	) {
		setPlaying(true);
		console.log("started");
		playDrum(sequence, bpm);
		console.log("done");
		setPlaying(false);
	}

	return (
		<>
			<button
				onClick={() => {
					setOpen(!open);
				}}
				className="bg-yellow p-4 w-full rounded-xl border-8 border-black cursor-pointer"
			>
				<div className="flex items-center space-x-2">
					<FaDrum size={32} />
					<div className="text-xl">Drums</div>
				</div>
			</button>
			{open && (
				<div className="fixed top-0 left-0 z-20 w-screen h-screen p-24">
					<div className="bg-blue border-8 border-black h-full rounded-xl p-8 space-y-4">
						<div className="flex justify-between items-center">
							<h3 className="text-2xl font-bold">Record a Drum Sound</h3>
							<button onClick={() => setOpen(false)}>
								<FaCircleXmark size={32} />
							</button>
						</div>
						<div className="space-y-4">
							<div className="w-4/6">
								{sounds.map((sound, index) => (
									<div
										key={index}
										className="flex items-center justify-between"
									>
										<div className="w-40">{sound}</div>
										{Array.from(Array(8)).map((_, i) => (
											<button
												key={i}
												onClick={() => {
													if (
														sequence.filter(
															(note) =>
																note.note == sound && note.start == i + 1
														).length > 0
													) {
														setSequence(
															sequence.filter(
																(note) =>
																	note.note != sound || note.start != i + 1
															)
														);
													} else {
														setSequence([
															...sequence,
															{ note: sound, start: i + 1 },
														]);
													}
												}}
												className={`w-10 h-8 rounded-sm text-white my-1 ${
													sequence.filter(
														(note) => note.note == sound && note.start == i + 1
													).length > 0
														? "bg-yellow"
														: "bg-pink"
												}`}
											></button>
										))}
									</div>
								))}
							</div>
							<div className="space-x-4 flex">
								<button
									onClick={() => playDrum(sequence, bpm)}
									className="bg-yellow p-2 flex items-center justify-center space-x-2 border-8 border-black rounded-xl"
								>
									<div>Listen to Recording</div>
									<FaVolumeUp size={32} />
								</button>
								{/* <button
									onClick={save}
									className="bg-yellow p-2 flex items-center justify-center space-x-2 border-8 border-black rounded-xl"
								>
									<div>Save Recording</div>
									<FaCheck size={32} />
								</button> */}
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default Drum;
