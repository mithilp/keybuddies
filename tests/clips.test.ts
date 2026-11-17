import assert from "node:assert/strict";
import { test } from "node:test";
import {
	addBar,
	fill,
	fits,
	placeItem,
	readTrack,
	removeBar,
	removeClip,
	resizeClip,
	soundBars,
	writeClips,
} from "../src/utils/clips.ts";
import { framesOf } from "../src/utils/tempo.ts";
import type { Clip, Item } from "../src/utils/types.ts";

const empty = { type: "empty", name: "", id: "" };
const oldLoop = (id: string) => ({ type: "loop", name: id, id });

const clip = (
	id: string,
	start: number,
	bars: 1 | 2 | 4,
	type: "loop" | "sound" = "loop"
): Clip => ({ type, name: id, id, start, bars });

const bass: Item = { type: "loop", name: "Bass 1", id: "bass_1" };
const sound = (bars?: 1 | 2 | 4): Item => ({
	type: "sound",
	name: "Beat",
	id: "beat",
	bars,
});

test("an old track's cells are 2 bar clips where the cells were", () => {
	const read = readTrack({
		notes: [
			oldLoop("bass_1"),
			empty,
			{ type: "sound", name: "Hum", id: "hum" },
			empty,
		],
	});

	assert.deepEqual(read, {
		clips: [
			{ type: "loop", name: "bass_1", id: "bass_1", start: 0, bars: 2 },
			{ type: "sound", name: "Hum", id: "hum", start: 4, bars: 2 },
		],
		// 4 cells, empty ones too
		bars: 8,
	});

	// every cell empty is a track with nothing on it that's still 8 bars
	assert.deepEqual(readTrack({ notes: [empty, empty, empty, empty] }), {
		clips: [],
		bars: 8,
	});
});

test("cells are always read by their place", () => {
	const read = readTrack({
		notes: [empty, { ...oldLoop("bass_1"), start: 0, bars: 4 }],
	});

	assert.deepEqual(read.clips, [clip("bass_1", 2, 2)]);
});

test("a track with clips is read from them and not its cells", () => {
	// the cells an old track had before the new app first wrote it stay in
	// notes, out of date
	const read = readTrack({
		notes: [oldLoop("old"), oldLoop("old"), empty],
		clips: [clip("bass_1", 0, 4)],
		bars: 4,
	});

	assert.deepEqual(read, { clips: [clip("bass_1", 0, 4)], bars: 4 });

	// a new track with nothing on it
	assert.deepEqual(readTrack({ notes: [], clips: [], bars: 8 }), {
		clips: [],
		bars: 8,
	});
});

test("an entry in clips with no start is left out", () => {
	const read = readTrack({
		clips: [oldLoop("bass_1"), clip("hum", 2, 1)],
		bars: 4,
	});

	assert.deepEqual(read.clips, [clip("hum", 2, 1)]);
});

test("a new track is read as it was written", () => {
	const clips = [clip("bass_1", 0, 1), clip("beat", 3, 4, "sound")];

	assert.deepEqual(readTrack({ clips: writeClips(clips), bars: 9 }), {
		clips,
		bars: 9,
	});
});

test("a track is at least as long as its last clip", () => {
	assert.equal(readTrack({ clips: [clip("bass_1", 6, 4)], bars: 8 }).bars, 10);
	assert.equal(readTrack({ clips: [clip("bass_1", 6, 4)] }).bars, 10);
	assert.equal(readTrack({ clips: [], bars: 0 }).bars, 0);
	assert.equal(readTrack({}).bars, 0);
});

test("broken entries are left out and clips never overlap", () => {
	const read = readTrack({
		clips: [
			clip("late", 5, 2),
			null,
			"bass",
			{ type: "loop", name: "no id", id: "" },
			{ type: "drum", name: "x", id: "x", start: 0, bars: 1 },
			clip("first", 0, 4),
			// starts inside "first"
			clip("inside", 2, 1),
			// a length a clip can't be is 2
			{ ...clip("odd", 9, 1), bars: 3 },
		],
		bars: 12,
	});

	assert.deepEqual(read.clips, [
		clip("first", 0, 4),
		clip("late", 5, 2),
		clip("odd", 9, 2),
	]);
	assert.equal(read.bars, 12);
});

test("writing keeps only a clip's fields, in order", () => {
	const written = writeClips([
		clip("b", 4, 1),
		{ ...clip("a", 0, 2), extra: true } as Clip,
	]);

	assert.deepEqual(written, [
		{ type: "loop", name: "a", id: "a", start: 0, bars: 2 },
		{ type: "loop", name: "b", id: "b", start: 4, bars: 1 },
	]);
});

test("a sound with no length is 2 bars", () => {
	assert.equal(soundBars(undefined), 2);
	assert.equal(soundBars(3), 2);
	assert.equal(soundBars(1), 1);
	assert.equal(soundBars(4), 4);
});

test("a loop or a sound on an empty bar is as long as it is on its own", () => {
	const track = { clips: [], bars: 8 };

	assert.deepEqual(placeItem(track, { bar: 0, clip: null }, bass)?.clips, [
		{ type: "loop", name: "Bass 1", id: "bass_1", start: 0, bars: 2 },
	]);
	assert.deepEqual(placeItem(track, { bar: 1, clip: null }, sound(4))?.clips, [
		{ type: "sound", name: "Beat", id: "beat", start: 1, bars: 4 },
	]);
	assert.deepEqual(placeItem(track, { bar: 1, clip: null }, sound(1))?.clips, [
		{ type: "sound", name: "Beat", id: "beat", start: 1, bars: 1 },
	]);
	// an old sound
	assert.equal(
		placeItem(track, { bar: 1, clip: null }, sound())?.clips[0].bars,
		2
	);
});

test("a clip put in a gap is cut down to what fits", () => {
	const track = { clips: [clip("a", 0, 1), clip("b", 3, 2)], bars: 8 };

	// 2 bars free from bar 1, a 4 bar sound gets 2
	assert.deepEqual(
		placeItem(track, { bar: 1, clip: null }, sound(4))?.clips.map((clip) => [
			clip.id,
			clip.start,
			clip.bars,
		]),
		[
			["a", 0, 1],
			["beat", 1, 2],
			["b", 3, 2],
		]
	);

	// 1 bar free from bar 2
	assert.equal(
		placeItem(track, { bar: 2, clip: null }, sound(4))?.clips.find(
			(clip) => clip.id === "beat"
		)?.bars,
		1
	);
});

test("a clip that runs past the end makes the track longer", () => {
	const placed = placeItem(
		{ clips: [], bars: 8 },
		{ bar: 7, clip: null },
		sound(4)
	);

	assert.deepEqual(placed?.clips, [
		{ type: "sound", name: "Beat", id: "beat", start: 7, bars: 4 },
	]);
	assert.equal(placed?.bars, 11);
});

test("nothing goes on a covered bar or a bar past the end", () => {
	const track = { clips: [clip("a", 0, 4)], bars: 8 };

	assert.equal(placeItem(track, { bar: 2, clip: null }, bass), null);
	assert.equal(placeItem(track, { bar: 8, clip: null }, bass), null);
	assert.equal(placeItem(track, { bar: -1, clip: null }, bass), null);
});

test("over a clip, what goes in takes its place and its length", () => {
	const old = clip("a", 2, 4);
	const track = { clips: [old], bars: 8 };

	assert.deepEqual(placeItem(track, { bar: 2, clip: old }, sound(1))?.clips, [
		{ type: "sound", name: "Beat", id: "beat", start: 2, bars: 4 },
	]);
});

test("a pick on a clip that's changed since puts nothing in", () => {
	const track = { clips: [clip("a", 2, 2)], bars: 8 };

	// someone else made it longer
	assert.equal(placeItem(track, { bar: 2, clip: clip("a", 2, 4) }, bass), null);
	// someone else took it out
	assert.equal(
		placeItem({ clips: [], bars: 8 }, { bar: 2, clip: clip("a", 2, 2) }, bass),
		null
	);
});

test("a clip only gets a length that doesn't run into the next one", () => {
	const a = clip("a", 0, 2);
	const track = { clips: [a, clip("b", 3, 1)], bars: 8 };

	assert.equal(fits(track, a, 1), true);
	assert.equal(fits(track, a, 2), true);
	assert.equal(fits(track, a, 4), false);

	assert.equal(resizeClip(track, a, 4), null);
	assert.deepEqual(resizeClip(track, a, 1)?.clips[0], clip("a", 0, 1));

	// the last clip can grow past the end, the track grows with it
	const last = clip("b", 3, 1);
	assert.deepEqual(resizeClip({ clips: [last], bars: 4 }, last, 4), {
		clips: [clip("b", 3, 4)],
		bars: 7,
	});

	// the same length is nothing to write
	assert.equal(resizeClip(track, a, 2), null);
});

test("taking a clip out leaves the bars where they are", () => {
	const a = clip("a", 0, 2);

	assert.deepEqual(removeClip({ clips: [a], bars: 8 }, a), {
		clips: [],
		bars: 8,
	});
	assert.equal(removeClip({ clips: [], bars: 8 }, a), null);
});

test("bars are added on the end and only an empty last bar comes off", () => {
	assert.equal(addBar({ clips: [], bars: 8 })?.bars, 9);
	assert.equal(removeBar({ clips: [], bars: 8 })?.bars, 7);
	assert.equal(removeBar({ clips: [], bars: 0 }), null);
	assert.equal(removeBar({ clips: [clip("a", 6, 2)], bars: 8 }), null);
	assert.equal(removeBar({ clips: [clip("a", 5, 2)], bars: 8 })?.bars, 7);
});

const RATES = [44100, 48000];
const TEMPOS = [80, 120, 160, 77, 133];

test("a clip as long as its source plays it once", () => {
	for (const bpm of TEMPOS) {
		for (const rate of RATES) {
			const at = (bar: number) => framesOf(bar, bpm, rate);

			assert.deepEqual(fill({ start: 3, bars: 2 }, 2, at), [
				{ at: at(3), length: at(5) - at(3) },
			]);
		}
	}
});

test("a 1 bar clip plays bar 1 of a 2 bar source", () => {
	const at = (bar: number) => framesOf(bar, 120, 44100);

	// 88200 samples is one bar at 120, half of a 2 bar loop
	assert.deepEqual(fill({ start: 0, bars: 1 }, 2, at), [
		{ at: 0, length: 88200 },
	]);
	assert.deepEqual(fill({ start: 0, bars: 1 }, 4, at), [
		{ at: 0, length: 88200 },
	]);
});

test("a 4 bar clip plays a 2 bar source twice, each from a bar line", () => {
	for (const bpm of TEMPOS) {
		for (const rate of RATES) {
			const at = (bar: number) => framesOf(bar, bpm, rate);
			const pieces = fill({ start: 5, bars: 4 }, 2, at);

			assert.deepEqual(pieces, [
				{ at: at(5), length: at(7) - at(5) },
				{ at: at(7), length: at(9) - at(7) },
			]);

			// no gap and no overlap, and it ends on the clip's last sample
			assert.equal(pieces[0].at + pieces[0].length, pieces[1].at);
			assert.equal(pieces[1].at + pieces[1].length, at(9));
		}
	}
});

test("a 4 bar clip of a 1 bar source plays it 4 times", () => {
	const at = (bar: number) => framesOf(bar, 120, 48000);

	assert.deepEqual(
		fill({ start: 0, bars: 4 }, 1, at).map((piece) => piece.at),
		[0, 96000, 192000, 288000]
	);
});

test("a repeat lands on the same sample a clip starting there would", () => {
	for (const bpm of TEMPOS) {
		for (const rate of RATES) {
			const at = (bar: number) => framesOf(bar, bpm, rate);

			for (let start = 0; start < 40; start++) {
				const second = fill({ start, bars: 4 }, 2, at)[1];

				assert.equal(
					second.at,
					fill({ start: start + 2, bars: 2 }, 2, at)[0].at
				);
			}
		}
	}
});
