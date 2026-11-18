import type { Item, Slot } from "./types";
// with the extension, so the tests can load this without a bundler
import { sameClip } from "./clips.ts";

export type PickedSlot = NonNullable<Slot>;

// what's waiting to be put somewhere: a clip or an empty bar, or a loop or a
// sound. Never both, the second pick puts one in the other.
export type Picked = { slot: Slot; item: Item | null };

// what a pick did. `put` is set when it put something in, and then nothing
// is picked any more.
export type Pick = Picked & { put: { slot: PickedSlot; item: Item } | null };

export const NOTHING: Picked = { slot: null, item: null };

export const sameItem = (a: Item, b: Item) =>
	a.type === b.type && a.id === b.id;

export const sameSlot = (a: PickedSlot, b: PickedSlot) =>
	a.track === b.track &&
	(a.clip && b.clip
		? sameClip(a.clip, b.clip)
		: !a.clip && !b.clip && a.bar === b.bar);

// a tap on a clip or an empty bar
export const pickSlot = (now: Picked, target: PickedSlot): Pick => {
	if (now.item) return { ...NOTHING, put: { slot: target, item: now.item } };

	// a second tap on what's waiting lets go of it
	if (now.slot && sameSlot(now.slot, target)) return { ...NOTHING, put: null };

	return { slot: target, item: null, put: null };
};

// a tap on a loop or a sound in the sidebar
export const pickItem = (now: Picked, next: Item): Pick => {
	if (now.slot) return { ...NOTHING, put: { slot: now.slot, item: next } };

	if (now.item && sameItem(now.item, next)) return { ...NOTHING, put: null };

	return { slot: null, item: next, put: null };
};
