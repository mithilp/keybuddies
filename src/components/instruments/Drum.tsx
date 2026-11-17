"use client";

import { playDrum, playDrumHit, stopDrum } from "@/utils/instruments";
import { NAME_LENGTH, saveSound } from "@/utils/sounds";
import { useRef, useState } from "react";
import { ClipBars, Key } from "@/utils/types";
import sounds from "@/utils/drum-sounds";
import { DRUM_BAR_STEPS, drumSteps } from "@/utils/drum-synth";
import { BAR_BEATS } from "@/utils/tempo";
import { DEFAULT_BARS } from "@/utils/clips";
import { PromptDialog } from "@/components/Dialog";
import Panel, { panelFooter } from "@/components/Panel";
import LengthPicker from "./LengthPicker";
import { Button } from "@/components/ui/button";
import { CheckIcon, ICON, PauseIcon, SoundIcon } from "@/components/ui/icons";
import { selected } from "@/components/ui/state";
import { cn } from "@/utils/cn";

// the sixteenth note steps in one beat
const QUARTERS = Array.from(
	{ length: DRUM_BAR_STEPS / BAR_BEATS },
	(_, quarter) => quarter
);

// The drum recorder. It's always on the page and draws nothing until it's
// opened, so a beat that was closed without saving is still there the next
// time.
const Drum = ({
	studio,
	bpm,
	open,
	close,
}: {
	studio: string;
	bpm: number;
	open: boolean;
	close: () => void;
}) => {
	const [sequence, setSequence] = useState<Array<Key>>([]);
	const [isPlaying, setIsPlaying] = useState(false);

	// how long the beat is. hits past the end stay on the grid in case it's
	// made longer again, but they aren't heard or saved.
	const [bars, setBars] = useState<ClipBars>(DEFAULT_BARS);
	const beats = Array.from({ length: bars * BAR_BEATS }, (_, beat) => beat);
	const inside = sequence.filter((note) => note.start < drumSteps(bars));

	const listenTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const stopListening = () => {
		if (listenTimer.current) {
			clearTimeout(listenTimer.current);
			listenTimer.current = null;
		}
		stopDrum();
		setIsPlaying(false);
	};

	const listen = () => {
		if (isPlaying) {
			stopListening();
			return;
		}

		playDrum(inside, bpm, drumSteps(bars), bars);
		setIsPlaying(true);
		listenTimer.current = setTimeout(stopListening, (bars * 240000) / bpm);
	};

	const shut = () => {
		stopListening();
		close();
	};

	const [naming, setNaming] = useState(false);

	// whether a drum is hit on a step
	const on = (voice: number, step: number) =>
		sequence.some((note) => note.note === voice && note.start === step);

	const toggle = (voice: number, step: number) => {
		if (on(voice, step)) {
			setSequence(
				sequence.filter((note) => note.note !== voice || note.start !== step)
			);
		} else {
			playDrumHit(voice);
			setSequence([...sequence, { note: voice, start: step, end: step + 1 }]);
		}
	};

	const save = async (name: string) => {
		await saveSound(studio, {
			name: name || "Drum beat",
			type: "drum",
			sequence: inside,
			// the grid this beat was made on and how long it is. beats saved
			// before there was a grid are on half beats, see drumBeat.
			steps: drumSteps(bars),
			bars: bars,
		});

		setNaming(false);
		setSequence([]);
		shut();
	};

	return (
		<>
			{open && (
				// Escape closes it the same way the X does, the beat stops too
				<Panel title="Record a Drum Sound" close={shut}>
					<div className="flex-1 flex flex-col gap-4">
						<LengthPicker
							id="drumLength"
							bars={bars}
							setBars={(next) => {
								stopListening();
								setBars(next);
							}}
						/>

						{/* sideways scroll stays inside the panel on a narrow window */}
						<div className="overflow-x-auto">
							<div className="w-max">
								{/* the beat numbers, over the first step of each beat */}
								<div className="flex" aria-hidden>
									<div className="w-24 sm:w-32 shrink-0"></div>
									{beats.map((beat) => (
										<div
											key={beat}
											className="flex gap-0.5 px-1 border-l-hair border-ink font-bold"
										>
											{QUARTERS.map((quarter) => (
												<div key={quarter} className="w-6">
													{quarter === 0 && beat + 1}
												</div>
											))}
										</div>
									))}
								</div>

								{sounds.map((sound) => (
									<div key={sound.value} className="flex items-center">
										<div className="w-24 sm:w-32 shrink-0">{sound.note}</div>
										{beats.map((beat) => (
											// a beat is 4 steps, with a thick line before it
											<div
												key={beat}
												className="flex gap-0.5 px-1 py-0.5 border-l-hair border-ink"
											>
												{QUARTERS.map((quarter) => {
													const step = beat * QUARTERS.length + quarter;
													const hit = on(sound.value, step);

													return (
														<button
															key={quarter}
															aria-label={`${sound.note}, beat ${beat + 1}${
																quarter > 0 ? `, sixteenth ${quarter + 1}` : ""
															}`}
															aria-pressed={hit}
															onClick={() => toggle(sound.value, step)}
															className={cn(
																"w-6 h-8 border-hair border-ink",
																hit ? selected : "bg-paper hover:bg-surface"
															)}
														></button>
													);
												})}
											</div>
										))}
									</div>
								))}
							</div>
						</div>
						<div className={panelFooter}>
							<Button size="lg" onClick={listen} disabled={inside.length === 0}>
								{isPlaying ? (
									<PauseIcon size={ICON} aria-hidden />
								) : (
									<SoundIcon size={ICON} aria-hidden />
								)}
								{isPlaying ? "Stop Playback" : "Listen to Recording"}
							</Button>
							<Button
								size="lg"
								variant="primary"
								onClick={() => setNaming(true)}
								disabled={inside.length === 0}
							>
								<CheckIcon size={ICON} aria-hidden />
								Save Recording
							</Button>
						</div>
					</div>
				</Panel>
			)}

			{/* cancelling keeps the beat on screen and saves nothing */}
			{naming && (
				<PromptDialog
					title="Name your beat"
					label="Beat name"
					placeholder="Drum beat"
					maxLength={NAME_LENGTH}
					submit="Save"
					onSubmit={save}
					onCancel={() => setNaming(false)}
				/>
			)}
		</>
	);
};

export default Drum;
