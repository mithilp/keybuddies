import type { Cell } from "./types";

// The library: the loops that come with the app. They're kept in sets, and
// another set is one more entry in `library`.
//
// A loop's id is what a cell keeps and what its files are named after, so
// an id that's been out in the world doesn't change.
export type LibraryLoop = {
	id: string;
	name: string;
	// one line on what it is
	description: string;
};

export type LibrarySet = {
	name: string;
	description: string;
	loops: LibraryLoop[];
};

export const library: LibrarySet[] = [
	{
		name: "Loops",
		description: "Bass, piano and drum loops. Each one is 8 beats.",
		loops: [
			{
				id: "bass_1",
				name: "Bass 1",
				description: "One of four bass loops.",
			},
			{
				id: "bass_2",
				name: "Bass 2",
				description: "One of four bass loops.",
			},
			{
				id: "bass_3",
				name: "Bass 3",
				description: "One of four bass loops.",
			},
			{
				id: "bass_4",
				name: "Bass 4",
				description: "One of four bass loops.",
			},
			{
				id: "piano_1",
				name: "Piano 1",
				description: "One of four piano loops.",
			},
			{
				id: "piano_2",
				name: "Piano 2",
				description: "One of four piano loops.",
			},
			{
				id: "piano_3",
				name: "Piano 3",
				description: "One of four piano loops.",
			},
			{
				id: "piano_4",
				name: "Piano 4",
				description: "One of four piano loops.",
			},
			{
				id: "love_story_drums",
				name: "Love Story Drums",
				description: "The drum loop.",
			},
		],
	},
];

// every loop of every set, in the order the library shows them
const loops = library.flatMap((set) => set.loops);

// Loops are FLAC so they decode to exactly 8 beats in every browser. See
// scripts/stretch-loop.py for how the files are made.
export const loopUrl = (id: string, bpm: number | string) =>
	`/loops/${id}_${bpm}.flac`;

// the ids in a field of the studio document, whatever is really in it
const ids = (field: unknown) =>
	new Set(
		Array.isArray(field)
			? field.filter((id): id is string => typeof id == "string")
			: []
	);

// the first cell of every loop that's on a track
const inCells = (tracks: { notes: Cell[] }[]) => {
	const used = new Map<string, Cell>();

	for (const track of tracks) {
		for (const cell of track.notes) {
			if (cell.type == "loop" && !used.has(cell.id)) used.set(cell.id, cell);
		}
	}

	return used;
};

// The library loops a studio has, as the cells they make, for the sidebar.
//
// `added` and `removed` are the studio's `library` and `libraryRemoved`
// fields. A loop is in the studio when it was added from the library. It's
// also in when a cell holds it, unless it was taken out of the list since:
// studios from before the library have loops in their cells and neither
// field, and those loops have to show up. The studio page writes those into
// `library` when it opens (see `cellOnlyLoops`), so this only carries them
// until that's done.
//
// They come in the library's order, so the list is the same for everyone.
// A loop in a cell that the library doesn't have any more goes last, under
// the name its cell has.
export const studioLoops = (
	tracks: { notes: Cell[] }[],
	added: unknown,
	removed: unknown
): Cell[] => {
	const has = ids(added);
	const out = ids(removed);
	const used = inCells(tracks);

	const known = loops.filter(
		(loop) => has.has(loop.id) || (used.has(loop.id) && !out.has(loop.id))
	);

	const gone = [...used.values()].filter(
		(cell) => !out.has(cell.id) && !loops.some((loop) => loop.id == cell.id)
	);

	return [...known, ...gone].map(
		({ id, name }): Cell => ({ type: "loop", id: id, name: name })
	);
};

// The ids of the loops that are only in the list because a cell holds them.
// Left like that, a loop would leave the list for everyone when its last
// cell is overwritten or its track is deleted, with nobody having removed
// it. So these get written into `library`, and then they stay the way an
// added loop does.
//
// A loop the library doesn't have any more isn't one of them. Its name is
// only in its cell, so there's nothing to list it by once the cell is gone.
export const cellOnlyLoops = (
	tracks: { notes: Cell[] }[],
	added: unknown,
	removed: unknown
): string[] => {
	const has = ids(added);
	const out = ids(removed);
	const used = inCells(tracks);

	return loops
		.filter(({ id }) => used.has(id) && !has.has(id) && !out.has(id))
		.map(({ id }) => id);
};

export default loops;
