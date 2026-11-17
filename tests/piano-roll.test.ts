import assert from "node:assert/strict";
import { test } from "node:test";
import {
	change,
	noteAt,
	removePicked,
	resize,
	shift,
	tap,
} from "../src/utils/piano-roll.ts";
import type { Key } from "../src/utils/types.ts";

const C = 60;
const D = 62;

test("a tap on an empty step adds a note one step long", () => {
	const next = tap({ sequence: [], picked: null }, C, 4);

	assert.deepEqual(next.sequence, [{ note: C, start: 4, end: 5 }]);
	assert.equal(next.added, next.sequence[0]);
	assert.equal(next.picked, null);
});

test("a tap on a note picks it and doesn't delete it", () => {
	const note: Key = { note: C, start: 2, end: 6 };
	const next = tap({ sequence: [note], picked: null }, C, 4);

	assert.deepEqual(next.sequence, [note]);
	assert.equal(next.picked, note);
	assert.equal(next.added, null);
});

test("a second tap on the picked note lets go of it", () => {
	const note: Key = { note: C, start: 2, end: 6 };
	const next = tap({ sequence: [note], picked: note }, C, 2);

	assert.equal(next.picked, null);
	assert.deepEqual(next.sequence, [note]);
});

test("a tap on another note picks that one instead", () => {
	const a: Key = { note: C, start: 0, end: 2 };
	const b: Key = { note: D, start: 4, end: 5 };
	const next = tap({ sequence: [a, b], picked: a }, D, 4);

	assert.equal(next.picked, b);
});

test("a tap on an empty step while a note is picked only lets go", () => {
	const note: Key = { note: C, start: 2, end: 3 };
	const next = tap({ sequence: [note], picked: note }, D, 8);

	assert.deepEqual(next.sequence, [note]);
	assert.equal(next.picked, null);
	assert.equal(next.added, null);
});

test("alt click deletes the note under it", () => {
	const a: Key = { note: C, start: 0, end: 2 };
	const b: Key = { note: C, start: 4, end: 5 };

	const next = tap({ sequence: [a, b], picked: b }, C, 1, true);
	assert.deepEqual(next.sequence, [b]);
	assert.equal(next.picked, b);

	assert.equal(tap({ sequence: [a, b], picked: b }, C, 4, true).picked, null);
});

test("a picked note that was replaced isn't picked any more", () => {
	const note: Key = { note: C, start: 2, end: 3 };
	const copy = { ...note };

	// a tap on an empty step adds, since nothing in the sequence is picked
	const next = tap({ sequence: [copy], picked: note }, D, 8);
	assert.equal(next.sequence.length, 2);
});

test("where two notes meet, the one that starts there is on top", () => {
	const long: Key = { note: C, start: 0, end: 8 };
	const short: Key = { note: C, start: 4, end: 5 };

	assert.equal(noteAt([long, short], C, 4), short);
	assert.equal(noteAt([long, short], C, 3), long);
	assert.equal(noteAt([long, short], D, 3), null);
});

test("a note saved without a length still takes up its first step", () => {
	const bare: Key = { note: C, start: 3, end: 3 };
	assert.equal(noteAt([bare], C, 3), bare);
	assert.equal(noteAt([bare], C, 4), null);
});

test("moving keeps the length and stops at the edges", () => {
	const note: Key = { note: C, start: 2, end: 5 };

	assert.deepEqual(shift(note, 3, 32), { note: C, start: 5, end: 8 });
	assert.deepEqual(shift(note, -10, 32), { note: C, start: 0, end: 3 });
	// the end of the sound cuts it off
	assert.deepEqual(shift(note, 40, 32), { note: C, start: 31, end: 32 });
});

test("resizing keeps a note at least one step and inside the sound", () => {
	const note: Key = { note: C, start: 2, end: 5 };

	assert.equal(resize(note, 9, 32).end, 9);
	assert.equal(resize(note, 1, 32).end, 3);
	assert.equal(resize(note, 50, 32).end, 32);
});

test("changing a note keeps it picked, removing it drops it", () => {
	const a: Key = { note: C, start: 0, end: 2 };
	const b: Key = { note: D, start: 4, end: 5 };
	const moved = shift(a, 1, 32);

	const changed = change({ sequence: [a, b], picked: a }, a, moved);
	assert.deepEqual(changed.sequence, [moved, b]);
	assert.equal(changed.picked, moved);

	assert.deepEqual(removePicked(changed), { sequence: [b], picked: null });
});
