"use client";

import crunker from "./crunker";
import { loopUrl } from "./loops";
import MIDI, { HIGHEST_NOTE, LOWEST_NOTE } from "./MIDI";

// Every audio file the app plays is fetched and decoded once per session and
// kept here by url. Loop previews, the piano keys and song rendering all ask
// this cache, so a file that one of them loaded is ready for the others.
//
// What's kept is the promise, not the buffer. Two callers that ask for the
// same file while it's still loading share one fetch.
//
// The drum kit isn't in here because it has no files. Its voices are
// synthesized once and kept the same way in drum-synth.ts.
const decoded = new Map<string, Promise<AudioBuffer>>();

export const loadSample = (url: string) => {
	const cached = decoded.get(url);
	if (cached) return cached;

	const loading = (async () => {
		if (!crunker) throw new Error("This browser can't play audio.");

		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`${url} came back ${response.status}`);
		}

		return crunker.context.decodeAudioData(await response.arrayBuffer());
	})();

	decoded.set(url, loading);

	// a failed load is forgotten, so the next caller gets a fresh try instead
	// of the old error
	loading.catch(() => {
		if (decoded.get(url) === loading) decoded.delete(url);
	});

	return loading;
};

export const loadLoop = (id: string, bpm: number | string) =>
	loadSample(loopUrl(id, bpm));

const pianoFiles = new Map(MIDI.map((midi) => [midi.value, midi.text]));

// `note` is a MIDI number. The samples cover a real piano, A0 to C8. Old
// recordings can have notes past either end, from when the pickers went
// further.
export const hasPianoNote = (note: number) =>
	note >= LOWEST_NOTE && note <= HIGHEST_NOTE;

export const loadPianoNote = (note: number) => {
	if (!hasPianoNote(note)) {
		return Promise.reject<AudioBuffer>(new Error(`No piano note ${note}`));
	}

	return loadSample(`/sounds/piano/${pianoFiles.get(note)}.ogg`);
};
