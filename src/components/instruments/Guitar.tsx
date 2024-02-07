"use client";

import { playPiano } from "@/utils/instruments";
import { FaGuitar } from "react-icons/fa";
import {
	MidiNumbers,
	//@ts-ignore
} from "react-piano";

const Guitar = ({ bpm }: { bpm: number }) => {
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

	return (
		<button
			onClick={() => playPiano(music, bpm)}
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
