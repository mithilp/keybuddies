"use client";

import { playPiano, pressKey, releaseKey } from "@/utils/instruments";
import { pianoNotes } from "@/utils/piano-notes";
import { stopPreview } from "@/utils/preview";
import { PIANO_BAR_STEPS } from "@/utils/tempo";
import { DEFAULT_BARS } from "@/utils/clips";
import { ClipBars, Key } from "@/utils/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Piano as ReactPiano, KeyboardShortcuts } from "react-piano";
import "react-piano/dist/styles.css";
import PianoOptions from "./PianoOptions";
import PianoRoll from "./PianoRoll";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { CheckIcon, ICON, SoundIcon } from "@/components/ui/icons";
import { ErrorMessage } from "@/components/ui/feedback";
import { panelFooter } from "@/components/Panel";

// the keys shown to start with, C3 to F5
const FIRST_NOTE = 48;
const LAST_NOTE = 77;

// Everything for making a piano sound: the options, the keyboard, the grid
// and the buttons under it. Recording a new sound and editing a saved one
// are this with a different title and a different save.
//
// A new recording can be 1, 2 or 4 bars. A saved one is edited at the length
// it was made with, passed in as `bars`. Notes past the end stay in
// `sequence` so a shorter length can be tried and undone, and are only cut
// off what's played and saved, the same as the drum recorder.
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
	// can be a write. the button waits for it and says when it didn't work.
	onSave: (sequence: Key[], bars: ClipBars) => void | Promise<void>;
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

	// what's heard and saved at this length
	const inside = useMemo(() => pianoNotes(sequence, steps), [sequence, steps]);

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
		playPiano(inside, bpm, length);
		listenTimer.current = setTimeout(() => {
			setListening(false);
		}, multiplier * steps);
	};

	const idle = inside.length === 0 || recording;

	const [saving, setSaving] = useState(false);
	const [problem, setProblem] = useState("");

	const save = async () => {
		setSaving(true);
		setProblem("");

		try {
			await onSave(inside, length);
		} catch (error) {
			console.error(error);
			setProblem("Couldn't save the recording. Try again.");
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="flex-1 flex flex-col gap-4">
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
				// only a new recording can pick its length
				bars={bars === undefined ? chosen : undefined}
				setBars={setChosen}
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
			<div className={panelFooter}>
				<div className="hidden sm:block text-lg">Done Recording?</div>
				<div className="flex flex-wrap gap-4">
					<Button size="lg" onClick={listen} disabled={idle || listening}>
						{listening ? (
							<Spinner size="sm" label="Playing" />
						) : (
							<SoundIcon size={ICON} aria-hidden />
						)}
						Listen to Recording
					</Button>
					<Button
						size="lg"
						variant="primary"
						onClick={save}
						disabled={idle || saving}
					>
						{saving ? (
							<Spinner size="sm" label="Saving" />
						) : (
							<CheckIcon size={ICON} aria-hidden />
						)}
						{saveLabel}
					</Button>
				</div>
				{problem && <ErrorMessage className="w-full">{problem}</ErrorMessage>}
			</div>
		</div>
	);
};

export default PianoEditor;
