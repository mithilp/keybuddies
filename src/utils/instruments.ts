"use client";

import { Key, Sound } from "./types";
import crunker, { wake } from "./crunker";
import { drumBeat, drumSteps, mixDrums } from "./drum-synth";
import { pianoNotes } from "./piano-notes";
import { preview, stopPreview } from "./preview";
import { hasPianoNote, loadPianoNote } from "./samples";
import { framesOf, PIANO_BAR_STEPS } from "./tempo";
import { soundBars } from "./clips";

// seconds a piano note takes to fade when it's cut off before its sample
// ends, so it doesn't click
const RELEASE = 0.005;

// A piano recording `bars` long as a stereo buffer of exactly that many
// samples. Every note is added straight into the buffer at the sample it
// starts on.
const renderPiano = async (music: Array<Key>, bpm: number, bars: number) => {
	const context = crunker!.context;
	const frames = framesOf(bars, bpm, context.sampleRate);
	const steps = bars * PIANO_BAR_STEPS;
	const step = frames / steps;

	// only the notes that can sound, each at least one step long
	const playable = pianoNotes(music, steps);

	// each different note is loaded once, and all of them at the same time
	const notes = [...new Set(playable.map((key) => key.note))];
	const buffers = await Promise.all(notes.map(loadPianoNote));
	const samples = new Map(notes.map((note, index) => [note, buffers[index]]));

	const out = context.createBuffer(2, frames, context.sampleRate);
	const fade = Math.round(RELEASE * context.sampleRate);

	for (const key of playable) {
		const sample = samples.get(key.note)!;
		const at = Math.round(key.start * step);

		// a note lasts until its end, the end of its sample or the end of the
		// sound, whichever is first
		const held = Math.round((key.end - key.start) * step);
		const length = Math.min(held, sample.length, frames - at);
		if (length <= 0) continue;

		// the sample has already rung out by its own end, so only fade a note
		// that stops short of it
		const release = length < sample.length ? Math.min(fade, length) : 0;

		for (let channel = 0; channel < 2; channel++) {
			const from = sample.getChannelData(
				Math.min(channel, sample.numberOfChannels - 1)
			);
			const to = out.getChannelData(channel);

			for (let i = 0; i < length; i++) {
				const left = length - i;
				to[at + i] += from[i] * (left < release ? left / release : 1);
			}
		}
	}

	return out;
};

// A drum beat as a buffer on crunker's context. Stereo, so it sits in a
// track the same way everything else does. `frames` forces an exact length.
// The hits are on the sixteenth grid, see drumBeat, and the beat is `steps`
// of them long.
const renderDrum = (
	music: Array<Key>,
	bpm: number,
	frames?: number,
	steps?: number
) => {
	const context = crunker!.context;
	const samples = mixDrums(music, bpm, context.sampleRate, frames, steps);

	const buffer = context.createBuffer(2, samples.length, context.sampleRate);
	buffer.getChannelData(0).set(samples);
	buffer.getChannelData(1).set(samples);

	return buffer;
};

// One recorded sound as a buffer exactly as long as the sound, 1, 2 or 4
// bars, ready to go into a track or to be listened to on its own.
export const renderSound = async (
	sound: Pick<Sound, "type" | "sequence" | "steps" | "bars">,
	bpm: number
) => {
	const bars = soundBars(sound.bars);

	if (sound.type === "drum") {
		return renderDrum(
			drumBeat(sound.sequence, sound.steps, sound.bars),
			bpm,
			framesOf(bars, bpm, crunker!.context.sampleRate),
			drumSteps(bars)
		);
	}

	return renderPiano(sound.sequence, bpm, bars);
};

const start = (buffer: AudioBuffer) => {
	const context = wake();

	const source = context.createBufferSource();
	source.buffer = buffer;
	source.connect(context.destination);
	source.start();

	return source;
};

// Listening to a sound on its own goes through the preview slot, so it
// stops whatever loop or sound was being listened to before.
export const playPiano = (
	music: Array<Key>,
	bpm: number,
	bars: number | undefined
) =>
	preview("piano", () =>
		renderSound({ type: "piano", sequence: music, bars: soundBars(bars) }, bpm)
	);

// `steps` and `bars` are the sound's fields, see drumBeat
export const playDrum = (
	music: Array<Key>,
	bpm: number,
	steps: number | undefined,
	bars: number | undefined
) =>
	preview("drum", () =>
		renderDrum(drumBeat(music, steps, bars), bpm, undefined, drumSteps(bars))
	);

export const stopDrum = () => stopPreview("drum");

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

// the piano keys that are down right now, by MIDI number
const held = new Map<number, Set<() => void>>();

// Plays a piano note until it's let go of. The first press of a note has to
// fetch its sample, after that it's instant. Returns what lets go of this
// one press.
export const pressKey = (note: number) => {
	if (!crunker || !hasPianoNote(note)) return () => {};

	const context = wake();

	let source: AudioBufferSourceNode | null = null;
	let gain: GainNode | null = null;
	let down = true;

	const release = () => {
		if (!down) return;
		down = false;
		held.get(note)?.delete(release);

		if (source && gain) {
			// a quick fade instead of a cut, so letting go doesn't click
			gain.gain.setTargetAtTime(0, context.currentTime, 0.02);
			source.stop(context.currentTime + 0.15);
		}
	};

	if (!held.has(note)) held.set(note, new Set());
	held.get(note)!.add(release);

	loadPianoNote(note)
		.then((buffer) => {
			// let go of before the sample got here
			if (!down) return;

			gain = context.createGain();
			gain.connect(context.destination);

			source = context.createBufferSource();
			source.buffer = buffer;
			source.connect(gain);
			source.onended = () => {
				down = false;
				held.get(note)?.delete(release);
				gain?.disconnect();
			};
			source.start();
		})
		.catch((error) => {
			held.get(note)?.delete(release);
			console.error(error);
		});

	return release;
};

// lets go of every press of a note
export const releaseKey = (note: number) => {
	for (const release of [...(held.get(note) ?? [])]) release();
};
