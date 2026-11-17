// The drum kit is synthesized instead of loaded from sample files.
// Everything here is plain math on Float32Arrays, so it sounds the same in
// every browser and can be run outside one. Recipes are the usual 808 ones:
// sine sweeps for kick and tom, tone plus noise for the snare, filtered
// metallic squares and noise for the hats, noise bursts for the clap.

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

// a beat is one cell: 8 beats cut into half-beat steps
export const DRUM_STEPS = 16;

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

// sine that glides from one pitch down to another
const sweep = (
	length: number,
	sampleRate: number,
	from: number,
	to: number,
	glide: number
) => {
	const out = new Float32Array(length);
	let phase = 0;
	for (let i = 0; i < length; i++) {
		const t = i / sampleRate;
		out[i] = Math.sin(phase);
		phase += (TAU * (to + (from - to) * Math.exp(-t / glide))) / sampleRate;
	}
	return out;
};

const kick = (sampleRate: number) => {
	const length = Math.round(0.5 * sampleRate);
	const body = sweep(length, sampleRate, 165, 48, 0.035);
	const click = filter(noise(length, 1), "lowpass", 3000, 0.7, sampleRate);
	const out = new Float32Array(length);
	for (let i = 0; i < length; i++) {
		const t = i / sampleRate;
		out[i] =
			Math.tanh(1.6 * body[i] * Math.exp(-t / 0.13)) +
			0.25 * click[i] * Math.exp(-t / 0.003);
	}
	return out;
};

const tom = (sampleRate: number) => {
	const length = Math.round(0.55 * sampleRate);
	const body = sweep(length, sampleRate, 190, 88, 0.07);
	const skin = filter(noise(length, 2), "bandpass", 900, 1, sampleRate);
	const out = new Float32Array(length);
	for (let i = 0; i < length; i++) {
		const t = i / sampleRate;
		out[i] =
			body[i] * Math.exp(-t / 0.15) + 0.3 * skin[i] * Math.exp(-t / 0.02);
	}
	return out;
};

// two detuned tones for the drum head, loud bright noise for the wires.
// the noise sits between 1 and 8 kHz so it cuts through on small speakers.
const snare = (sampleRate: number) => {
	const length = Math.round(0.32 * sampleRate);
	const low = sweep(length, sampleRate, 240, 185, 0.02);
	const high = sweep(length, sampleRate, 420, 330, 0.02);
	const wires = filter(
		filter(noise(length, 3), "highpass", 1000, 0.7, sampleRate),
		"lowpass",
		8000,
		0.7,
		sampleRate
	);
	const out = new Float32Array(length);
	for (let i = 0; i < length; i++) {
		const t = i / sampleRate;
		out[i] =
			(0.6 * low[i] + 0.35 * high[i]) * Math.exp(-t / 0.055) +
			1.1 * wires[i] * Math.exp(-t / 0.075);
	}
	return out;
};

// six square waves at the 808 cymbal ratios plus noise, high passed
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
		filter(metal, "bandpass", 10000, 0.8, sampleRate),
		"highpass",
		7000,
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
	"hihat-open": 0.3,
	"hihat-close": 0.3,
};

// noise is all spikes, so the noisy voices get squashed a little. that makes
// them sound louder at the same peak, which the snare needs the most.
const squash: Record<DrumVoice, number> = {
	kick: 0,
	snare: 2.5,
	"tom-low": 0,
	clap: 2,
	"hihat-open": 1.5,
	"hihat-close": 1.5,
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
	else samples = hihat(sampleRate, 0.09, 0.02);

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

// Mixes a beat down to mono samples. Each hit starts at `start` half-beats.
// Pass `frames` to get exactly that many samples (hits that ring past the end
// are faded out), otherwise the result is as long as the beat needs.
export const mixDrums = (
	sequence: { note: number; start: number }[],
	bpm: number,
	sampleRate: number,
	frames?: number
) => {
	const step = (30 / bpm) * sampleRate;

	const hits = sequence
		.filter(
			(key) =>
				drumVoices[key.note] !== undefined &&
				key.start >= 0 &&
				key.start < DRUM_STEPS
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

	// hits on the same step add up, so round off anything that would clip
	const knee = 0.7;
	for (let i = 0; i < length; i++) {
		const size = Math.abs(out[i]);
		if (size > knee) {
			const over = (size - knee) / (1 - knee);
			out[i] = Math.sign(out[i]) * (knee + (1 - knee) * Math.tanh(over));
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
