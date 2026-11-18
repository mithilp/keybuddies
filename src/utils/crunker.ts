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
	const session = (
		navigator as Navigator & { audioSession?: { type: string } }
	).audioSession;

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

export default crunker;
