"use client";

import { useEffect, useState } from "react";
import { FaCircleXmark } from "react-icons/fa6";
import { MdPiano } from "react-icons/md";
import {
	Piano as ReactPiano,
	KeyboardShortcuts,
	MidiNumbers,
} from "react-piano";
import "react-piano/dist/styles.css";

import { Soundfont } from "smplr";

const Piano = () => {
	const [open, setOpen] = useState(false);

	const [firstNote, setFirstNote] = useState(MidiNumbers.fromNote("c3"));
	const [lastNote, setLastNote] = useState(MidiNumbers.fromNote("f5"));

	const keyboardShortcuts = KeyboardShortcuts.create({
		firstNote: firstNote,
		lastNote: lastNote,
		keyboardConfig: KeyboardShortcuts.HOME_ROW,
	});

	const [loaded, setLoaded] = useState(false);

	const context = new AudioContext();
	const piano = new Soundfont(context, { instrument: "acoustic_grand_piano" });

	useEffect(() => {
		piano.load.then(() => {
			setLoaded(true);
		});
	}, []);

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

						{loaded ? (
							<div className="space-y-4">
								<div className="flex items-end justify-between">
									<div className="flex space-x-2">
										<div>
											<label className="text-xl" htmlFor="firstNote">
												First Note:
											</label>
											<select
												className="w-full bg-yellow border-8 border-black p-2 rounded-xl"
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

										<div>
											<label className="text-xl" htmlFor="firstNote">
												Last Note:
											</label>
											<select
												className="w-full bg-yellow border-8 border-black p-2 rounded-xl"
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

									<div className="flex space-x-2">
										<button className="bg-yellow border-8 border-black p-2 rounded-xl">
											Start Recording
										</button>
									</div>
								</div>

								<div className="w-full h-24">
									<ReactPiano
										noteRange={{ first: firstNote, last: lastNote }}
										playNote={(midiNumber: number) => {
											piano.start({
												note: MidiNumbers.getAttributes(midiNumber).note,
											});
										}}
										stopNote={(midiNumber: number) => {
											piano.stop(midiNumber);
										}}
										keyboardShortcuts={keyboardShortcuts}
									/>
								</div>
							</div>
						) : (
							<p>Loading piano...</p>
						)}
					</div>
				</div>
			)}
		</>
	);
};

export default Piano;
