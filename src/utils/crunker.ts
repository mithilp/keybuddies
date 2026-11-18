"use client";

import Crunker from "crunker";

const crunker = typeof window !== "undefined" ? new Crunker() : null;

// Whether the context needs a resume before it makes sound. Safari has a
// state the types don't know about, "interrupted", for when a call or
// another app took the audio away.
const asleep = (context: AudioContext) =>
	(context.state as string) !== "running" && context.state !== "closed";

// Browsers keep the audio context suspended until the page has been clicked.
// Call this from the click that is about to make sound.
export const wake = () => {
	const context = crunker!.context;

	if (asleep(context)) {
		context.resume().catch(() => {});
	}

	return context;
};

// Whether the context is actually running. A browser that still wants a
// click leaves resume() hanging, so this gives up on it after a second.
export const awake = async () => {
	const context = crunker!.context;

	if (asleep(context)) {
		await Promise.race([
			context.resume().catch(() => {}),
			new Promise((resolve) => setTimeout(resolve, 1000)),
		]);
	}

	return context.state === "running";
};

// iOS only lets audio start inside a tap, and the first tap on the page
// might not be one that plays anything. So every tap, key or click wakes the
// context if it's asleep, and plays a moment of silence while it's there,
// which is what an older iPhone needs before it lets anything else through.
// Waking up a phone or coming back to the tab tries again, since iOS puts
// the context to sleep in the background.
//
// The audio session is set to playback, so a phone on silent still plays
// the song, the same as a music app. Only Safari 17 and later have it.
const unlock = (context: AudioContext) => {
	const session = (navigator as Navigator & { audioSession?: { type: string } })
		.audioSession;

	if (session) {
		try {
			session.type = "playback";
		} catch {
			// an older Safari that has it but won't take the type
		}
	}

	const onGesture = () => {
		if (!asleep(context)) return;

		context.resume().catch(() => {});

		const source = context.createBufferSource();
		source.buffer = context.createBuffer(1, 1, context.sampleRate);
		source.connect(context.destination);
		source.start();
	};

	for (const type of ["pointerdown", "touchend", "keydown", "click"]) {
		window.addEventListener(type, onGesture, { capture: true, passive: true });
	}

	document.addEventListener("visibilitychange", () => {
		if (document.visibilityState === "visible" && asleep(context)) {
			context.resume().catch(() => {});
		}
	});
};

if (crunker) unlock(crunker.context);

// Everything that plays goes out through one limiter. Notes that ring over
// each other, a chord or a fast run, and tracks on top of each other add up
// past what the speakers can take, and the browser clips them. The limiter
// turns down only the loud parts. The download does the same with a gain,
// see wav.ts.
let limiter: DynamicsCompressorNode | null = null;

export const output = () => {
	const context = crunker!.context;

	if (!limiter) {
		limiter = context.createDynamicsCompressor();
		limiter.threshold.value = -3;
		limiter.knee.value = 0;
		limiter.ratio.value = 20;
		limiter.attack.value = 0.003;
		limiter.release.value = 0.25;

		// The limiter takes a few milliseconds to react, and a hit can slip
		// past it in that time. This rounds off anything over 0.8 so it never
		// reaches 1. The shaper only takes -1 to 1, so it gets half and the
		// curve gives the doubled value back.
		const half = context.createGain();
		half.gain.value = 0.5;

		const curve = new Float32Array(2049);
		for (let i = 0; i < curve.length; i++) {
			const x = (i / (curve.length - 1)) * 4 - 2;
			const size = Math.abs(x);
			const soft =
				size <= 0.8 ? size : 0.8 + 0.2 * Math.tanh((size - 0.8) / 0.2);
			curve[i] = Math.sign(x) * soft;
		}

		const ceiling = context.createWaveShaper();
		ceiling.curve = curve;

		limiter.connect(half);
		half.connect(ceiling);
		ceiling.connect(context.destination);
	}

	return limiter;
};

export default crunker;
