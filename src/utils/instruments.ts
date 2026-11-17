"use client";

import { Key, Sound } from "./types";
import crunker from "./crunker";
import MIDI from "./MIDI";
import { mixDrums } from "./drum-synth";

// every note of a piano recording as its own buffer, padded with silence up
// to where the note starts
const pianoNotes = async (music: Array<Key>, bpm: number) => {
	const time = 7500 / bpm;

	const audios: AudioBuffer[] = [];

	for await (const key of music) {
		const note: any = MIDI.filter((midi) => midi.value === key.note)[0].text;
		const start = key.start;
		const end = key.end;

		const buffers = await crunker?.fetchAudio(`/sounds/piano/${note}.ogg`);

		if (buffers) {
			// a note held longer than its sample ends where the sample does.
			// slicing past the end fills the rest with NaN, which silences
			// everything it gets merged with.
			const trimmed = crunker?.sliceAudio(
				buffers[0],
				0,
				Math.min(((end - start) * time) / 1000, buffers[0].duration)
			);
			const padded = crunker?.padAudio(trimmed!, 0, (start * time) / 1000);

			audios.push(padded!);
		} else {
			console.log("Something went wrong loading key", note);
		}
	}

	return audios;
};

export const playPiano = async (music: Array<Key>, bpm: number) => {
	const merged = crunker?.mergeAudio(await pianoNotes(music, bpm));

	const exported = crunker?.export(merged!, "audio/mp3");

	const audio = new Audio(exported!.url);
	audio.play();
};

// One recorded sound as a buffer that fills a cell, ready to go into a track.
// `frames` is how many samples a cell is at this tempo.
export const renderSound = async (
	type: Sound["type"],
	music: Array<Key>,
	bpm: number,
	frames: number
) => {
	if (type === "drum") {
		return renderDrum(music, bpm, frames);
	}

	// a cell of silence under the notes, so the sound is never shorter than
	// its cell
	const context = crunker!.context;
	const cell = context.createBuffer(2, frames, context.sampleRate);

	return crunker!.mergeAudio([...(await pianoNotes(music, bpm)), cell]);
};

// A drum beat as a buffer on crunker's context, so it can be merged into a
// track the same way piano is. Stereo, because crunker only fills the
// channels a buffer has. `frames` forces an exact length.
export const renderDrum = (music: Array<Key>, bpm: number, frames?: number) => {
	const context = crunker!.context;
	const samples = mixDrums(music, bpm, context.sampleRate, frames);

	const buffer = context.createBuffer(2, samples.length, context.sampleRate);
	buffer.getChannelData(0).set(samples);
	buffer.getChannelData(1).set(samples);

	return buffer;
};

const start = (buffer: AudioBuffer) => {
	const context = crunker!.context;

	// browsers keep the context suspended until the first click
	if (context.state === "suspended") {
		context.resume();
	}

	const source = context.createBufferSource();
	source.buffer = buffer;
	source.connect(context.destination);
	source.start();

	return source;
};

let beat: AudioBufferSourceNode | null = null;

export const playDrum = (music: Array<Key>, bpm: number) => {
	if (!crunker) return;

	stopDrum();
	beat = start(renderDrum(music, bpm));
};

export const stopDrum = () => {
	if (beat) {
		beat.stop();
		beat = null;
	}
};

const hits = new Map<number, AudioBuffer>();

// one hit of one drum, for clicking around the grid
export const playDrumHit = (note: number) => {
	if (!crunker) return;

	let buffer = hits.get(note);
	if (!buffer) {
		buffer = renderDrum([{ note: note, start: 0, end: 1 }], 120);
		hits.set(note, buffer);
	}

	start(buffer);
};
