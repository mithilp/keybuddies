"use client";

import { useSyncExternalStore } from "react";
import crunker, { wake } from "./crunker";
import { loadLoop } from "./samples";

// Listening to a loop or a recorded sound on its own, outside the song.
// There is one slot for it. Starting a preview stops the one before, so two
// never play over each other.
let current: { id: string; source: AudioBufferSourceNode | null } | null =
	null;

const watchers = new Set<() => void>();
const changed = () => watchers.forEach((watcher) => watcher());

// Stops the preview. With an id it only stops that one, and leaves the slot
// alone if something else has taken it since.
export const stopPreview = (id?: string) => {
	if (!current || (id !== undefined && current.id !== id)) return;

	const { source } = current;
	current = null;

	if (source) {
		source.onended = null;
		source.stop();
	}

	changed();
};

// Plays whatever `load` comes back with. Nothing is loaded until this is
// called, and the buffer can come from the sample cache.
export const preview = async (
	id: string,
	load: () => AudioBuffer | Promise<AudioBuffer>
) => {
	if (!crunker) return;

	// woken here, while this is still the click
	const context = wake();

	stopPreview();

	const mine: NonNullable<typeof current> = { id: id, source: null };
	current = mine;
	changed();

	try {
		const buffer = await load();

		// stopped, or another preview was picked, while this one loaded
		if (current !== mine) return;

		const source = context.createBufferSource();
		source.buffer = buffer;
		source.connect(context.destination);
		source.onended = () => {
			if (current === mine) {
				current = null;
				changed();
			}
		};
		source.start();

		mine.source = source;
		changed();
	} catch (error) {
		console.error(error);

		if (current === mine) {
			current = null;
			changed();
		}
	}
};

const loopPreview = (id: string) => `loop ${id}`;

// the loop at the tempo the studio is on right now
export const previewLoop = (id: string, bpm: number | string) =>
	preview(loopPreview(id), () => loadLoop(id, bpm));

export const stopLoopPreview = (id: string) => stopPreview(loopPreview(id));

export type Previewing = "idle" | "loading" | "playing";

const subscribe = (watcher: () => void) => {
	watchers.add(watcher);
	return () => {
		watchers.delete(watcher);
	};
};

const stateOf = (id: string): Previewing =>
	current?.id !== id ? "idle" : current.source ? "playing" : "loading";

// what a preview button should show
export const useLoopPreview = (id: string) =>
	useSyncExternalStore(
		subscribe,
		() => stateOf(loopPreview(id)),
		() => "idle" as Previewing
	);
