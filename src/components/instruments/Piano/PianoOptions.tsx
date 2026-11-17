import MIDI from "@/utils/MIDI";
import Metronome from "../Metronome";
import { useEffect, useRef, useState } from "react";
import { ClipBars } from "@/utils/types";
import LengthPicker from "../LengthPicker";

const PianoOptions = ({
	firstNote,
	setFirstNote,
	lastNote,
	setLastNote,
	multiplier,
	recording,
	empty,
	onRecord,
	onStop,
	onReset,
	bars,
	setBars,
}: {
	firstNote: number;
	setFirstNote: (note: number) => void;
	lastNote: number;
	setLastNote: (note: number) => void;
	multiplier: number;
	recording: boolean;
	empty: boolean;
	onRecord: () => void;
	onStop: () => void;
	onReset: () => void;
	// how long a new recording is, not there when editing a saved one
	bars?: ClipBars;
	setBars: (bars: ClipBars) => void;
}) => {
	const [countdown, setCountdown] = useState(0);

	const open = useRef(true);
	useEffect(() => {
		open.current = true;
		return () => {
			open.current = false;
		};
	}, []);

	const record = async () => {
		if (recording) {
			onStop();
			return;
		}

		// already counting down
		if (countdown > 0) return;

		for (let i = 3; i > 0; i--) {
			setCountdown(i);
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// closed during the countdown
			if (!open.current) return;
		}

		setCountdown(0);
		onRecord();
	};

	return (
		<div className="flex flex-wrap items-center justify-between gap-4">
			<div className="flex flex-wrap gap-4">
				{bars !== undefined && (
					<LengthPicker
						id="pianoLength"
						bars={bars}
						setBars={setBars}
						disabled={recording || countdown > 0}
					/>
				)}

				<div className="flex items-center space-x-2">
					<label className="text-lg whitespace-nowrap" htmlFor="firstNote">
						First Note:
					</label>
					<select
						id="firstNote"
						className="w-32 bg-yellow border-8 border-black p-2 rounded-xl"
						value={firstNote.toString()}
						onChange={(e) => {
							setFirstNote(Number(e.target.value));
						}}
					>
						{MIDI.filter((note) => note.value < lastNote).map((note) => (
							<option key={note.value} value={note.value}>
								{note.label}
							</option>
						))}
					</select>
				</div>

				<div className="flex items-center space-x-2">
					<label className="text-lg whitespace-nowrap" htmlFor="lastNote">
						Last Note:
					</label>
					<select
						id="lastNote"
						className="w-32 bg-yellow border-8 border-black p-2 rounded-xl"
						value={lastNote.toString()}
						onChange={(e) => {
							setLastNote(Number(e.target.value));
						}}
					>
						{MIDI.filter((note) => note.value > firstNote).map((note) => (
							<option key={note.value} value={note.value}>
								{note.label}
							</option>
						))}
					</select>
				</div>
			</div>

			<div className="flex space-x-4 whitespace-nowrap">
				<Metronome mspb={multiplier} />
				<button
					onClick={record}
					className="bg-yellow border-8 border-black p-2 rounded-xl"
				>
					{countdown > 0
						? `Starting in ${countdown}s`
						: recording
							? "Stop Recording"
							: "Start Recording"}
				</button>

				{/* always here, so the first note doesn't push everything down */}
				<button
					onClick={onReset}
					disabled={empty}
					className="disabled:opacity-50 bg-yellow border-8 border-black p-2 rounded-xl"
				>
					Reset Recording
				</button>
			</div>
		</div>
	);
};

export default PianoOptions;
