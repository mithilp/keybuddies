"use client";

import Crunker from "crunker";

const crunker = typeof window !== "undefined" ? new Crunker() : null;

// Browsers keep the audio context suspended until the page has been clicked.
// Call this from the click that is about to make sound.
export const wake = () => {
	const context = crunker!.context;

	if (context.state === "suspended") {
		context.resume().catch(() => {});
	}

	return context;
};

// Whether the context is actually running. A browser that still wants a
// click leaves resume() hanging, so this gives up on it after a second.
export const awake = async () => {
	const context = crunker!.context;

	if (context.state !== "running") {
		await Promise.race([
			context.resume().catch(() => {}),
			new Promise((resolve) => setTimeout(resolve, 1000)),
		]);
	}

	return context.state === "running";
};

export default crunker;
