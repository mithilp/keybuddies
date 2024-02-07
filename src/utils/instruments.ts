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
	music: Array<{ note: number; start: number; end: number }>
) => {
	for (let i = 0; i < music.length; i++) {
		let note = music[i].note;
		let start = music[i].start;
		let end = music[i].end;
		setTimeout(() => {
			piano.start({
				note: MidiNumbers.getAttributes(note).note,
			});
		}, start);
		setTimeout(() => {
			piano.stop(note);
		}, end);
	}
};
