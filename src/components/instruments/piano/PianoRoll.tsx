"use client";

import MIDI from "@/utils/midi";
import { pressKey } from "@/utils/instruments";
import { Key } from "@/utils/types";
import { useState } from "react";
import { Tip } from "@/components/ui/tooltip";
import { IconButton, buttonStyles } from "@/components/ui/button";
import { Popover } from "@/components/ui/popover";
import {
	BackIcon,
	CloseIcon,
	DeleteIcon,
	ForwardIcon,
} from "@/components/ui/icons";
import { selected } from "@/components/ui/state";
import { cn } from "@/utils/cn";
import { useEscape } from "@/utils/escape";

// a note takes up every step from its start up to, not including, its end.
// one that was saved without a length still takes up the step it starts on.
const covers = (key: Key, step: number) =>
	key.start === step || (key.start < step && key.end > step);

// the longer and shorter buttons say it in eighths instead of an icon
const stepButton = buttonStyles({
	variant: "ghost",
	className: "min-w-10 min-h-10 px-1 py-0 gap-0",
});

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
	const [picked, setPicked] = useState<{ key: Key; step: number } | null>(null);

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
		<div className="overflow-scroll relative h-80 bg-paper text-sm border-control border-ink rounded">
			{/* The step numbers stay on top while the rows scroll under them.
			    They're on the popover layer, so a note's popup in a later row
			    still goes over them. */}
			<div className="flex w-max sticky top-0 z-popover border-b-hair border-ink">
				<div className="bg-surface sticky left-0 z-sticky w-10 h-12 grid place-items-center border-r-hair border-ink">
					Note
				</div>
				{columns.map((step) => (
					<div
						key={step}
						className="bg-surface w-10 h-12 grid place-items-center border-r-hair border-ink"
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
						className="relative flex w-max border-b-hair border-ink"
					>
						<div className="bg-surface sticky grid place-items-center left-0 z-sticky w-10 h-8 border-r-hair border-ink">
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
											// the note rings for 4 beats, then lets go
											const release = pressKey(row.value);
											setTimeout(release, (7500 * 32) / bpm);

											onChange([
												...sequence,
												{ note: row.value, start: step, end: step + 1 },
											]);
										}}
										className="bg-paper hover:bg-surface border-r-hair border-ink w-10 h-8"
									></button>
								);
							}

							const last = Math.max(key.end, key.start + 1) === step + 1;

							return (
								<div
									key={step}
									// a note is one ink bar, with a light line where it ends so
									// two notes next to each other stay two
									className={cn(
										"relative border-r-hair w-10 h-8",
										selected,
										last ? "border-paper" : "border-ink"
									)}
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
										<Popover
											className={cn(
												"left-0",
												rowIndex < 2 ? "top-10" : "bottom-10"
											)}
										>
											{key.start > 0 && (
												<IconButton
													label="Move note left"
													icon={BackIcon}
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
												/>
											)}
											{key.start < steps - 1 && (
												<IconButton
													label="Move note right"
													icon={ForwardIcon}
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
												/>
											)}
											{key.end < steps && (
												<Tip label="Longer">
													<button
														aria-label="Make note longer"
														className={stepButton}
														onClick={() =>
															replace(key, { ...key, end: key.end + 1 }, step)
														}
													>
														+<sup>1</sup>&frasl;<sub>8</sub>
													</button>
												</Tip>
											)}
											{/* a note held past the end gets shorter from the end */}
											{Math.min(steps, key.end) - key.start > 1 && (
												<Tip label="Shorter">
													<button
														aria-label="Make note shorter"
														className={stepButton}
														onClick={() =>
															replace(
																key,
																{ ...key, end: Math.min(steps, key.end) - 1 },
																Math.min(step, Math.min(steps, key.end) - 2)
															)
														}
													>
														-<sup>1</sup>&frasl;<sub>8</sub>
													</button>
												</Tip>
											)}
											<IconButton
												label="Delete note"
												icon={DeleteIcon}
												onClick={() => remove(key)}
											/>
											<IconButton
												label="Close"
												icon={CloseIcon}
												onClick={() => setPicked(null)}
											/>
										</Popover>
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
