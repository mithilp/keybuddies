"use client";

import { freeSoundCode } from "@/utils/codes";
import { db } from "@/utils/firebase";
import { playDrum, playDrumHit, stopDrum } from "@/utils/instruments";
import { addDoc, collection } from "firebase/firestore";
import { FaDrum, FaCheck, FaVolumeUp, FaPause } from "react-icons/fa";
import { FaCircleXmark } from "react-icons/fa6";
import { useRef, useState } from "react";
import { Key } from "@/utils/types";
import sounds from "@/utils/drum-sounds";
import { DRUM_STEPS } from "@/utils/drum-synth";
import { PromptDialog } from "@/components/Dialog";
import { Tip } from "@/components/ui/tooltip";

const Drum = ({ studio, bpm }: { studio: string; bpm: number }) => {
	const [open, setOpen] = useState(false);

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

	const close = () => {
		stopListening();
		setOpen(false);
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
		close();
	};

	return (
		<>
			<button
				onClick={() => {
					if (open) {
						close();
					} else {
						setOpen(true);
					}
				}}
				className="bg-yellow p-4 w-full rounded-xl border-8 border-black cursor-pointer"
			>
				<div className="flex items-center space-x-2">
					<FaDrum size={32} />
					<div className="text-xl">Drums</div>
				</div>
			</button>

			{open && (
				<div className="fixed top-0 left-0 z-20 w-screen h-screen p-12">
					<div className="bg-blue border-8 border-black h-full rounded-xl p-8 space-y-2">
						<div className="flex justify-between items-center">
							<h3 className="text-2xl font-bold">Record a Drum Sound</h3>
							<Tip label="Close" side="left">
								<button onClick={close} aria-label="Close">
									<FaCircleXmark size={32} />
								</button>
							</Tip>
						</div>
						<div className="space-y-4">
							<div className="w-full">
								{sounds.map((sound, index) => (
									<div
										key={index}
										className="flex items-center justify-between"
									>
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
																		note.note != sound.value ||
																		note.start != i
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
					</div>
				</div>
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
