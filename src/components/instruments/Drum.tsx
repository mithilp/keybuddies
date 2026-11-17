"use client";

import { playDrum, playDrumHit, stopDrum } from "@/utils/instruments";
import { saveSound } from "@/utils/sounds";
import { FaCheck, FaVolumeUp, FaPause } from "react-icons/fa";
import { useRef, useState } from "react";
import { Key } from "@/utils/types";
import sounds from "@/utils/drum-sounds";
import { DRUM_STEPS } from "@/utils/drum-synth";
import { CELL_BEATS } from "@/utils/tempo";
import { PromptDialog } from "@/components/Dialog";
import Panel from "@/components/Panel";

const BEATS = Array.from({ length: CELL_BEATS }, (_, beat) => beat);

// the sixteenth note steps in one beat
const QUARTERS = Array.from(
	{ length: DRUM_STEPS / CELL_BEATS },
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

		playDrum(sequence, bpm, DRUM_STEPS);
		setIsPlaying(true);
		listenTimer.current = setTimeout(stopListening, 480000 / bpm);
	};

	const shut = () => {
		stopListening();
		close();
	};

	const [naming, setNaming] = useState(false);

	// whether a drum is hit on a step
	const on = (voice: number, step: number) =>
		sequence.some((note) => note.note == voice && note.start == step);

	const toggle = (voice: number, step: number) => {
		if (on(voice, step)) {
			setSequence(
				sequence.filter((note) => note.note != voice || note.start != step)
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
			sequence: sequence,
			// the grid this beat was made on. beats saved before there was one
			// are on the old half beat grid, see drumBeat.
			steps: DRUM_STEPS,
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
					<div className="space-y-4">
						{/* sideways scroll stays inside the panel on a narrow window */}
						<div className="overflow-x-auto">
							<div className="w-max">
								{/* the beat numbers, over the first step of each beat */}
								<div className="flex" aria-hidden>
									<div className="w-32 shrink-0"></div>
									{BEATS.map((beat) => (
										<div
											key={beat}
											className="flex gap-0.5 px-1 border-l-4 border-black font-bold"
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
										<div className="w-32 shrink-0">{sound.note}</div>
										{BEATS.map((beat) => (
											// a beat is 4 steps, with a thick line before it
											<div
												key={beat}
												className="flex gap-0.5 px-1 py-0.5 border-l-4 border-black"
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
															className={`w-6 h-8 rounded-sm ${
																hit ? "bg-yellow" : "bg-pink"
															}`}
														></button>
													);
												})}
											</div>
										))}
									</div>
								))}
							</div>
						</div>
						<div className="space-x-4 flex">
							<button
								onClick={listen}
								disabled={sequence.length == 0}
								className="disabled:opacity-70 bg-yellow p-2 flex items-center justify-center space-x-2 border-8 border-black rounded-xl"
							>
								<div id="ButtonListen">
									{isPlaying ? "Stop Playback" : "Listen to Recording"}
								</div>
								{isPlaying ? <FaPause size={32} /> : <FaVolumeUp size={32} />}
							</button>
							<button
								onClick={() => setNaming(true)}
								disabled={sequence.length == 0}
								className="disabled:opacity-70 bg-yellow p-2 flex items-center justify-center space-x-2 border-8 border-black rounded-xl"
							>
								<div>Save Recording</div>
								<FaCheck size={32} />
							</button>
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
					submit="Save"
					onSubmit={save}
					onCancel={() => setNaming(false)}
				/>
			)}
		</>
	);
};

export default Drum;
