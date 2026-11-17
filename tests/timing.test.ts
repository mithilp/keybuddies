import assert from "node:assert/strict";
import { test } from "node:test";
import { DRUM_STEPS, drumVoices, mixDrums } from "../src/utils/drum-synth.ts";
import { CELL_BEATS, PIANO_STEPS, cellFrames } from "../src/utils/tempo.ts";

const TEMPOS = [80, 120, 160];
const RATES = [44100, 48000, 96000];

test("a cell is 8 beats long at every tempo", () => {
	assert.equal(cellFrames(120, 44100), 176400);
	assert.equal(cellFrames(80, 44100), 264600);
	assert.equal(cellFrames(160, 44100), 132300);
	assert.equal(cellFrames(120, 48000), 192000);

	for (const bpm of TEMPOS) {
		for (const rate of RATES) {
			assert.equal(cellFrames(bpm, rate), (CELL_BEATS * 60 * rate) / bpm);
		}
	}
});

test("a cell is a whole number of samples at odd tempos too", () => {
	for (const bpm of [77, 97, 133]) {
		const frames = cellFrames(bpm, 44100);

		assert.ok(Number.isInteger(frames));
		assert.ok(Math.abs(frames - (CELL_BEATS * 60 * 44100) / bpm) <= 0.5);
	}
});

test("twice the tempo is half the cell", () => {
	assert.equal(cellFrames(160, 48000) * 2, cellFrames(80, 48000));
});

test("piano and drum steps fill a cell exactly", () => {
	assert.equal(PIANO_STEPS, CELL_BEATS * 8);
	assert.equal(DRUM_STEPS, CELL_BEATS * 2);

	for (const bpm of TEMPOS) {
		for (const rate of RATES) {
			// an eighth of a beat and half a beat, in samples
			const pianoStep = (7.5 * rate) / bpm;
			const drumStep = (30 * rate) / bpm;

			assert.equal(Math.round(PIANO_STEPS * pianoStep), cellFrames(bpm, rate));
			assert.equal(Math.round(DRUM_STEPS * drumStep), cellFrames(bpm, rate));
		}
	}
});

test("a drum hit starts on its step", () => {
	for (const bpm of TEMPOS) {
		for (const rate of RATES) {
			const frames = cellFrames(bpm, rate);
			const at = Math.round((5 * frames) / DRUM_STEPS);

			// kick on step 5
			const beat = mixDrums([{ note: 1, start: 5 }], bpm, rate, frames);

			assert.equal(beat.length, frames);
			assert.ok(beat.subarray(0, at).every((sample) => sample === 0));
			assert.ok(beat.subarray(at, at + 16).some((sample) => sample !== 0));
		}
	}
});

test("a beat with every drum on every step stays under the ceiling", () => {
	const everything = [];
	for (let start = 0; start < DRUM_STEPS; start++) {
		for (let note = 0; note < drumVoices.length; note++) {
			everything.push({ note: note, start: start });
		}
	}

	for (const bpm of TEMPOS) {
		const beat = mixDrums(everything, bpm, 48000, cellFrames(bpm, 48000));
		const peak = beat.reduce(
			(peak, sample) => Math.max(peak, Math.abs(sample)),
			0
		);

		// samples are 32 bit floats, so 0.87 comes back a hair off
		assert.ok(peak > 0.7);
		assert.ok(peak < 0.87 + 1e-6);
	}
});

test("hits that aren't in the kit or the cell are left out", () => {
	const beat = mixDrums(
		[
			{ note: 99, start: 0 },
			{ note: 1, start: -1 },
			{ note: 1, start: DRUM_STEPS },
		],
		120,
		48000,
		cellFrames(120, 48000)
	);

	assert.ok(beat.every((sample) => sample === 0));
});
