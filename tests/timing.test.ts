import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import {
	DRUM_STEPS,
	OLD_DRUM_STEPS,
	drumBeat,
	drumVoices,
	mixDrums,
	synthDrum,
} from "../src/utils/drum-synth.ts";
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
	assert.equal(DRUM_STEPS, CELL_BEATS * 4);

	for (const bpm of TEMPOS) {
		for (const rate of RATES) {
			// an eighth of a beat and a quarter of a beat, in samples
			const pianoStep = (7.5 * rate) / bpm;
			const drumStep = (15 * rate) / bpm;

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

// a beat saved on the old half beat grid: something on most steps, with
// hits landing together so the soft clip is in there too
const oldBeat = () => {
	const beat = [];
	for (let start = 0; start < OLD_DRUM_STEPS; start++) {
		for (let note = 0; note < drumVoices.length; note++) {
			if ((start * 7 + note * 3) % 4 !== 0) {
				beat.push({ note: note, start: start, end: start + 1 });
			}
		}
	}
	return beat;
};

test("a beat saved before sixteenths sounds exactly the same", () => {
	// sha256 of the samples main made for oldBeat before the grid changed
	const before: Record<string, string> = {
		"80@44100":
			"0771c3a833de15f3acffd92f860bb9c69823fc179d2aeba21be50121e0fe6b2a",
		"80@48000":
			"bc754b0928ec57d0827367111312872c966e0820b7aec47ff79ffb5e938f1a6d",
		"120@44100":
			"70988a58246e1326a99c7a089342b76a4812fe74a3fb5daba8b245ffb290dad2",
		"120@48000":
			"50850fab0c68b82829a1c2e46183d1af54a2673305e521b60678ef8b3818a290",
		"160@44100":
			"ea48c36498f6b8e3b5390f3169974050d48d814d4d2d6974b5480c93dc4aed1d",
		"160@48000":
			"49e7db7e8643ce7098653da4ebfb0ae1837f756d57b854f973979640cffda25c",
	};

	for (const [at, hash] of Object.entries(before)) {
		const [bpm, rate] = at.split("@").map(Number);

		// an old doc has no steps field
		const beat = drumBeat(oldBeat(), undefined);
		const out = mixDrums(beat, bpm, rate, cellFrames(bpm, rate));

		assert.equal(
			createHash("sha256").update(new Uint8Array(out.buffer)).digest("hex"),
			hash,
			at
		);
	}
});

test("an old hit lands on the same sample it always did", () => {
	for (const bpm of [...TEMPOS, 77, 133]) {
		for (const rate of RATES) {
			const kick = synthDrum("kick", rate);

			for (let start = 0; start < OLD_DRUM_STEPS; start++) {
				const beat = drumBeat([{ note: 1, start: start, end: start + 1 }], 0);
				const out = mixDrums(beat, bpm, rate);
				const at = Math.round(start * (30 / bpm) * rate);

				// a kick on its own never reaches the soft clip
				assert.equal(out.length, at + kick.length);
				assert.ok(out.subarray(0, at).every((sample) => sample === 0));
				assert.deepEqual(out.subarray(at), kick);
			}
		}
	}
});

test("a beat saved on sixteenths is read as it is", () => {
	const beat = [
		{ note: 3, start: 1, end: 2 },
		{ note: 3, start: 31, end: 32 },
	];

	assert.equal(drumBeat(beat, DRUM_STEPS), beat);
	assert.equal(drumBeat(oldBeat(), undefined).length, oldBeat().length);
	assert.ok(drumBeat(oldBeat(), undefined).every((key) => key.start % 2 === 0));
});
