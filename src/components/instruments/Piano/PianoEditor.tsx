"use client";

import { playPiano, pressKey, releaseKey } from "@/utils/instruments";
import { stopPreview } from "@/utils/preview";
import { PIANO_STEPS } from "@/utils/tempo";
import { Key } from "@/utils/types";
import { useEffect, useMemo, useRef, useState } from "react";
import { FaCheck, FaVolumeUp } from "react-icons/fa";
import {
	Piano as ReactPiano,
	KeyboardShortcuts,
	//@ts-ignore
} from "react-piano";
import "react-piano/dist/styles.css";
import PianoOptions from "./PianoOptions";
import PianoRoll from "./PianoRoll";

// the keys shown to start with, C3 to F5
const FIRST_NOTE = 48;
const LAST_NOTE = 77;

// Everything for making a piano sound: the options, the keyboard, the grid
// and the buttons under it. Recording a new sound and editing a saved one
// are this with a different title and a different save.
const PianoEditor = ({
	bpm,
	initial,
	saveLabel,
	onSave,
}: {
	bpm: number;
	initial?: Key[];
	saveLabel: string;
	onSave: (sequence: Key[]) => void;
}) => {
	// how many milliseconds one step is
	const multiplier = 7500 / bpm;

	const [firstNote, setFirstNote] = useState(FIRST_NOTE);
	const [lastNote, setLastNote] = useState(LAST_NOTE);

	const [sequence, setSequence] = useState<Array<Key>>(initial ?? []);
	const [recording, setRecording] = useState(false);
	const [startTime, setStartTime] = useState<number>(Date.now());

	const [listening, setListening] = useState(false);
	const listenTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const keyboardShortcuts = useMemo(
		() =>
			KeyboardShortcuts.create({
				firstNote: firstNote,
				lastNote: lastNote,
				keyboardConfig: KeyboardShortcuts.HOME_ROW,
			}),
		[firstNote, lastNote]
	);

	const updateArray = (noteNumber: number, endTime: number) => {
		for (let i = sequence.length - 1; i >= 0; i--) {
			if (sequence[i].note === noteNumber) {
				sequence[i].end = endTime;
				return sequence;
			}
		}
		return sequence;
	};

	useEffect(
		() => () => {
			if (listenTimer.current) clearTimeout(listenTimer.current);
			stopPreview("piano");
		},
		[]
	);

	const listen = () => {
		if (listening) return;

		setListening(true);
		playPiano(sequence, bpm);
		listenTimer.current = setTimeout(() => {
			setListening(false);
		}, multiplier * PIANO_STEPS);
	};

	const idle = sequence.length === 0 || recording;

	return (
		<div className="space-y-4">
			<PianoOptions
				firstNote={firstNote}
				setFirstNote={setFirstNote}
				lastNote={lastNote}
				setLastNote={setLastNote}
				multiplier={multiplier}
				recording={recording}
				empty={sequence.length === 0}
				onRecord={() => {
					setSequence([]);
					setStartTime(Date.now());
					setRecording(true);
				}}
				onStop={() => setRecording(false)}
				onReset={() => {
					setSequence([]);
					setStartTime(Date.now());
				}}
			/>

			<div className="w-full h-12">
				<ReactPiano
					noteRange={{ first: firstNote, last: lastNote }}
					playNote={(midiNumber: number) => {
						pressKey(midiNumber);

						if (recording) {
							const step = Math.round((Date.now() - startTime) / multiplier);

							if (step >= PIANO_STEPS) {
								setRecording(false);
							} else {
								setSequence([
									...sequence,
									{ note: midiNumber, start: step, end: 0 },
								]);
							}
						}
					}}
					stopNote={(midiNumber: number) => {
						releaseKey(midiNumber);

						if (recording) {
							const step = Math.round((Date.now() - startTime) / multiplier);

							setSequence(
								updateArray(
									midiNumber,
									step >= PIANO_STEPS ? PIANO_STEPS - 1 : step
								)
							);
							if (step >= PIANO_STEPS) {
								setRecording(false);
							}
						}
					}}
					keyboardShortcuts={keyboardShortcuts}
				/>
			</div>

			<PianoRoll
				sequence={sequence}
				onChange={setSequence}
				firstNote={firstNote}
				lastNote={lastNote}
				bpm={bpm}
			/>

			{/* always here too, greyed out until there's something to hear */}
			<div className="space-y-2">
				<div className="text-lg">Done Recording?</div>
				<div className="space-x-4 flex">
					<button
						onClick={listen}
						disabled={idle || listening}
						className="disabled:opacity-50 bg-yellow p-2 flex items-center justify-center space-x-2 border-8 border-black rounded-xl"
					>
						<div>Listen to Recording</div>

						{listening ? (
							<div className="animate-spin w-6 h-6 border-4 border-black border-b-transparent rounded-full"></div>
						) : (
							<FaVolumeUp size={32} />
						)}
					</button>
					<button
						onClick={() => onSave(sequence)}
						disabled={idle}
						className="disabled:opacity-50 bg-yellow p-2 flex items-center justify-center space-x-2 border-8 border-black rounded-xl"
					>
						<div>{saveLabel}</div>
						<FaCheck size={32} />
					</button>
				</div>
			</div>
		</div>
	);
};

export default PianoEditor;
