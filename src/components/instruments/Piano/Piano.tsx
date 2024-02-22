"use client";

import { db } from "@/utils/firebase";
import { playPiano } from "@/utils/instruments";
import { addDoc, collection } from "firebase/firestore";
import { useState } from "react";
import {
	FaArrowLeft,
	FaArrowRight,
	FaCheck,
	FaTrash,
	FaVolumeUp,
} from "react-icons/fa";
import { FaXmark } from "react-icons/fa6";
import {
	Piano as ReactPiano,
	KeyboardShortcuts,
	MidiNumbers,
	//@ts-ignore
} from "react-piano";
import "react-piano/dist/styles.css";
import { Soundfont } from "smplr";
import OpenPiano from "./OpenPiano";
import PianoModalHeader from "./PianoModalHeader";
import PianoOptions from "./PianoOptions";
import MIDI from "@/utils/MIDI";
import { Key } from "@/utils/types";

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

	const [sequence, setSequence] = useState<Array<Key>>([]);
	const [recording, setRecording] = useState(false);

	const [startTime, setStartTime] = useState<number>(Date.now());

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

	const [tooltip, setTooltip] = useState([-1, -1]);

	return (
		<>
			<OpenPiano onClick={() => setOpen(!open)} />

			{open && (
				<div className="fixed top-0 left-0 z-20 w-screen h-screen p-12">
					<div className="bg-blue border-8 border-black h-full rounded-xl p-8 space-y-2">
						<PianoModalHeader close={() => setOpen(false)} />

						<div className="space-y-4">
							<PianoOptions
								firstNote={firstNote}
								setFirstNote={setFirstNote}
								lastNote={lastNote}
								setLastNote={setLastNote}
								multiplier={multiplier}
								recording={recording}
								sequence={sequence}
								setSequence={setSequence}
								setStartTime={setStartTime}
								setRecording={setRecording}
							/>

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

							<div className="overflow-scroll relative h-80 bg-pink text-sm">
								<div className="flex w-max sticky top-0 z-30 border-b-2 border-black">
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
															className="bg-white sticky grid place-items-center left-0 z-20 w-10 h-8 border-r-2 border-black"
														>
															{key.text}
														</div>
													) : sequence.filter(
															(note) =>
																(note.note === key.value &&
																	note.start === i - 1) ||
																(note.note === key.value &&
																	note.end > i - 1 &&
																	note.start < i - 1)
													  ).length > 0 ? (
														<div
															key={i}
															className={`bg-yellow cursor-pointer relative border-r-2 w-10 h-8 ${
																sequence.filter(
																	(note) =>
																		(note.note === key.value &&
																			note.start === i - 1) ||
																		(note.note === key.value &&
																			note.end > i - 1 &&
																			note.start < i - 1)
																)[0].end == i
																	? "border-black"
																	: "border-yellow"
															}`}
														>
															<button
																className="w-10 h-8"
																onClick={(e) => {
																	if (e.altKey) {
																		setTooltip([index, i]);
																	} else {
																		setSequence(
																			sequence.filter(
																				(note) =>
																					!(
																						note.note === key.value &&
																						note.start === i - 1
																					)
																			)
																		);
																	}
																}}
															></button>
															{index == tooltip[0] && i == tooltip[1] && (
																// tooltip
																<div className="absolute flex items-center space-x-4 bottom-10 z-50 bg-yellow border-8 border-black rounded-xl p-2 left-0">
																	{i != 1 && (
																		<button
																			onClick={() => {
																				setSequence(
																					sequence.map((note) =>
																						(note.note === key.value &&
																							note.start === i - 1) ||
																						(note.note === key.value &&
																							note.end > i - 1 &&
																							note.start < i - 1)
																							? {
																									...note,
																									start:
																										note.start == 0 ? 0 : -1,
																									end: note.end - 1,
																							  }
																							: note
																					)
																				);
																			}}
																		>
																			<FaArrowLeft size={20} />
																		</button>
																	)}
																	{i != 64 && (
																		<button
																			onClick={() => {
																				setSequence(
																					sequence.map((note) =>
																						(note.note === key.value &&
																							note.start === i - 1) ||
																						(note.note === key.value &&
																							note.end > i - 1 &&
																							note.start < i - 1)
																							? {
																									...note,
																									start: note.start + 1,
																									end:
																										note.end > 63
																											? 64
																											: note.end + 1,
																							  }
																							: note
																					)
																				);
																			}}
																		>
																			<FaArrowRight size={20} />
																		</button>
																	)}
																	<button
																		onClick={() => {
																			setSequence(
																				sequence.map((note) =>
																					(note.note === key.value &&
																						note.start === i - 1) ||
																					(note.note === key.value &&
																						note.end > i - 1 &&
																						note.start < i - 1)
																						? {
																								...note,
																								end: note.end + 1,
																						  }
																						: note
																				)
																			);
																		}}
																	>
																		<div>
																			+<sup>1</sup>&frasl;<sub>8</sub>
																		</div>
																	</button>
																	{sequence.filter(
																		(note) =>
																			((note.note === key.value &&
																				note.start === i - 1) ||
																				(note.note === key.value &&
																					note.end > i - 1 &&
																					note.start < i - 1)) &&
																			note.note === key.value &&
																			note.end - note.start > 1
																	).length > 0 && (
																		<button
																			onClick={() => {
																				setSequence(
																					sequence.map((note) =>
																						(note.note === key.value &&
																							note.start === i - 1) ||
																						(note.note === key.value &&
																							note.end > i - 1 &&
																							note.start < i - 1)
																							? {
																									...note,
																									end: note.end - 1,
																							  }
																							: note
																					)
																				);
																			}}
																		>
																			<div>
																				-<sup>1</sup>&frasl;<sub>8</sub>
																			</div>
																		</button>
																	)}

																	<button
																		onClick={() => {
																			setSequence(
																				sequence.filter(
																					(note) =>
																						!(
																							(note.note === key.value &&
																								note.start === i - 1) ||
																							(note.note === key.value &&
																								note.end > i - 1 &&
																								note.start < i - 1)
																						)
																				)
																			);
																			setTooltip([-1, -1]);
																		}}
																	>
																		<FaTrash size={20} />
																	</button>
																	<button onClick={() => setTooltip([-1, -1])}>
																		<FaXmark size={12} />
																	</button>
																</div>
															)}
														</div>
													) : (
														<button
															onClick={() => {
																setSequence([
																	...sequence,
																	{
																		note: key.value,
																		start: i - 1,
																		end: i,
																	},
																]);
															}}
															key={i}
															className="bg-pink border-r-2 border-black w-10 h-8"
														></button>
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
