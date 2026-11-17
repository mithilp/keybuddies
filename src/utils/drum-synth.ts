import type { Key } from "./types";

// The drum kit is synthesized instead of loaded from sample files.
// Everything here is plain math on Float32Arrays, so it sounds the same in
// every browser and can be run outside one. Recipes are the usual 808 ones:
// sine sweeps for kick and tom, tone plus noise for the snare, filtered
// metallic squares and noise for the hats, noise bursts for the clap.
//
// A phone or laptop speaker plays next to nothing under 150 Hz, so the low
// drums also carry overtones and a click it can play, and the hats are wide
// and loud enough to be heard next to the kick.

export type DrumVoice =
	| "clap"
	| "kick"
	| "hihat-open"
	| "hihat-close"
	| "snare"
	| "tom-low";

// A drum Key stores the position in this list as `note`. Saved beats point
// at these by number, so don't reorder them.
export const drumVoices: DrumVoice[] = [
	"clap",
	"kick",
	"hihat-open",
	"hihat-close",
	"snare",
	"tom-low",
];

// Beats are on sixteenth note steps, 4 to a beat and 16 to a bar, so a hat
// or a snare can roll.
export const DRUM_BAR_STEPS = 16;

// the steps in a 2 bar beat, which is what every beat was before sounds had
// a length
export const DRUM_STEPS = 32;

// Beats saved before the grid went to sixteenths were on half beats, 16 to
// 2 bars, and don't say how many steps they have.
export const OLD_DRUM_STEPS = 16;

// how many sixteenths a beat `bars` long has. a sound with no length is 2
// bars.
export const drumSteps = (bars: unknown) =>
	(bars === 1 || bars === 4 ? bars : 2) * DRUM_BAR_STEPS;

// A saved drum beat with its hits on sixteenths. `steps` and `bars` are the
// sound's fields: a beat with both is already on sixteenths (steps is
// always bars * 16), and a beat from before sounds had a length is 2 bars on
// whatever grid `steps` says, half beats when it says nothing. This is the
// one place an old beat is read differently, it's never rewritten.
export const drumBeat = (
	sequence: Key[],
	steps: number | undefined,
	bars?: number
) => {
	const saved = typeof steps === "number" && steps > 0 ? steps : OLD_DRUM_STEPS;
	const scale = drumSteps(bars) / saved;
	if (scale === 1) return sequence;

	return sequence.map((key) => ({
		note: key.note,
		start: key.start * scale,
		end: key.start * scale + 1,
	}));
};

const TAU = Math.PI * 2;

// seeded so a voice sounds identical every time it's built
const noise = (length: number, seed: number) => {
	const out = new Float32Array(length);
	let state = seed >>> 0;
	for (let i = 0; i < length; i++) {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		out[i] = (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1;
	}
	return out;
};

// second order filter, same math as a BiquadFilterNode
const filter = (
	input: Float32Array,
	type: "highpass" | "bandpass" | "lowpass",
	frequency: number,
	q: number,
	sampleRate: number
) => {
	const w = (TAU * Math.min(frequency, sampleRate * 0.45)) / sampleRate;
	const cos = Math.cos(w);
	const alpha = Math.sin(w) / (2 * q);

	let b0: number, b1: number, b2: number;
	if (type === "highpass") {
		b0 = (1 + cos) / 2;
		b1 = -(1 + cos);
		b2 = (1 + cos) / 2;
	} else if (type === "lowpass") {
		b0 = (1 - cos) / 2;
		b1 = 1 - cos;
		b2 = (1 - cos) / 2;
	} else {
		b0 = alpha;
		b1 = 0;
		b2 = -alpha;
	}
	const a0 = 1 + alpha;
	const a1 = -2 * cos;
	const a2 = 1 - alpha;

	const out = new Float32Array(input.length);
	let x1 = 0,
		x2 = 0,
		y1 = 0,
		y2 = 0;
	for (let i = 0; i < input.length; i++) {
		const x = input[i];
		const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
		x2 = x1;
		x1 = x;
		y2 = y1;
		y1 = y;
		out[i] = y;
	}
	return out;
};

// A tone that glides from one pitch down to another, built from partials.
// Each partial is [how many times the pitch, how loud, seconds to die away].
const tone = (
	length: number,
	sampleRate: number,
	from: number,
	to: number,
	glide: number,
	partials: [number, number, number][]
) => {
	const out = new Float32Array(length);
	let phase = 0;
	for (let i = 0; i < length; i++) {
		const t = i / sampleRate;
		let sum = 0;
		for (const [ratio, level, decay] of partials) {
			sum += level * Math.sin(ratio * phase) * Math.exp(-t / decay);
		}
		out[i] = sum;
		phase += (TAU * (to + (from - to) * Math.exp(-t / glide))) / sampleRate;
	}
	return out;
};

// The 48 Hz body is about half of it. The rest is overtones, and close to a
// third of the hit is above 300 Hz, where a phone speaker starts to play.
// The higher an overtone is the faster it dies away, and the beater click is
// over in a few ms, so the tail stays a clean thump.
const kick = (sampleRate: number) => {
	const length = Math.round(0.5 * sampleRate);
	const body = tone(length, sampleRate, 165, 48, 0.035, [[1, 1, 0.13]]);
	const overtones = tone(length, sampleRate, 165, 48, 0.035, [
		[2, 0.5, 0.13],
		[3, 0.5, 0.12],
		[4, 0.95, 0.12],
		[5, 0.8, 0.11],
		[6, 0.65, 0.1],
		[8, 0.55, 0.08],
		[10, 0.4, 0.06],
		[13, 0.3, 0.045],
	]);
	const click = filter(noise(length, 1), "bandpass", 1800, 0.7, sampleRate);
	const out = new Float32Array(length);
	for (let i = 0; i < length; i++) {
		const t = i / sampleRate;
		out[i] =
			Math.tanh(1.6 * body[i]) +
			overtones[i] +
			1.6 * click[i] * Math.exp(-t / 0.006);
	}
	return out;
};

// overtones from a fifth to more than two octaves above the 88 Hz head, and
// the slap of the stick
const tom = (sampleRate: number) => {
	const length = Math.round(0.55 * sampleRate);
	const head = tone(length, sampleRate, 190, 88, 0.07, [
		[1, 1, 0.15],
		[1.5, 0.45, 0.13],
		[2, 0.8, 0.14],
		[3, 0.6, 0.13],
		[4, 0.45, 0.11],
		[5.4, 0.3, 0.08],
	]);
	const slap = filter(noise(length, 2), "bandpass", 1200, 0.8, sampleRate);
	const out = new Float32Array(length);
	for (let i = 0; i < length; i++) {
		const t = i / sampleRate;
		out[i] = head[i] + 1.1 * slap[i] * Math.exp(-t / 0.014);
	}
	return out;
};

// two detuned tones for the drum head, loud bright noise for the wires.
// most of the snare is the wires, from 1 kHz up.
const snare = (sampleRate: number) => {
	const length = Math.round(0.32 * sampleRate);
	const head = tone(length, sampleRate, 240, 185, 0.02, [
		[1, 0.5, 0.055],
		[1.77, 0.3, 0.055],
	]);
	const wires = filter(
		filter(noise(length, 3), "highpass", 1200, 0.7, sampleRate),
		"lowpass",
		10000,
		0.7,
		sampleRate
	);
	const out = new Float32Array(length);
	for (let i = 0; i < length; i++) {
		const t = i / sampleRate;
		out[i] = head[i] + 1.5 * wires[i] * Math.exp(-t / 0.08);
	}
	return out;
};

// six square waves at the 808 cymbal ratios plus noise, kept between about
// 5 and 14 kHz
const hihat = (sampleRate: number, seconds: number, decay: number) => {
	const length = Math.round(seconds * sampleRate);
	const partials = [205.3, 304.4, 369.6, 522.7, 540, 800];
	const hiss = noise(length, 4);
	const metal = new Float32Array(length);
	for (let i = 0; i < length; i++) {
		const t = i / sampleRate;
		let sum = 0;
		for (const partial of partials) {
			sum += Math.sin(TAU * partial * 4 * t) >= 0 ? 1 : -1;
		}
		metal[i] = sum / partials.length + 0.6 * hiss[i];
	}
	const bright = filter(
		filter(
			filter(metal, "bandpass", 8400, 0.7, sampleRate),
			"highpass",
			5500,
			0.7,
			sampleRate
		),
		"lowpass",
		13000,
		0.7,
		sampleRate
	);
	for (let i = 0; i < length; i++) {
		bright[i] *= Math.exp(-i / sampleRate / decay);
	}
	return bright;
};

// three quick bursts and a longer one, like several hands landing
const clap = (sampleRate: number) => {
	const length = Math.round(0.35 * sampleRate);
	const body = filter(
		filter(noise(length, 5), "bandpass", 1200, 1.2, sampleRate),
		"highpass",
		600,
		0.7,
		sampleRate
	);
	const bursts = [0, 0.011, 0.022];
	const tail = 0.033;
	const out = new Float32Array(length);
	for (let i = 0; i < length; i++) {
		const t = i / sampleRate;
		let envelope = 0;
		for (const burst of bursts) {
			if (t >= burst && t < burst + 0.011) {
				envelope = Math.exp(-(t - burst) / 0.004);
			}
		}
		if (t >= tail) {
			envelope = Math.exp(-(t - tail) / 0.055);
		}
		out[i] = body[i] * envelope;
	}
	return out;
};

// how loud each voice peaks in the mix
const levels: Record<DrumVoice, number> = {
	kick: 0.7,
	snare: 0.65,
	"tom-low": 0.6,
	clap: 0.55,
	"hihat-open": 0.34,
	"hihat-close": 0.4,
};

// noise is all spikes, so the noisy voices get squashed a little. that makes
// them sound louder at the same peak, which the snare and hats need the most.
const squash: Record<DrumVoice, number> = {
	kick: 2.5,
	snare: 2.5,
	"tom-low": 2.5,
	clap: 2,
	"hihat-open": 2.5,
	"hihat-close": 3,
};

const peakOf = (samples: Float32Array) => {
	let peak = 0;
	for (let i = 0; i < samples.length; i++) {
		peak = Math.max(peak, Math.abs(samples[i]));
	}
	return peak;
};

// one hit of one voice, mono, between -1 and 1
export const synthDrum = (voice: DrumVoice, sampleRate: number) => {
	let samples: Float32Array;
	if (voice === "kick") samples = kick(sampleRate);
	else if (voice === "tom-low") samples = tom(sampleRate);
	else if (voice === "snare") samples = snare(sampleRate);
	else if (voice === "clap") samples = clap(sampleRate);
	else if (voice === "hihat-open") samples = hihat(sampleRate, 0.45, 0.11);
	else samples = hihat(sampleRate, 0.12, 0.028);

	const drive = squash[voice];
	if (drive > 0) {
		const peak = peakOf(samples) || 1;
		for (let i = 0; i < samples.length; i++) {
			samples[i] = Math.tanh((drive * samples[i]) / peak);
		}
	}

	// set the level and fade the last few ms so the end never clicks
	const gain = levels[voice] / (peakOf(samples) || 1);
	const fade = Math.round(0.01 * sampleRate);
	for (let i = 0; i < samples.length; i++) {
		const left = samples.length - 1 - i;
		samples[i] *= gain * (left < fade ? left / fade : 1);
	}

	return samples;
};

// the loudest a mixed beat can get
const CEILING = 0.87;

const built = new Map<string, Float32Array>();

const voiceSamples = (voice: DrumVoice, sampleRate: number) => {
	const key = `${voice}@${sampleRate}`;
	let samples = built.get(key);
	if (!samples) {
		samples = synthDrum(voice, sampleRate);
		built.set(key, samples);
	}
	return samples;
};

// Mixes a beat down to mono samples. Each hit starts at `start` sixteenths,
// a beat that was saved on another grid goes through drumBeat first.
// Pass `frames` to get exactly that many samples (hits that ring past the end
// are faded out), otherwise the result is as long as the beat needs. Hits
// past `steps`, the length of the beat, are left out.
export const mixDrums = (
	sequence: { note: number; start: number }[],
	bpm: number,
	sampleRate: number,
	frames?: number,
	steps = DRUM_STEPS
) => {
	// a quarter of a beat, in samples. twice this is exactly the old half beat
	// step, so an old beat's hits land on the same samples as they always did.
	const step = (15 / bpm) * sampleRate;

	const hits = sequence
		.filter(
			(key) =>
				drumVoices[key.note] !== undefined &&
				key.start >= 0 &&
				key.start < steps
		)
		.map((key) => ({
			at: Math.round(key.start * step),
			samples: voiceSamples(drumVoices[key.note], sampleRate),
		}));

	const length =
		frames ?? Math.max(1, ...hits.map((hit) => hit.at + hit.samples.length));
	const out = new Float32Array(length);

	for (const hit of hits) {
		const end = Math.min(hit.samples.length, length - hit.at);
		for (let i = 0; i < end; i++) {
			out[hit.at + i] += hit.samples[i];
		}
	}

	// hits on the same step add up, so anything over the loudest single voice
	// is rounded off. however many land together it stays under the ceiling,
	// which is a little more than 1 dB short of full scale.
	const knee = 0.7;
	const room = CEILING - knee;
	for (let i = 0; i < length; i++) {
		const size = Math.abs(out[i]);
		if (size > knee) {
			out[i] =
				Math.sign(out[i]) * (knee + room * Math.tanh((size - knee) / room));
		}
	}

	if (frames !== undefined) {
		const fade = Math.min(length, Math.round(0.005 * sampleRate));
		for (let i = 0; i < fade; i++) {
			out[length - 1 - i] *= i / fade;
		}
	}

	return out;
};
