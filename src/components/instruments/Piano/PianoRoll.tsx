"use client";

import MIDI from "@/utils/MIDI";
import { pressKey } from "@/utils/instruments";
import { PIANO_STEPS } from "@/utils/tempo";
import { Key } from "@/utils/types";
import { useState } from "react";
import { FaArrowLeft, FaArrowRight, FaTrash } from "react-icons/fa";
import { FaXmark } from "react-icons/fa6";

const STEPS = Array.from({ length: PIANO_STEPS }, (_, step) => step);

// a note takes up every step from its start up to, not including, its end.
// one that was saved without a length still takes up the step it starts on.
const covers = (key: Key, step: number) =>
	key.start === step || (key.start < step && key.end > step);

// where a step is in the cell, in beats: 0, 1/8, 2/8 ... 7 7/8
const StepLabel = ({ step }: { step: number }) =>
	step % 8 === 0 ? (
		<>{step / 8}</>
	) : (
		<div>
			{step > 8 && `${Math.floor(step / 8)} `}
			<sup>{step % 8}</sup>&frasl;<sub>8</sub>
		</div>
	);

// The grid a piano recording is drawn on. One row per note between
// `firstNote` and `lastNote`, one column per step. Recording a new sound and
// editing a saved one both use this.
const PianoRoll = ({
	sequence,
	onChange,
	firstNote,
	lastNote,
	bpm,
}: {
	sequence: Key[];
	onChange: (sequence: Key[]) => void;
	firstNote: number;
	lastNote: number;
	bpm: number;
}) => {
	// the note the popup is open for, and the step it was opened from
	const [picked, setPicked] = useState<{ key: Key; step: number } | null>(
		null
	);

	const replace = (key: Key, next: Key, step: number) => {
		onChange(sequence.map((note) => (note === key ? next : note)));
		setPicked({ key: next, step: step });
	};

	const remove = (key: Key) => {
		onChange(sequence.filter((note) => note !== key));
		setPicked(null);
	};

	const rows = MIDI.filter(
		(key) => key.value >= firstNote && key.value <= lastNote
	);

	return (
		<div className="overflow-scroll relative h-80 bg-pink text-sm">
			<div className="flex w-max sticky top-0 z-30 border-b-2 border-black">
				<div className="bg-white sticky left-0 z-20 w-10 h-12 grid place-items-center border-r-2 border-black">
					Note
				</div>
				{STEPS.map((step) => (
					<div
						key={step}
						className="bg-white w-10 h-12 grid place-items-center border-r-2 border-black"
					>
						<StepLabel step={step} />
					</div>
				))}
			</div>

			{rows.map((row, rowIndex) => {
				const notes = sequence.filter((note) => note.note === row.value);

				return (
					<div
						key={row.value}
						className="relative flex w-max border-b-2 border-black"
					>
						<div className="bg-white sticky grid place-items-center left-0 z-20 w-10 h-8 border-r-2 border-black">
							{row.label}
						</div>

						{STEPS.map((step) => {
							// where two notes meet, the one that starts here is on top
							const key =
								notes.find((note) => note.start === step) ??
								notes.find((note) => covers(note, step));

							if (!key) {
								return (
									<button
										key={step}
										aria-label={`Add ${row.label} at step ${step + 1}`}
										onClick={() => {
											// the note rings for 4 beats
											setTimeout(pressKey(row.value), (7500 * 32) / bpm);

											onChange([
												...sequence,
												{ note: row.value, start: step, end: step + 1 },
											]);
										}}
										className="bg-pink border-r-2 border-black w-10 h-8"
									></button>
								);
							}

							const last = Math.max(key.end, key.start + 1) === step + 1;

							return (
								<div
									key={step}
									className={`bg-yellow relative border-r-2 w-10 h-8 ${
										last ? "border-black" : "border-yellow"
									}`}
								>
									<button
										aria-label={`${row.label} at step ${
											key.start + 1
										}. Click to remove, Alt click to edit`}
										title="Click to remove, Alt click to edit"
										className="block w-full h-full"
										onClick={(e) => {
											if (e.altKey) {
												setPicked({ key: key, step: step });
											} else {
												remove(key);
											}
										}}
									></button>

									{picked?.key === key && picked.step === step && (
										// the first rows open downwards, there's no room above them
										<div
											className={`absolute flex items-center space-x-4 z-50 bg-yellow border-8 border-black rounded-xl p-2 left-0 ${
												rowIndex < 2 ? "top-10" : "bottom-10"
											}`}
										>
											{key.start > 0 && (
												<button
													aria-label="Move note left"
													title="Move left"
													onClick={() =>
														replace(
															key,
															{
																...key,
																start: key.start - 1,
																end: key.end - 1,
															},
															Math.max(0, step - 1)
														)
													}
												>
													<FaArrowLeft size={20} />
												</button>
											)}
											{key.start < PIANO_STEPS - 1 && (
												<button
													aria-label="Move note right"
													title="Move right"
													onClick={() =>
														replace(
															key,
															{
																...key,
																start: key.start + 1,
																end: Math.min(PIANO_STEPS, key.end + 1),
															},
															Math.min(PIANO_STEPS - 1, step + 1)
														)
													}
												>
													<FaArrowRight size={20} />
												</button>
											)}
											{key.end < PIANO_STEPS && (
												<button
													aria-label="Make note longer"
													title="Longer"
													onClick={() =>
														replace(key, { ...key, end: key.end + 1 }, step)
													}
												>
													<div>
														+<sup>1</sup>&frasl;<sub>8</sub>
													</div>
												</button>
											)}
											{key.end - key.start > 1 && (
												<button
													aria-label="Make note shorter"
													title="Shorter"
													onClick={() =>
														replace(
															key,
															{ ...key, end: key.end - 1 },
															Math.min(step, key.end - 2)
														)
													}
												>
													<div>
														-<sup>1</sup>&frasl;<sub>8</sub>
													</div>
												</button>
											)}
											<button
												aria-label="Delete note"
												title="Delete"
												onClick={() => remove(key)}
											>
												<FaTrash size={20} />
											</button>
											<button
												aria-label="Close"
												title="Close"
												onClick={() => setPicked(null)}
											>
												<FaXmark size={12} />
											</button>
										</div>
									)}
								</div>
							);
						})}
					</div>
				);
			})}
		</div>
	);
};

export default PianoRoll;
