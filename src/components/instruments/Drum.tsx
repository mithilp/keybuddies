"use client";

import { db } from "@/utils/firebase";
import { playDrum, playDrumHit, stopDrum } from "@/utils/instruments";
import { addDoc, collection } from "firebase/firestore";
import { FaDrum, FaCheck, FaVolumeUp, FaPause } from "react-icons/fa";
import { FaCircleXmark } from "react-icons/fa6";
import { useRef, useState } from "react";
import { Key } from "@/utils/types";
import sounds from "@/utils/drum-sounds";
import { DRUM_STEPS } from "@/utils/drum-synth";

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

	const save = async () => {
		const name = prompt("Name your beat");

		// cancelled, keep the beat on screen
		if (name === null) return;

		await addDoc(collection(db, `sounds`), {
			name: name.trim() || "Drum beat",
			type: "drum",
			sequence: sequence,
			in: [studio],
			code: Math.floor(100000 + Math.random() * 900000).toString(),
		});

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
							<button onClick={close}>
								<FaCircleXmark size={32} />
							</button>
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
											<button
												key={i}
												onClick={() => {
													if (
														sequence.filter(
															(note) =>
																note.note == sound.value && note.start == i
														).length > 0
													) {
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
													sequence.filter(
														(note) =>
															note.note == sound.value && note.start == i
													).length > 0
														? "bg-yellow"
														: "bg-pink"
												}`}
											></button>
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
									onClick={save}
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
		</>
	);
};

export default Drum;
