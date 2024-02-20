"use client";

import { Soundfont, DrumMachine } from "smplr";
import {
	MidiNumbers,
	//@ts-ignore
} from "react-piano";
import { Key } from "./types";

const context = typeof window !== "undefined" ? new AudioContext() : null;

export const piano = context
	? new Soundfont(context!, {
			instrument: "acoustic_grand_piano",
	  })
	: null;

export const drum = context
	? new DrumMachine(context!, { instrument: "TR-808" })
	: null;

export const playPiano = (music: Array<Key>, bpm: number) => {
	if (context && piano) {
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
	}
};

export const playDrum = (
	music: Array<{ note: string; start: number }>,
	bpm: number
) => {
	if (context && drum) {
		const now = context!.currentTime;
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
	}
};
