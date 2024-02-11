"use client";
import { Soundfont, DrumMachine } from "smplr";
import {
	MidiNumbers,
	//@ts-ignore
} from "react-piano";

const context = new AudioContext();

export const piano = new Soundfont(context, {
	instrument: "acoustic_grand_piano",
});

export const drum = new DrumMachine(context, { instrument: "TR-808" });

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

export const playDrum = (
	music: Array<{ note: string; start: number }>,
	bpm: number
) => {
	const now = context.currentTime;
	console.log(music);
	const time = 30 / bpm;
	for (let i = 0; i < music.length; i++) {
		const note = music[i].note;
		const start = music[i].start;
		console.log(`playing ${music[i].note}`);
		drum.start({
			note: note,
			time: now + start * time,
		});
	}
};
