"use client";

import MIDI from "@/utils/MIDI";
import { pressKey } from "@/utils/instruments";
import { Key } from "@/utils/types";
import { useState } from "react";
import { FaArrowLeft, FaArrowRight, FaTrash } from "react-icons/fa";
import { FaXmark } from "react-icons/fa6";
import { Tip } from "@/components/ui/tooltip";
import { useEscape } from "@/utils/escape";

// a note takes up every step from its start up to, not including, its end.
// one that was saved without a length still takes up the step it starts on.
const covers = (key: Key, step: number) =>
	key.start === step || (key.start < step && key.end > step);

// where a step is in the sound, in beats: 0, 1/8, 2/8 ... 7 7/8
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
// `firstNote` and `lastNote`, one column per step, `steps` of them.
// Recording a new sound and editing a saved one both use this.
const PianoRoll = ({
	sequence,
	onChange,
	firstNote,
	lastNote,
	bpm,
	steps,
}: {
	sequence: Key[];
	onChange: (sequence: Key[]) => void;
	firstNote: number;
	lastNote: number;
	bpm: number;
	steps: number;
}) => {
	const columns = Array.from({ length: steps }, (_, step) => step);

	// the note the popup is open for, and the step it was opened from
	const [picked, setPicked] = useState<{ key: Key; step: number } | null>(
		null
	);

	// Escape closes the popup before the piano it's on
	useEscape(() => setPicked(null), picked !== null);

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
				{columns.map((step) => (
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

						{columns.map((step) => {
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
									<Tip label="Click to remove, Alt click to edit">
										<button
											aria-label={`${row.label} at step ${
												key.start + 1
											}. Click to remove, Alt click to edit`}
											className="block w-full h-full"
											onClick={(e) => {
												if (e.altKey) {
													setPicked({ key: key, step: step });
												} else {
													remove(key);
												}
											}}
										></button>
									</Tip>

									{picked?.key === key && picked.step === step && (
										// the first rows open downwards, there's no room above them
										<div
											className={`absolute flex items-center space-x-4 z-50 bg-yellow border-8 border-black rounded-xl p-2 left-0 ${
												rowIndex < 2 ? "top-10" : "bottom-10"
											}`}
										>
											{key.start > 0 && (
												<Tip label="Move left">
													<button
														aria-label="Move note left"
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
												</Tip>
											)}
											{key.start < steps - 1 && (
												<Tip label="Move right">
													<button
														aria-label="Move note right"
														onClick={() =>
															replace(
																key,
																{
																	...key,
																	start: key.start + 1,
																	end: Math.min(steps, key.end + 1),
																},
																Math.min(steps - 1, step + 1)
															)
														}
													>
														<FaArrowRight size={20} />
													</button>
												</Tip>
											)}
											{key.end < steps && (
												<Tip label="Longer">
													<button
														aria-label="Make note longer"
														onClick={() =>
															replace(key, { ...key, end: key.end + 1 }, step)
														}
													>
														<div>
															+<sup>1</sup>&frasl;<sub>8</sub>
														</div>
													</button>
												</Tip>
											)}
											{key.end - key.start > 1 && (
												<Tip label="Shorter">
													<button
														aria-label="Make note shorter"
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
												</Tip>
											)}
											<Tip label="Delete">
												<button
													aria-label="Delete note"
													onClick={() => remove(key)}
												>
													<FaTrash size={20} />
												</button>
											</Tip>
											<Tip label="Close">
												<button
													aria-label="Close"
													onClick={() => setPicked(null)}
												>
													<FaXmark size={12} />
												</button>
											</Tip>
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
