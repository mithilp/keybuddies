"use client";

import MIDI from "@/utils/midi";
import { pressKey } from "@/utils/instruments";
import { Key } from "@/utils/types";
import {
	PointerEvent as ReactPointerEvent,
	CSSProperties,
	useRef,
	useState,
} from "react";
import { Tip } from "@/components/ui/tooltip";
import { IconButton, buttonStyles } from "@/components/ui/button";
import { Popover } from "@/components/ui/popover";
import {
	BackIcon,
	CheckIcon,
	DeleteIcon,
	ForwardIcon,
} from "@/components/ui/icons";
import { selected } from "@/components/ui/state";
import { cn } from "@/utils/cn";
import { useEscape } from "@/utils/escape";
import {
	Roll,
	change,
	noteAt,
	pickedIn,
	removePicked,
	resize,
	shift,
	span,
	tap,
} from "@/utils/piano-roll";

// the longer and shorter buttons say it in eighths instead of an icon
const stepButton = buttonStyles({
	variant: "ghost",
	className:
		"min-w-10 min-h-10 pointer-coarse:min-w-11 pointer-coarse:min-h-11 px-1 py-0 gap-0",
});

// a step is a bit wider and a row a bit taller under a finger
const cell = "w-[--cell] h-8 pointer-coarse:h-11";

// where step `step` starts, counting the column of note names
const at = (step: number) => `calc(var(--cell) * ${step + 1})`;

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
//
// A tap on an empty step adds a note. A tap on a note picks it: it gets a
// frame with a handle on its right end and a row of buttons. Dragging the
// note moves it, dragging the handle makes it longer or shorter, and the
// buttons do the same a step at a time, or delete it. A tap on the picked
// note, on an empty step, Done, or Escape lets go. Alt click on a note
// deletes it straight away, for a mouse.
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

	const [chosen, setChosen] = useState<Key | null>(null);
	const picked = pickedIn(sequence, chosen);

	// Escape lets go of the note before it closes the piano it's on
	useEscape(() => setChosen(null), picked !== null);

	const apply = (next: Roll) => {
		if (next.sequence !== sequence) onChange(next.sequence);
		setChosen(next.picked);
	};

	const onTap = (note: number, step: number, remove: boolean) => {
		const next = tap({ sequence, picked }, note, step, remove);

		if (next.added) {
			// the note rings for 4 beats, then lets go
			const release = pressKey(note);
			setTimeout(release, (7500 * 32) / bpm);
		}

		apply(next);
	};

	const replace = (next: Key) => {
		if (picked) apply(change({ sequence, picked }, picked, next));
	};

	// A drag on the picked note or its handle. The pointer is held by what
	// it started on, so the drag goes on wherever the finger goes, and only
	// that one element stops the page from scrolling under a finger.
	const drag = useRef<{
		mode: "move" | "resize";
		pointer: number;
		x: number;
		// the note when the drag started, and how wide a step is on screen
		from: Key;
		width: number;
		moved: boolean;
	} | null>(null);

	const grab =
		(mode: "move" | "resize") => (event: ReactPointerEvent<HTMLElement>) => {
			if (!picked || event.button !== 0) return;

			// the handle is inside the note, it's not a move as well
			event.stopPropagation();
			event.currentTarget.setPointerCapture(event.pointerId);

			const frame = event.currentTarget.closest<HTMLElement>("[data-frame]");

			drag.current = {
				mode,
				pointer: event.pointerId,
				x: event.clientX,
				from: picked,
				width:
					(frame?.offsetWidth ?? 40) /
					Math.min(span(picked), steps - picked.start),
				moved: false,
			};
		};

	const move = (event: ReactPointerEvent<HTMLElement>) => {
		const now = drag.current;
		if (!now || now.pointer !== event.pointerId || !picked) return;

		const by = Math.round((event.clientX - now.x) / now.width);
		if (by !== 0) now.moved = true;

		const next =
			now.mode === "move"
				? shift(now.from, by, steps)
				: resize(now.from, now.from.end + by, steps);

		if (next.start !== picked.start || next.end !== picked.end) replace(next);
	};

	const release = (event: ReactPointerEvent<HTMLElement>) => {
		if (drag.current?.pointer === event.pointerId) {
			// a drag that went nowhere is a tap, and the click after it lets go
			if (!drag.current.moved) drag.current = null;
		}
	};

	const rows = MIDI.filter(
		(key) => key.value >= firstNote && key.value <= lastNote
	);

	return (
		<div className="overflow-scroll overscroll-contain relative h-80 bg-paper text-sm border-control border-ink rounded [--cell:2.5rem] pointer-coarse:[--cell:2.75rem]">
			{/* The step numbers stay on top while the rows scroll under them.
			    They're on the popover layer, so a note's buttons in a later row
			    still go over them. */}
			<div className="flex w-max sticky top-0 z-popover border-b-hair border-ink">
				<div className="bg-surface sticky left-0 z-sticky w-[--cell] h-12 grid place-items-center border-r-hair border-ink">
					Note
				</div>
				{columns.map((step) => (
					<div
						key={step}
						className="bg-surface w-[--cell] h-12 grid place-items-center border-r-hair border-ink"
					>
						<StepLabel step={step} />
					</div>
				))}
			</div>

			{rows.map((row, rowIndex) => {
				const here = picked?.note === row.value ? picked : null;

				return (
					<div
						key={row.value}
						className="relative flex w-max border-b-hair border-ink"
					>
						<div
							className={cn(
								"bg-surface sticky grid place-items-center left-0 z-sticky border-r-hair border-ink",
								cell
							)}
						>
							{row.label}
						</div>

						{columns.map((step) => {
							const key = noteAt(sequence, row.value, step);

							if (!key) {
								return (
									<button
										key={step}
										aria-label={`Add ${row.label} at step ${step + 1}`}
										onClick={() => onTap(row.value, step, false)}
										className={cn(
											"bg-paper hover:bg-surface border-r-hair border-ink",
											cell
										)}
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
										"relative border-r-hair",
										cell,
										selected,
										last ? "border-paper" : "border-ink"
									)}
								>
									<Tip label="Click to pick it. Alt click deletes it.">
										<button
											aria-label={`${row.label} at step ${key.start + 1}`}
											aria-pressed={key === picked}
											className="block w-full h-full aria-pressed:bg-ink"
											onClick={(event) => onTap(row.value, step, event.altKey)}
											onKeyDown={(event) => {
												if (
													key === picked &&
													(event.key === "Delete" || event.key === "Backspace")
												) {
													event.preventDefault();
													apply(removePicked({ sequence, picked }));
												}
											}}
										></button>
									</Tip>
								</div>
							);
						})}

						{here && (
							<>
								{/* The frame on the picked note. Dragging it moves the
								    note, the handle on its end changes how long it is,
								    and a tap on it lets go. It's the only part of the
								    grid a finger can't scroll. */}
								<div
									data-frame
									aria-hidden
									className="absolute inset-y-0 z-base border-control border-accent cursor-grab touch-none select-none"
									style={
										{
											left: at(here.start),
											width: `calc(var(--cell) * ${Math.min(
												span(here),
												steps - here.start
											)})`,
										} as CSSProperties
									}
									onPointerDown={grab("move")}
									onPointerMove={move}
									onPointerUp={release}
									onPointerCancel={() => {
										drag.current = null;
									}}
									onClick={() => {
										const dragged = drag.current?.moved;
										drag.current = null;
										if (!dragged) setChosen(null);
									}}
								>
									<div
										className="absolute inset-y-0 -right-2 w-4 grid place-items-center cursor-ew-resize touch-none pointer-coarse:-right-3 pointer-coarse:w-6"
										onPointerDown={grab("resize")}
										onPointerMove={move}
										onPointerUp={release}
										onPointerCancel={() => {
											drag.current = null;
										}}
										// a tap on the handle isn't a tap on the note
										onClick={(event) => {
											event.stopPropagation();
											drag.current = null;
										}}
									>
										<div className="w-2 h-3/4 bg-accent border-hair border-ink rounded" />
									</div>
								</div>

								{/* the first rows open downwards, there's no room above
								    them */}
								<Popover
									aria-label="Change the note"
									className={cn(
										rowIndex < 2 ? "top-full mt-1" : "bottom-full mb-1"
									)}
									style={{ left: at(here.start) }}
								>
									<IconButton
										label="Move note left"
										icon={BackIcon}
										disabled={here.start === 0}
										onClick={() => replace(shift(here, -1, steps))}
									/>
									<IconButton
										label="Move note right"
										icon={ForwardIcon}
										disabled={here.start >= steps - 1}
										onClick={() => replace(shift(here, 1, steps))}
									/>
									<Tip label="Shorter">
										<button
											aria-label="Make note shorter"
											className={stepButton}
											disabled={Math.min(steps, here.end) - here.start <= 1}
											onClick={() =>
												replace(resize(here, Math.min(steps, here.end) - 1, steps))
											}
										>
											-<sup>1</sup>&frasl;<sub>8</sub>
										</button>
									</Tip>
									<Tip label="Longer">
										<button
											aria-label="Make note longer"
											className={stepButton}
											disabled={here.end >= steps}
											onClick={() => replace(resize(here, here.end + 1, steps))}
										>
											+<sup>1</sup>&frasl;<sub>8</sub>
										</button>
									</Tip>
									<IconButton
										label="Delete note"
										icon={DeleteIcon}
										onClick={() => apply(removePicked({ sequence, picked: here }))}
									/>
									<IconButton
										label="Done"
										icon={CheckIcon}
										onClick={() => setChosen(null)}
									/>
								</Popover>
							</>
						)}
					</div>
				);
			})}
		</div>
	);
};

export default PianoRoll;
