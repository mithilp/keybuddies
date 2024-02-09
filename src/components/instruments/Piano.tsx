"use client";

import { db } from "@/utils/firebase";
import { playPiano } from "@/utils/instruments";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import { FaCheck, FaVolumeUp } from "react-icons/fa";
import { FaCircleXmark } from "react-icons/fa6";
import { MdPiano } from "react-icons/md";
import {
	Piano as ReactPiano,
	KeyboardShortcuts,
	MidiNumbers,
	//@ts-ignore
} from "react-piano";
import "react-piano/dist/styles.css";
import { Soundfont } from "smplr";

const Piano = ({
	piano,
	studio,
	bpm,
}: {
	piano: Soundfont;
	studio: string;
	bpm: number;
}) => {
	const multiplier = 7500 / bpm;

	const [open, setOpen] = useState(false);

	const [firstNote, setFirstNote] = useState(MidiNumbers.fromNote("c3"));
	const [lastNote, setLastNote] = useState(MidiNumbers.fromNote("f5"));

	const keyboardShortcuts = KeyboardShortcuts.create({
		firstNote: firstNote,
		lastNote: lastNote,
		keyboardConfig: KeyboardShortcuts.HOME_ROW,
	});

	const [sequence, setSequence] = useState<
		Array<{ note: number; start: number; end: number }>
	>([]);
	const [recording, setRecording] = useState(false);

	const [startTime, setStartTime] = useState<number>(Date.now());

	const [countdown, setCountdown] = useState(0);

	const record = async () => {
		if (!recording) {
			for (let i = 3; i > -1; i--) {
				setCountdown(i);
				if (i != 0) {
					await new Promise((resolve) => setTimeout(resolve, 1000));
				}
			}

			setSequence([]);
			setStartTime(Date.now());
			setRecording(true);
		} else {
			setRecording(false);
		}
	};

	const updateArray = (noteNumber: number, endTime: number) => {
		for (let i = sequence.length - 1; i >= 0; i--) {
			if (sequence[i].note === noteNumber) {
				sequence[i].end = endTime;
				return sequence;
			}
		}
		return sequence;
	};

	const save = async () => {
		const name = prompt("Name your recording");

		await addDoc(collection(db, `studios/${studio}/sounds`), {
			name: name,
			type: "piano",
			sequence: sequence,
		});

		setOpen(false);
	};

	const MIDI = [
		{ value: 12, text: "C0" },
		{ value: 14, text: "D0" },
		{ value: 16, text: "E0" },
		{ value: 17, text: "F0" },
		{ value: 19, text: "G0" },
		{ value: 21, text: "A0" },
		{ value: 23, text: "B0" },
		{ value: 24, text: "C1" },
		{ value: 26, text: "D1" },
		{ value: 28, text: "E1" },
		{ value: 29, text: "F1" },
		{ value: 31, text: "G1" },
		{ value: 33, text: "A1" },
		{ value: 35, text: "B1" },
		{ value: 36, text: "C2" },
		{ value: 38, text: "D2" },
		{ value: 40, text: "E2" },
		{ value: 41, text: "F2" },
		{ value: 43, text: "G2" },
		{ value: 45, text: "A2" },
		{ value: 47, text: "B2" },
		{ value: 48, text: "C3" },
		{ value: 50, text: "D3" },
		{ value: 52, text: "E3" },
		{ value: 53, text: "F3" },
		{ value: 55, text: "G3" },
		{ value: 57, text: "A3" },
		{ value: 59, text: "B3" },
		{ value: 60, text: "C4" },
		{ value: 62, text: "D4" },
		{ value: 64, text: "E4" },
		{ value: 65, text: "F4" },
		{ value: 67, text: "G4" },
		{ value: 69, text: "A4" },
		{ value: 71, text: "B4" },
		{ value: 72, text: "C5" },
		{ value: 74, text: "D5" },
		{ value: 76, text: "E5" },
		{ value: 77, text: "F5" },
		{ value: 79, text: "G5" },
		{ value: 81, text: "A5" },
		{ value: 83, text: "B5" },
		{ value: 84, text: "C6" },
		{ value: 86, text: "D6" },
		{ value: 88, text: "E6" },
		{ value: 89, text: "F6" },
		{ value: 91, text: "G6" },
		{ value: 93, text: "A6" },
		{ value: 95, text: "B6" },
		{ value: 96, text: "C7" },
		{ value: 98, text: "D7" },
		{ value: 100, text: "E7" },
		{ value: 101, text: "F7" },
		{ value: 103, text: "G7" },
		{ value: 105, text: "A7" },
		{ value: 107, text: "B7" },
		{ value: 108, text: "C8" },
		{ value: 110, text: "D8" },
		{ value: 112, text: "E8" },
		{ value: 113, text: "F8" },
		{ value: 115, text: "G8" },
		{ value: 117, text: "A8" },
		{ value: 119, text: "B8" },
		{ value: 120, text: "C9" },
		{ value: 122, text: "D9" },
		{ value: 124, text: "E9" },
		{ value: 125, text: "F9" },
		{ value: 127, text: "G9" },
	];

	return (
		<>
			<button
				onClick={() => setOpen(!open)}
				className="bg-yellow p-4 w-full rounded-xl border-8 border-black cursor-pointer"
			>
				<div className="flex items-center space-x-2">
					<MdPiano size={32} />
					<div className="text-xl">Piano</div>
				</div>
			</button>

			{open && (
				<div className="fixed top-0 left-0 z-20 w-screen h-screen p-12">
					<div className="bg-blue border-8 border-black h-full rounded-xl p-8 space-y-2">
						<div className="flex justify-between items-center">
							<h3 className="text-2xl font-bold">Record a Piano Sound</h3>
							<button onClick={() => setOpen(false)}>
								<FaCircleXmark size={32} />
							</button>
						</div>

						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div className="flex space-x-4">
									<div className="flex items-center space-x-2">
										<label className="text-lg" htmlFor="firstNote">
											First Note:
										</label>
										<select
											className="w-32 bg-yellow border-8 border-black p-2 rounded-xl"
											value={firstNote.toString()}
											onChange={(e) => {
												setFirstNote(Number(e.target.value));
											}}
										>
											{MIDI.map((note, index) => (
												<option key={index} value={note.value}>
													{note.text}
												</option>
											))}
										</select>
									</div>

									<div className="flex items-center space-x-2">
										<label className="text-lg" htmlFor="firstNote">
											Last Note:
										</label>
										<select
											className="w-32 bg-yellow border-8 border-black p-2 rounded-xl"
											value={lastNote.toString()}
											onChange={(e) => {
												setLastNote(Number(e.target.value));
											}}
										>
											{MIDI.map((note, index) => (
												<option key={index} value={note.value}>
													{note.text}
												</option>
											))}
										</select>
									</div>
								</div>

								<div className="flex space-x-4">
									<button
										onClick={record}
										className="bg-yellow border-8 border-black p-2 rounded-xl"
									>
										{countdown > 0
											? `Starting in ${countdown}s`
											: recording
											? "Stop Recording"
											: "Start Recording"}
									</button>

									{sequence.length > 0 && (
										<button
											onClick={() => {
												setSequence([]);
												setStartTime(Date.now());
											}}
											className="bg-yellow border-8 border-black p-2 rounded-xl"
										>
											Reset Recording
										</button>
									)}
								</div>
							</div>
							<div className="w-full h-12">
								<ReactPiano
									noteRange={{ first: firstNote, last: lastNote }}
									playNote={(midiNumber: number) => {
										piano.start({
											note: MidiNumbers.getAttributes(midiNumber).note,
										});
										if (recording) {
											const endTime = Math.round(
												(Date.now() - startTime) / multiplier
											);

											if (endTime >= 64) {
												setRecording(false);
											} else {
												setSequence([
													...sequence,
													{
														note: midiNumber,
														start: Math.round(
															(Date.now() - startTime) / multiplier
														),
														end: 0,
													},
												]);
											}
										}
									}}
									stopNote={(midiNumber: number) => {
										piano.stop(midiNumber);
										if (recording) {
											const endTime = Math.round(
												(Date.now() - startTime) / multiplier
											);
											setSequence(
												updateArray(midiNumber, endTime >= 64 ? 63 : endTime)
											);
											if (endTime > 63) {
												setRecording(false);
											}
										}
									}}
									keyboardShortcuts={keyboardShortcuts}
								/>
							</div>

							<div id="grid" className="overflow-scroll relative h-80 bg-pink">
								<div className="relative flex w-max sticky top-0 z-30 border-b-2 border-black">
									<div className="bg-white sticky left-0 z-20 w-10 h-12 grid place-items-center border-r-2 border-black">
										Note
									</div>
									{Array.from(Array(65)).map((_, i) => (
										<div
											key={i}
											className="bg-white w-10 h-12 grid place-items-center border-r-2 border-black"
										>
											{i % 8 != 0 ? (
												i > 8 ? (
													<div>
														{Math.floor(i / 8)} <sup>{i % 8}</sup>&frasl;
														<sub>8</sub>
													</div>
												) : (
													<div>
														<sup>{i}</sup>&frasl;<sub>8</sub>
													</div>
												)
											) : (
												i / 8
											)}
										</div>
									))}
								</div>
								{MIDI.map(
									(key, index) =>
										key.value >= firstNote &&
										key.value <= lastNote && (
											<div
												key={index}
												className="relative flex w-max border-b-2 border-black"
											>
												{Array.from(Array(66)).map((_, i) =>
													i === 0 ? (
														<div
															key={i}
															className="bg-white sticky left-0 z-20 w-10 h-8 grid place-items-center border-r-2 border-black"
														>
															{key.text}
														</div>
													) : sequence.filter(
															(note) =>
																note.note === key.value && note.start === i - 1
													  ).length > 0 ? (
														<div
															key={i}
															className="bg-yellow border-r-2 border-black w-10 h-8 grid place-items-center"
														></div>
													) : (
														<div
															key={i}
															className="bg-black border-r-2 border-black w-10 h-8 grid place-items-center"
														></div>
													)
												)}
											</div>
										)
								)}
							</div>

							{sequence.length > 0 && !recording && (
								<div className="space-y-2">
									<div className="text-lg">Done Recording?</div>
									<div className="space-x-4 flex">
										<button
											onClick={() => playPiano(sequence, bpm)}
											className="bg-yellow p-2 flex items-center justify-center space-x-2 border-8 border-black rounded-xl"
										>
											<div>Listen to Recording</div>
											<FaVolumeUp size={32} />
										</button>
										<button
											onClick={save}
											className="bg-yellow p-2 flex items-center justify-center space-x-2 border-8 border-black rounded-xl"
										>
											<div>Save Recording</div>
											<FaCheck size={32} />
										</button>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default Piano;
