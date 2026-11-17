import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { test } from "node:test";
import loops, { library, loopUrl, studioLoops } from "../src/utils/loops.ts";
import { TEMPOS } from "../src/utils/tempo.ts";
import type { Cell } from "../src/utils/types.ts";

const empty: Cell = { type: "empty", name: "", id: "" };
const loop = (id: string, name = id): Cell => ({ type: "loop", name, id });
const sound = (id: string): Cell => ({ type: "sound", name: id, id });

const track = (...notes: Cell[]) => ({ notes });

const ids = (cells: Cell[]) => cells.map((cell) => cell.id);

test("every library loop has a file at every tempo", () => {
	for (const { id } of loops) {
		for (const bpm of TEMPOS) {
			const file = new URL(`../public${loopUrl(id, bpm)}`, import.meta.url);

			assert.ok(existsSync(file), `${id} has no file at ${bpm}`);
		}
	}
});

test("every loop file belongs to a library loop", () => {
	const expected = loops.flatMap(({ id }) =>
		TEMPOS.map((bpm) => loopUrl(id, bpm).replace("/loops/", ""))
	);

	const files = readdirSync(new URL("../public/loops", import.meta.url));

	assert.deepEqual(files.sort(), expected.sort());
});

test("the library is sets of named, described loops with ids of their own", () => {
	assert.ok(library.length > 0);

	for (const set of library) {
		assert.ok(set.name);
		assert.ok(set.description);
		assert.ok(set.loops.length > 0);

		for (const { id, name, description } of set.loops) {
			assert.ok(id);
			assert.ok(name);
			assert.ok(description);
		}
	}

	assert.equal(new Set(loops.map(({ id }) => id)).size, loops.length);
	assert.equal(new Set(library.map((set) => set.name)).size, library.length);
});

test("the loops that cells already hold keep their ids and names", () => {
	// these are in cells in studios that exist. a cell keeps the id and the
	// name it was given.
	const kept = [
		["bass_1", "Bass 1"],
		["bass_2", "Bass 2"],
		["bass_3", "Bass 3"],
		["bass_4", "Bass 4"],
		["piano_1", "Piano 1"],
		["piano_2", "Piano 2"],
		["piano_3", "Piano 3"],
		["piano_4", "Piano 4"],
		["love_story_drums", "Love Story Drums"],
	];

	for (const [id, name] of kept) {
		assert.equal(loops.find((loop) => loop.id == id)?.name, name);
	}
});

test("a new studio has no loops", () => {
	const tracks = [track(empty, empty, empty, empty), track(empty)];

	assert.deepEqual(studioLoops(tracks, undefined, undefined), []);
	assert.deepEqual(studioLoops([], [], []), []);
});

test("a studio from before the library lists the loops in its cells", () => {
	const tracks = [
		track(loop("piano_2", "Piano 2"), empty, loop("bass_1", "Bass 1")),
		track(sound("abc"), loop("piano_2", "Piano 2")),
	];

	// once each, in the library's order, as the cells they make
	assert.deepEqual(studioLoops(tracks, undefined, undefined), [
		{ type: "loop", id: "bass_1", name: "Bass 1" },
		{ type: "loop", id: "piano_2", name: "Piano 2" },
	]);
});

test("added loops are listed whether or not a cell holds them", () => {
	assert.deepEqual(ids(studioLoops([], ["love_story_drums", "bass_3"], [])), [
		"bass_3",
		"love_story_drums",
	]);
});

test("the list is the added loops and the ones in cells together", () => {
	const tracks = [track(loop("bass_1"), loop("piano_4"))];

	assert.deepEqual(ids(studioLoops(tracks, ["bass_2", "bass_1"], undefined)), [
		"bass_1",
		"bass_2",
		"piano_4",
	]);
});

test("a removed loop leaves the list even while a cell holds it", () => {
	const tracks = [track(loop("bass_1"), loop("piano_4"))];

	assert.deepEqual(ids(studioLoops(tracks, [], ["bass_1"])), ["piano_4"]);

	// adding it again takes it off the removed list, but added wins anyway
	assert.deepEqual(ids(studioLoops(tracks, ["bass_1"], ["bass_1"])), [
		"bass_1",
		"piano_4",
	]);
});

test("a loop in a cell that the library doesn't have goes last, by the cell's name", () => {
	const tracks = [track(loop("old_synth", "Old Synth"), loop("bass_1"))];

	assert.deepEqual(studioLoops(tracks, undefined, undefined), [
		{ type: "loop", id: "bass_1", name: "Bass 1" },
		{ type: "loop", id: "old_synth", name: "Old Synth" },
	]);

	assert.deepEqual(ids(studioLoops(tracks, [], ["old_synth"])), ["bass_1"]);
});

test("ids the library doesn't know and fields that aren't lists are ignored", () => {
	assert.deepEqual(studioLoops([], ["nope", 7, null, "bass_1"], "bass_1"), [
		{ type: "loop", id: "bass_1", name: "Bass 1" },
	]);
	assert.deepEqual(studioLoops([], { bass_1: true }, 3), []);
});
