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
			note: 88,
			start: 0,
			end: 1,
		},
		{
			note: 88,
			start: 1.25,
			end: 1.75,
		},
		{
			note: 88,
			start: 2.5,
			end: 3.5,
		},
		{
			note: 76,
			start: 4,
			end: 4.5,
		},
		{
			note: 87,
			start: 5.5,
			end: 6.5,
		},
		{
			note: 87,
			start: 6.75,
			end: 7.25,
		},
		{
			note: 87,
			start: 8,
			end: 9,
		},
		{
			note: 75,
			start: 9.5,
			end: 10,
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
