"use client";

import { db } from "@/utils/firebase";
import { playPiano } from "@/utils/instruments";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import { FaCheck, FaVolumeUp } from "react-icons/fa";
import { FaCircleXmark } from "react-icons/fa6";
import { MdPiano } from "react-icons/md";
import {
	Piano as ReactPiano,
	KeyboardShortcuts,
	MidiNumbers,
	//@ts-ignore
} from "react-piano";
import "react-piano/dist/styles.css";
import { Soundfont } from "smplr";

const Piano = ({
	piano,
	studio,
	bpm,
}: {
	piano: Soundfont;
	studio: string;
	bpm: number;
}) => {
	const [open, setOpen] = useState(false);

	const [firstNote, setFirstNote] = useState(MidiNumbers.fromNote("c3"));
	const [lastNote, setLastNote] = useState(MidiNumbers.fromNote("f5"));

	const keyboardShortcuts = KeyboardShortcuts.create({
		firstNote: firstNote,
		lastNote: lastNote,
		keyboardConfig: KeyboardShortcuts.HOME_ROW,
	});

	const [sequence, setSequence] = useState<
		Array<{ note: number; start: number; end: number }>
	>([]);
	const [recording, setRecording] = useState(false);

	const [startTime, setStartTime] = useState<number>(Date.now());

	const [countdown, setCountdown] = useState(0);

	const record = async () => {
		if (!recording) {
			for (let i = 3; i > -1; i--) {
				setCountdown(i);
				console.log("updated countdown", i);
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

	const updateArray = (noteNumber: number, endTime: number) => {
		for (let i = sequence.length - 1; i >= 0; i--) {
			if (sequence[i].note === noteNumber) {
				sequence[i].end = endTime;
				return sequence;
			}
		}
		return sequence;
	};

	const save = async () => {
		const name = prompt("Name your recording");

		await addDoc(collection(db, `studios/${studio}/sounds`), {
			name: name,
			type: "piano",
			sequence: sequence,
		});

		setOpen(false);
	};

	return (
		<>
			<button
				onClick={() => setOpen(!open)}
				className="bg-yellow p-4 w-full rounded-xl border-8 border-black cursor-pointer"
			>
				<div className="flex items-center space-x-2">
					<MdPiano size={32} />
					<div className="text-xl">Piano</div>
				</div>
			</button>

			{open && (
				<div className="fixed top-0 left-0 z-20 w-screen h-screen p-24">
					<div className="bg-blue border-8 border-black h-full rounded-xl p-8 space-y-4">
						<div className="flex justify-between items-center">
							<h3 className="text-2xl font-bold">Record a Piano Sound</h3>
							<button onClick={() => setOpen(false)}>
								<FaCircleXmark size={32} />
							</button>
						</div>

						<div className="space-y-4">
							<div className="flex space-x-4">
								<div className="flex items-center space-x-2">
									<label className="text-xl" htmlFor="firstNote">
										First Note:
									</label>
									<select
										className="w-32 bg-yellow border-8 border-black p-2 rounded-xl"
										value={firstNote.toString()}
										onChange={(e) => {
											setFirstNote(Number(e.target.value));
										}}
									>
										<option value="12">C0</option>
										<option value="14">D0</option>
										<option value="16">E0</option>
										<option value="17">F0</option>
										<option value="19">G0</option>
										<option value="21">A0</option>
										<option value="23">B0</option>
										<option value="24">C1</option>
										<option value="26">D1</option>
										<option value="28">E1</option>
										<option value="29">F1</option>
										<option value="31">G1</option>
										<option value="33">A1</option>
										<option value="35">B1</option>
										<option value="36">C2</option>
										<option value="38">D2</option>
										<option value="40">E2</option>
										<option value="41">F2</option>
										<option value="43">G2</option>
										<option value="45">A2</option>
										<option value="47">B2</option>
										<option value="48">C3</option>
										<option value="50">D3</option>
										<option value="52">E3</option>
										<option value="53">F3</option>
										<option value="55">G3</option>
										<option value="57">A3</option>
										<option value="59">B3</option>
										<option value="60">C4</option>
										<option value="62">D4</option>
										<option value="64">E4</option>
										<option value="65">F4</option>
										<option value="67">G4</option>
										<option value="69">A4</option>
										<option value="71">B4</option>
										<option value="72">C5</option>
										<option value="74">D5</option>
										<option value="76">E5</option>
										<option value="77">F5</option>
										<option value="79">G5</option>
										<option value="81">A5</option>
										<option value="83">B5</option>
										<option value="84">C6</option>
										<option value="86">D6</option>
										<option value="88">E6</option>
										<option value="89">F6</option>
										<option value="91">G6</option>
										<option value="93">A6</option>
										<option value="95">B6</option>
										<option value="96">C7</option>
										<option value="98">D7</option>
										<option value="100">E7</option>
										<option value="101">F7</option>
										<option value="103">G7</option>
										<option value="105">A7</option>
										<option value="107">B7</option>
										<option value="108">C8</option>
										<option value="110">D8</option>
										<option value="112">E8</option>
										<option value="113">F8</option>
										<option value="115">G8</option>
										<option value="117">A8</option>
										<option value="119">B8</option>
										<option value="120">C9</option>
										<option value="122">D9</option>
										<option value="124">E9</option>
										<option value="125">F9</option>
										<option value="127">G9</option>
									</select>
								</div>

								<div className="flex items-center space-x-2">
									<label className="text-xl" htmlFor="firstNote">
										Last Note:
									</label>
									<select
										className="w-32 bg-yellow border-8 border-black p-2 rounded-xl"
										value={lastNote.toString()}
										onChange={(e) => {
											setLastNote(Number(e.target.value));
										}}
									>
										<option value="12">C0</option>
										<option value="14">D0</option>
										<option value="16">E0</option>
										<option value="17">F0</option>
										<option value="19">G0</option>
										<option value="21">A0</option>
										<option value="23">B0</option>
										<option value="24">C1</option>
										<option value="26">D1</option>
										<option value="28">E1</option>
										<option value="29">F1</option>
										<option value="31">G1</option>
										<option value="33">A1</option>
										<option value="35">B1</option>
										<option value="36">C2</option>
										<option value="38">D2</option>
										<option value="40">E2</option>
										<option value="41">F2</option>
										<option value="43">G2</option>
										<option value="45">A2</option>
										<option value="47">B2</option>
										<option value="48">C3</option>
										<option value="50">D3</option>
										<option value="52">E3</option>
										<option value="53">F3</option>
										<option value="55">G3</option>
										<option value="57">A3</option>
										<option value="59">B3</option>
										<option value="60">C4</option>
										<option value="62">D4</option>
										<option value="64">E4</option>
										<option value="65">F4</option>
										<option value="67">G4</option>
										<option value="69">A4</option>
										<option value="71">B4</option>
										<option value="72">C5</option>
										<option value="74">D5</option>
										<option value="76">E5</option>
										<option value="77">F5</option>
										<option value="79">G5</option>
										<option value="81">A5</option>
										<option value="83">B5</option>
										<option value="84">C6</option>
										<option value="86">D6</option>
										<option value="88">E6</option>
										<option value="89">F6</option>
										<option value="91">G6</option>
										<option value="93">A6</option>
										<option value="95">B6</option>
										<option value="96">C7</option>
										<option value="98">D7</option>
										<option value="100">E7</option>
										<option value="101">F7</option>
										<option value="103">G7</option>
										<option value="105">A7</option>
										<option value="107">B7</option>
										<option value="108">C8</option>
										<option value="110">D8</option>
										<option value="112">E8</option>
										<option value="113">F8</option>
										<option value="115">G8</option>
										<option value="117">A8</option>
										<option value="119">B8</option>
										<option value="120">C9</option>
										<option value="122">D9</option>
										<option value="124">E9</option>
										<option value="125">F9</option>
										<option value="127">G9</option>
									</select>
								</div>
							</div>

							<div className="w-full h-24">
								<ReactPiano
									noteRange={{ first: firstNote, last: lastNote }}
									playNote={(midiNumber: number) => {
										piano.start({
											note: MidiNumbers.getAttributes(midiNumber).note,
										});
										if (recording) {
											setSequence([
												...sequence,
												{
													note: midiNumber,
													start: Date.now() - startTime,
													end: 0,
												},
											]);
										}
									}}
									stopNote={(midiNumber: number) => {
										piano.stop(midiNumber);
										if (recording) {
											setSequence(
												updateArray(midiNumber, Date.now() - startTime)
											);
										}
									}}
									keyboardShortcuts={keyboardShortcuts}
								/>
							</div>

							<div className="w-full flex items-end space-x-4">
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

							{sequence.length > 0 && !recording && (
								<div className="space-y-2">
									<div className="text-xl">Done Recording?</div>
									<div className="space-x-4 flex">
										<button
											onClick={() => playPiano(sequence, bpm)}
											className="bg-yellow p-2 flex items-center justify-center space-x-2 border-8 border-black rounded-xl"
										>
											<div>Listen to Recording</div>
											<FaVolumeUp size={32} />
										</button>
										<button
											onClick={save}
											className="bg-yellow p-2 flex items-center justify-center space-x-2 border-8 border-black rounded-xl"
										>
											<div>Save Recording</div>
											<FaCheck size={32} />
										</button>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default Piano;
