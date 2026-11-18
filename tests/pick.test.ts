import assert from "node:assert/strict";
import { test } from "node:test";
import { NOTHING, pickItem, pickSlot } from "../src/utils/pick.ts";
import type { Clip, Item } from "../src/utils/types.ts";

const loop: Item = { type: "loop", name: "Beat", id: "beat" };
const sound: Item = { type: "sound", name: "Tune", id: "tune", bars: 2 };
const clip: Clip = { type: "loop", name: "Beat", id: "beat", start: 0, bars: 2 };

const bar = { track: "a", bar: 3, clip: null };
const onClip = { track: "a", bar: 0, clip };

test("a bar picked first waits for a sound", () => {
	const next = pickSlot(NOTHING, bar);
	assert.deepEqual(next, { slot: bar, item: null, put: null });
});

test("a sound picked first waits for a bar", () => {
	const next = pickItem(NOTHING, sound);
	assert.deepEqual(next, { slot: null, item: sound, put: null });
});

test("the second pick puts one in the other and clears both", () => {
	const fromBar = pickItem({ slot: bar, item: null }, loop);
	assert.deepEqual(fromBar, {
		slot: null,
		item: null,
		put: { slot: bar, item: loop },
	});

	const fromSound = pickSlot({ slot: null, item: sound }, onClip);
	assert.deepEqual(fromSound, {
		slot: null,
		item: null,
		put: { slot: onClip, item: sound },
	});
});

test("tapping what's waiting again lets go of it", () => {
	assert.deepEqual(pickSlot({ slot: bar, item: null }, { ...bar }), {
		...NOTHING,
		put: null,
	});
	assert.deepEqual(
		pickSlot({ slot: onClip, item: null }, { ...onClip, clip: { ...clip } }),
		{ ...NOTHING, put: null }
	);
	assert.deepEqual(pickItem({ slot: null, item: sound }, { ...sound }), {
		...NOTHING,
		put: null,
	});
});

test("tapping a different bar or sound moves the pick", () => {
	const other = { ...bar, bar: 4 };
	assert.deepEqual(pickSlot({ slot: bar, item: null }, other).slot, other);
	assert.deepEqual(pickItem({ slot: null, item: sound }, loop).item, loop);
});

test("an empty bar and a clip on the same track aren't the same pick", () => {
	const next = pickSlot({ slot: { ...bar, bar: 0 }, item: null }, onClip);
	assert.equal(next.slot, onClip);
});

test("cancel is nothing picked", () => {
	assert.deepEqual(NOTHING, { slot: null, item: null });
});
