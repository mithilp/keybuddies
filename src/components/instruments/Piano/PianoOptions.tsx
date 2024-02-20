import MIDI from "@/utils/MIDI";
import Metronome from "../Metronome";
import { Key } from "@/utils/types";
import { useState } from "react";

const PianoOptions = ({
	firstNote,
	setFirstNote,
	lastNote,
	setLastNote,
	multiplier,
	recording,
	sequence,
	setSequence,
	setStartTime,
	setRecording,
}: {
	firstNote: number;
	setFirstNote: Function;
	lastNote: number;
	setLastNote: Function;
	multiplier: number;
	recording: boolean;
	sequence: Key[];
	setSequence: Function;
	setStartTime: Function;
	setRecording: Function;
}) => {
	const [countdown, setCountdown] = useState(0);

	const record = async () => {
		if (!recording) {
			for (let i = 3; i > -1; i--) {
				setCountdown(i);
				if (i != 0) {
					await new Promise((resolve) => setTimeout(resolve, 1000));
				}
			}

			setSequence([]);
			setStartTime(Date.now());
			setRecording(true);
		} else {
			setRecording(false);
		}
	};

	return (
		<div className="flex items-center justify-between">
			<div className="flex space-x-4">
				<div className="flex items-center space-x-2">
					<label className="text-lg" htmlFor="firstNote">
						First Note:
					</label>
					<select
						className="w-32 bg-yellow border-8 border-black p-2 rounded-xl"
						value={firstNote.toString()}
						onChange={(e) => {
							setFirstNote(Number(e.target.value));
						}}
					>
						{MIDI.map((note, index) => (
							<option key={index} value={note.value}>
								{note.text}
							</option>
						))}
					</select>
				</div>

				<div className="flex items-center space-x-2">
					<label className="text-lg" htmlFor="firstNote">
						Last Note:
					</label>
					<select
						className="w-32 bg-yellow border-8 border-black p-2 rounded-xl"
						value={lastNote.toString()}
						onChange={(e) => {
							setLastNote(Number(e.target.value));
						}}
					>
						{MIDI.map((note, index) => (
							<option key={index} value={note.value}>
								{note.text}
							</option>
						))}
					</select>
				</div>
			</div>

			<div className="flex space-x-4">
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

				{sequence.length > 0 && (
					<button
						onClick={() => {
							setSequence([]);
							setStartTime(Date.now());
						}}
						className="bg-yellow border-8 border-black p-2 rounded-xl"
					>
						Reset Recording
					</button>
				)}
			</div>
		</div>
	);
};

export default PianoOptions;
