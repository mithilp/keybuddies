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

export default crunker;
