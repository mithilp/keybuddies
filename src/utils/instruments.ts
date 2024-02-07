"use client";
import { Soundfont } from "smplr";
import {
	MidiNumbers,
	//@ts-ignore
} from "react-piano";

const context = new AudioContext();

export const piano = new Soundfont(context, {
	instrument: "acoustic_grand_piano",
});

export const playPiano = (
	music: Array<{ note: number; start: number; end: number }>,
	bpm: number
) => {
	const time = 7500 / bpm;
	for (let i = 0; i < music.length; i++) {
		const note = music[i].note;
		const start = music[i].start;
		const end = music[i].end;
		setTimeout(() => {
			piano.start({
				note: MidiNumbers.getAttributes(note).note,
			});
		}, start * time);
		setTimeout(() => {
			piano.stop(note);
		}, end * time);
	}
};
