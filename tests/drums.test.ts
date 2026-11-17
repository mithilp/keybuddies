import assert from "node:assert/strict";
import { test } from "node:test";
import {
	type DrumVoice,
	mixDrums,
	synthDrum,
} from "../src/utils/drum-synth.ts";

const RATE = 44100;

// The frequencies in a hit: a plain radix 2 FFT, padded out to a power of 2.
// Bin i is i * RATE / size Hz.
const spectrum = (samples: Float32Array) => {
	let size = 1;
	while (size < samples.length) size *= 2;

	const re = new Float64Array(size);
	const im = new Float64Array(size);
	re.set(samples);

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

	return { re, im, size };
};

// How much of a hit's energy is in each band, from 0 to 1. Energy is power:
// the squared size of every frequency in the hit, added up over the band.
const energy = (samples: Float32Array, bands: [number, number][]) => {
	const { re, im, size } = spectrum(samples);

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

// How much louder or quieter an ear hears a frequency than it is, the usual
// A weighting curve. 1 at 1 kHz, a lot less down where the kick is.
const aWeight = (hz: number) => {
	const f2 = hz * hz;
	return (
		(12194 ** 2 * f2 * f2 * 10 ** (2 / 20)) /
		((f2 + 20.6 ** 2) *
			Math.sqrt((f2 + 107.7 ** 2) * (f2 + 737.9 ** 2)) *
			(f2 + 12194 ** 2))
	);
};

// How loud the first 100 ms of a hit sounds, in dB. Plain loudness says a
// kick is as loud as anything, an ear doesn't hear its 50 Hz that well.
const heard = (samples: Float32Array) => {
	const span = Math.round(0.1 * RATE);
	const { re, im, size } = spectrum(samples.subarray(0, span));

	let sum = 0;
	for (let i = 1; i < size / 2; i++) {
		const weight = aWeight((i * RATE) / size);
		sum += 2 * (re[i] * re[i] + im[i] * im[i]) * weight * weight;
	}
	return 10 * Math.log10(sum / size / span);
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

// #21: the snare was impossible to hear. Right now it's 3.4 dB over the kick
// to the ear and 4.3 over the open hat.
test("the snare is as loud to the ear as the kick and the hats", () => {
	const snare = heard(synthDrum("snare", RATE));

	for (const voice of ["kick", "hihat-open", "hihat-close"] as DrumVoice[]) {
		const other = heard(synthDrum(voice, RATE));

		assert.ok(
			snare >= other + 1,
			`snare is ${(snare - other).toFixed(1)} dB over the ${voice}`
		);
	}
});

// hits on the same step get rounded off together, which mustn't be what
// buries the snare. it loses 0.3 dB with the kick and 1.3 under everything.
test("the snare still comes through when other drums land with it", () => {
	const span = Math.round(0.1 * RATE);
	const level = (samples: Float32Array) => {
		let sum = 0;
		for (let i = 0; i < span; i++) sum += samples[i] * samples[i];
		return 10 * Math.log10(sum / span);
	};

	// what the snare adds to a step, with the same drums there without it
	const added = (others: number[]) => {
		const hits = (notes: number[]) =>
			notes.map((note) => ({ note: note, start: 0 }));
		const both = mixDrums(hits([...others, 4]), 120, RATE);
		const without = mixDrums(hits(others), 120, RATE);

		return level(both.map((sample, i) => sample - (without[i] ?? 0)));
	};

	const alone = level(synthDrum("snare", RATE));

	assert.ok(alone - added([1]) <= 1, "under the kick");
	assert.ok(alone - added([0, 1, 2, 3, 5]) <= 2, "under everything");
});
