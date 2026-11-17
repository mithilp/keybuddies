"use client";

import { freeSoundCode } from "@/utils/codes";
import { db } from "@/utils/firebase";
import { playDrum, playDrumHit, stopDrum } from "@/utils/instruments";
import { addDoc, collection } from "firebase/firestore";
import { FaCheck, FaVolumeUp, FaPause } from "react-icons/fa";
import { useRef, useState } from "react";
import { Key } from "@/utils/types";
import sounds from "@/utils/drum-sounds";
import { DRUM_STEPS } from "@/utils/drum-synth";
import { PromptDialog } from "@/components/Dialog";
import { Tip } from "@/components/ui/tooltip";
import Panel from "@/components/Panel";

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

		playDrum(sequence, bpm);
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

	const save = async (name: string) => {
		await addDoc(collection(db, `sounds`), {
			name: name || "Drum beat",
			type: "drum",
			sequence: sequence,
			in: [studio],
			code: await freeSoundCode(),
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
						<div className="w-full">
							{sounds.map((sound, index) => (
								<div key={index} className="flex items-center justify-between">
									<div className="w-40">{sound.note}</div>
									{Array.from(Array(DRUM_STEPS)).map((_, i) => (
										<Tip key={i} label={`${sound.note}, step ${i + 1}`}>
											<button
												aria-label={`${sound.note}, step ${i + 1}`}
												aria-pressed={on(sound.value, i)}
												onClick={() => {
													if (on(sound.value, i)) {
														setSequence(
															sequence.filter(
																(note) =>
																	note.note != sound.value || note.start != i
															)
														);
													} else {
														playDrumHit(sound.value);
														setSequence([
															...sequence,
															{ note: sound.value, start: i, end: i + 1 },
														]);
													}
												}}
												className={`w-10 h-8 rounded-sm text-white my-1 ${
													on(sound.value, i) ? "bg-yellow" : "bg-pink"
												}`}
											></button>
										</Tip>
									))}
								</div>
							))}
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
