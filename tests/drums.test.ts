import assert from "node:assert/strict";
import { test } from "node:test";
import { type DrumVoice, synthDrum } from "../src/utils/drum-synth.ts";

const RATE = 44100;

// How much of a hit's energy is in each band, from 0 to 1. Energy is power:
// the squared size of every frequency in the hit, added up over the band.
const energy = (samples: Float32Array, bands: [number, number][]) => {
	let size = 1;
	while (size < samples.length) size *= 2;

	const re = new Float64Array(size);
	const im = new Float64Array(size);
	re.set(samples);

	// a plain radix 2 FFT, in place
	for (let i = 1, j = 0; i < size; i++) {
		let bit = size >> 1;
		for (; j & bit; bit >>= 1) j ^= bit;
		j ^= bit;
		if (i < j) [re[i], re[j]] = [re[j], re[i]];
	}
	for (let length = 2; length <= size; length *= 2) {
		const angle = (-2 * Math.PI) / length;
		for (let i = 0; i < size; i += length) {
			for (let k = 0; k < length / 2; k++) {
				const cos = Math.cos(angle * k);
				const sin = Math.sin(angle * k);
				const a = i + k;
				const b = a + length / 2;
				const x = re[b] * cos - im[b] * sin;
				const y = re[b] * sin + im[b] * cos;
				re[b] = re[a] - x;
				im[b] = im[a] - y;
				re[a] += x;
				im[a] += y;
			}
		}
	}

	let total = 0;
	const sums = bands.map(() => 0);
	for (let i = 0; i < size / 2; i++) {
		const power = re[i] * re[i] + im[i] * im[i];
		const hz = (i * RATE) / size;

		total += power;
		bands.forEach(([from, to], band) => {
			if (hz >= from && hz < to) sums[band] += power;
		});
	}

	return sums.map((sum) => sum / total);
};

// the loudest 50 ms of a hit, in dB
const loudness = (samples: Float32Array) => {
	const span = Math.round(0.05 * RATE);
	let sum = 0;
	let most = 0;
	for (let i = 0; i < samples.length; i++) {
		sum += samples[i] * samples[i];
		if (i >= span) sum -= samples[i - span] * samples[i - span];
		most = Math.max(most, sum);
	}
	return 10 * Math.log10(most / span);
};

// The floors are between the old synth and this one: the kick went from 0.333
// to 0.466 and the low tom from 0.500 to 0.619.
test("the low drums can be heard on a small speaker", () => {
	const floors: [DrumVoice, number][] = [
		["kick", 0.4],
		["tom-low", 0.55],
	];

	for (const [voice, floor] of floors) {
		const [mids] = energy(synthDrum(voice, RATE), [[150, 3000]]);

		assert.ok(mids >= floor, `${voice} has ${mids} between 150 Hz and 3 kHz`);
	}
});

test("the snare is mostly wires", () => {
	const [highs] = energy(synthDrum("snare", RATE), [[1000, RATE]]);

	assert.ok(highs >= 0.3, `snare has ${highs} above 1 kHz`);
});

test("the hats aren't buried under the kick", () => {
	const kick = loudness(synthDrum("kick", RATE));

	for (const voice of ["hihat-open", "hihat-close"] as DrumVoice[]) {
		const under = kick - loudness(synthDrum(voice, RATE));

		assert.ok(under <= 9, `${voice} is ${under} dB under the kick`);
	}
});
