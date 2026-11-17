"use client";

import { playPiano, pressKey, releaseKey } from "@/utils/instruments";
import { pianoNotes } from "@/utils/piano-notes";
import { stopPreview } from "@/utils/preview";
import { PIANO_BAR_STEPS } from "@/utils/tempo";
import { DEFAULT_BARS } from "@/utils/clips";
import { ClipBars, Key } from "@/utils/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaCheck, FaVolumeUp } from "react-icons/fa";
import { Piano as ReactPiano, KeyboardShortcuts } from "react-piano";
import "react-piano/dist/styles.css";
import PianoOptions from "./PianoOptions";
import PianoRoll from "./PianoRoll";

// the keys shown to start with, C3 to F5
const FIRST_NOTE = 48;
const LAST_NOTE = 77;

// Everything for making a piano sound: the options, the keyboard, the grid
// and the buttons under it. Recording a new sound and editing a saved one
// are this with a different title and a different save.
//
// A new recording can be 1, 2 or 4 bars. A saved one is edited at the length
// it was made with, passed in as `bars`.
const PianoEditor = ({
	bpm,
	initial,
	bars,
	saveLabel,
	onSave,
	paused = false,
}: {
	bpm: number;
	initial?: Key[];
	bars?: ClipBars;
	saveLabel: string;
	onSave: (sequence: Key[], bars: ClipBars) => void;
	// the keyboard stops listening, for when something is being typed
	paused?: boolean;
}) => {
	// how many milliseconds one step is
	const multiplier = 7500 / bpm;

	const [chosen, setChosen] = useState<ClipBars>(DEFAULT_BARS);
	const length = bars ?? chosen;
	const steps = length * PIANO_BAR_STEPS;

	const [firstNote, setFirstNote] = useState(FIRST_NOTE);
	const [lastNote, setLastNote] = useState(LAST_NOTE);

	const [sequence, setSequence] = useState<Array<Key>>(() =>
		pianoNotes(initial ?? [], steps)
	);
	const [recording, setRecording] = useState(false);

	// when the recording started, and the note of every key that's down
	const startedAt = useRef(0);
	const held = useRef(new Map<number, Key>());

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

	// Ends the recording. A key that's still down has its note closed here, at
	// the step the recording stopped on, so no note is left without an end.
	const stopRecording = useCallback(() => {
		const step = Math.min(
			steps,
			Math.round((Date.now() - startedAt.current) / multiplier)
		);

		const open = [...held.current.values()];
		held.current.clear();

		if (open.length > 0) {
			setSequence((sequence) =>
				sequence.map((key) =>
					open.includes(key)
						? { ...key, end: Math.max(key.start + 1, step) }
						: key
				)
			);
		}

		setRecording(false);
	}, [multiplier, steps]);

	// a recording is as long as the sound and stops by itself at the end
	useEffect(() => {
		if (!recording) return;

		const left = steps * multiplier - (Date.now() - startedAt.current);
		const timer = setTimeout(stopRecording, Math.max(0, left));

		return () => clearTimeout(timer);
	}, [recording, multiplier, steps, stopRecording]);

	const startRecording = () => {
		held.current.clear();
		startedAt.current = Date.now();
		setSequence([]);
		setRecording(true);
	};

	const press = (note: number) => {
		pressKey(note);

		if (!recording) return;

		const step = Math.round((Date.now() - startedAt.current) / multiplier);
		if (step >= steps) {
			stopRecording();
			return;
		}

		// one step long until the key comes up
		const key = { note: note, start: step, end: step + 1 };
		held.current.set(note, key);
		setSequence((sequence) => [...sequence, key]);
	};

	const release = (note: number) => {
		releaseKey(note);

		const key = held.current.get(note);
		if (!key) return;
		held.current.delete(note);

		const step = Math.round((Date.now() - startedAt.current) / multiplier);
		const end = Math.min(steps, Math.max(key.start + 1, step));

		setSequence((sequence) =>
			sequence.map((other) => (other === key ? { ...key, end: end } : other))
		);
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
		playPiano(sequence, bpm, length);
		listenTimer.current = setTimeout(() => {
			setListening(false);
		}, multiplier * steps);
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
				onRecord={startRecording}
				onStop={stopRecording}
				// only a new recording can pick its length. notes past a
				// shorter end are cut off it.
				bars={bars === undefined ? chosen : undefined}
				setBars={(next) => {
					setChosen(next);
					setSequence((sequence) =>
						pianoNotes(sequence, next * PIANO_BAR_STEPS)
					);
				}}
				// ends the take too. the timer that stops a recording by itself
				// was set when it started and wouldn't know about a new start.
				onReset={() => {
					held.current.clear();
					setSequence([]);
					setRecording(false);
				}}
			/>

			<div className="w-full h-12">
				<ReactPiano
					noteRange={{ first: firstNote, last: lastNote }}
					playNote={press}
					stopNote={release}
					keyboardShortcuts={keyboardShortcuts}
					disabled={paused}
				/>
			</div>

			<PianoRoll
				sequence={sequence}
				onChange={setSequence}
				firstNote={firstNote}
				lastNote={lastNote}
				bpm={bpm}
				steps={steps}
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
						onClick={() => onSave(sequence, length)}
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
