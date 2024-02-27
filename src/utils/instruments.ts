"use client";

import { DrumMachine } from "smplr";
import { Key } from "./types";
import sounds from "./drum-sounds";
import crunker from "./crunker";
import MIDI from "./MIDI";

const context = typeof window !== "undefined" ? new AudioContext() : null;

export const drum = context
	? new DrumMachine(context!, { instrument: "TR-808" })
	: null;

export const playPiano = async (music: Array<Key>, bpm: number) => {
	const time = 7500 / bpm;

	const audios: AudioBuffer[] = [];

	for await (const key of music) {
		const note: any = MIDI.filter((midi) => midi.value === key.note)[0].text;
		const start = key.start;
		const end = key.end;

		const buffers = await crunker?.fetchAudio(`/sounds/piano/${note}.ogg`);

		if (buffers) {
			const trimmed = crunker?.sliceAudio(
				buffers[0],
				0,
				((end - start) * time) / 1000
			);
			const padded = crunker?.padAudio(trimmed!, 0, (start * time) / 1000);

			audios.push(padded!);
		} else {
			console.log("Something went wrong loading key", note);
		}
	}

	const merged = crunker?.mergeAudio(audios);

	const exported = crunker?.export(merged!, "audio/mp3");

	const audio = new Audio(exported!.url);
	audio.play();
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
