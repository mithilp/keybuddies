"use client";

import { Soundfont, DrumMachine } from "smplr";
import {
	MidiNumbers,
	//@ts-ignore
} from "react-piano";
import { Key } from "./types";
import sounds from "./drum-sounds";

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

export const playDrum = (music: Array<Key>, bpm: number) => {
	if (context && drum) {
		const now = context.currentTime;
		const time = 30 / bpm;
		for (let j = 0; j < 1; j++) {
			for (let i = 0; i < music.length; i++) {
				const note = sounds[music[i].note].note;
				const start = music[i].start;
				drum.start({
					note: note,
					time: now + j * 16 * time + start * time,
				});
			}
		}
	}
	return true;
};

export const stopDrum = () => {
	if (drum) {
		drum.stop({});
	}
};
