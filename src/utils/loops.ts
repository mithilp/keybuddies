import type { ClipBars, Item } from "./types";

// The library: the loops that come with the app. They're kept in sets, and
// another set is one more entry in `library`.
//
// A loop's id is what a clip keeps and what its files are named after, so
// an id that's been out in the world doesn't change.
export type LibraryLoop = {
	id: string;
	name: string;
	// one line on what it is
	description: string;
	// how many bars the file is. every loop so far is 2, and one without
	// this is 2
	bars?: ClipBars;
};

export type LibrarySet = {
	name: string;
	description: string;
	loops: LibraryLoop[];
};

export const library: LibrarySet[] = [
	{
		name: "Love Story",
		description:
			"The bass, piano and drums of one song, cut into 8 beat loops. They're made to go together, so stack them on different tracks.",
		loops: [
			{
				id: "bass_1",
				name: "Bass 1",
				description: "Bass line, part 1 of 4.",
			},
			{
				id: "bass_2",
				name: "Bass 2",
				description: "Bass line, part 2 of 4.",
			},
			{
				id: "bass_3",
				name: "Bass 3",
				description: "Bass line, part 3 of 4.",
			},
			{
				id: "bass_4",
				name: "Bass 4",
				description: "Bass line, part 4 of 4.",
			},
			{
				id: "piano_1",
				name: "Piano 1",
				description: "Piano, part 1 of 4.",
			},
			{
				id: "piano_2",
				name: "Piano 2",
				description: "Piano, part 2 of 4.",
			},
			{
				id: "piano_3",
				name: "Piano 3",
				description: "Piano, part 3 of 4.",
			},
			{
				id: "piano_4",
				name: "Piano 4",
				description: "Piano, part 4 of 4.",
			},
			{
				id: "love_story_drums",
				name: "Love Story Drums",
				description: "The drum beat.",
			},
		],
	},
];

// every loop of every set, in the order the library shows them
const loops = library.flatMap((set) => set.loops);

// Loops are FLAC so they decode to exactly their length in every browser.
// See scripts/stretch-loop.py for how the files are made.
export const loopUrl = (id: string, bpm: number | string) =>
	`/loops/${id}_${bpm}.flac`;

// How many bars a loop's file is. A loop the library doesn't have any more
// still has its files, and those are all 2 bars.
export const loopBars = (id: string): ClipBars =>
	loops.find((loop) => loop.id == id)?.bars ?? 2;

// the ids in a field of the studio document, whatever is really in it
const ids = (field: unknown) =>
	new Set(
		Array.isArray(field)
			? field.filter((id): id is string => typeof id == "string")
			: []
	);

// the first clip of every loop that's on a track
const onTracks = (tracks: { clips: Item[] }[]) => {
	const used = new Map<string, Item>();

	for (const track of tracks) {
		for (const clip of track.clips) {
			if (clip.type == "loop" && !used.has(clip.id)) used.set(clip.id, clip);
		}
	}

	return used;
};

// The library loops a studio has, as what the sidebar puts on tracks.
//
// `added` and `removed` are the studio's `library` and `libraryRemoved`
// fields. A loop is in the studio when it was added from the library. It's
// also in when a clip holds it, unless it was taken out of the list since:
// studios from before the library have loops on their tracks and neither
// field, and those loops have to show up. The studio page writes those into
// `library` when it opens (see `cellOnlyLoops`), so this only carries them
// until that's done.
//
// They come in the library's order, so the list is the same for everyone.
// A loop on a track that the library doesn't have any more goes last, under
// the name its clip has.
export const studioLoops = (
	tracks: { clips: Item[] }[],
	added: unknown,
	removed: unknown
): Item[] => {
	const has = ids(added);
	const out = ids(removed);
	const used = onTracks(tracks);

	const known = loops.filter(
		(loop) => has.has(loop.id) || (used.has(loop.id) && !out.has(loop.id))
	);

	const gone = [...used.values()].filter(
		(clip) => !out.has(clip.id) && !loops.some((loop) => loop.id == clip.id)
	);

	return [...known, ...gone].map(
		({ id, name }): Item => ({
			type: "loop",
			id: id,
			name: name,
			bars: loopBars(id),
		})
	);
};

// The ids of the loops that are only in the list because a clip holds them.
// Left like that, a loop would leave the list for everyone when its last
// clip is replaced or its track is deleted, with nobody having removed
// it. So these get written into `library`, and then they stay the way an
// added loop does.
//
// A loop the library doesn't have any more isn't one of them. Its name is
// only on its clips, so there's nothing to list it by once they're gone.
export const cellOnlyLoops = (
	tracks: { clips: Item[] }[],
	added: unknown,
	removed: unknown
): string[] => {
	const has = ids(added);
	const out = ids(removed);
	const used = onTracks(tracks);

	return loops
		.filter(({ id }) => used.has(id) && !has.has(id) && !out.has(id))
		.map(({ id }) => id);
};

export default loops;
