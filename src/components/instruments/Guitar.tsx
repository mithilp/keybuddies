"use client";

import { FaGuitar } from "react-icons/fa";
import {
	Piano as ReactPiano,
	KeyboardShortcuts,
	MidiNumbers,
	//@ts-ignore
} from "react-piano";
import { Soundfont } from "smplr";
import { useState, useEffect } from "react";

const Guitar = () => {
	let music = [
		{
			note: 14,
			start: 1,
			end: 4,
		},
		{
			note: 100,
			start: 1,
			end: 1.5,
		},
		{
			note: 20,
			start: 8,
			end: 9,
		},
	];
	const context = new AudioContext();
	const piano = new Soundfont(context, { instrument: "acoustic_grand_piano" });

	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		piano.load.then(() => {
			setLoaded(true);
		});
	}, []);
	console.log(MidiNumbers);
	// let play = () => {
	// 	piano.start({
	// 		note: MidiNumbers.getAttributes(14).note,
	// 	});
	// };
	let play = () => {
		for (let i = 0; i < music.length; i++) {
			let note = music[i].note;
			let start = music[i].start;
			let end = music[i].end;
			setTimeout(() => {
				console.log("started" + i);
				piano.start({
					note: MidiNumbers.getAttributes(note).note,
				});
			}, start * 1000);
			setTimeout(() => {
				console.log("Stooped" + i);
				piano.stop(note);
			}, end * 1000);
		}
	};

	return (
		<button
			onClick={play}
			className="bg-yellow p-4 w-full rounded-xl border-8 border-black cursor-pointer"
		>
			<div className="flex items-center space-x-2">
				<FaGuitar size={32} />
				<div className="text-xl">Guitar</div>
			</div>
		</button>
	);
};

export default Guitar;
