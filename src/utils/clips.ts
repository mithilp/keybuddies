import type { Clip, ClipBars, Item } from "./types";

// Clips on tracks, as plain math so it can be tested on its own.
//
// A track doc keeps its clips in `notes`, the field cells were kept in, and
// how long it is in `bars`. A clip is `{ type, name, id, start, bars }`, with
// `start` and `bars` counted in bars of 4 beats.
//
// Tracks from before clips had lengths are a list of 8 beat cells, some of
// them empty, and no `bars`. Those are read as they are: the cell at index i
// is a 2 bar clip on bar i * 2 and the track is 2 bars per cell. Nothing is
// rewritten until someone changes the track, and then it's written the new
// way.

// the lengths a clip can be
export const CLIP_BARS: ClipBars[] = [1, 2, 4];

// what a loop is, and a sound saved before sounds had a length
export const DEFAULT_BARS: ClipBars = 2;

// how long a track can get in the app. old tracks can be up to 2000 bars
// (1000 cells), those are left as long as they are.
export const MAX_BARS = 1000;

export const isClipBars = (value: unknown): value is ClipBars =>
	value === 1 || value === 2 || value === 4;

// how long a sound or a loop is on its own
export const soundBars = (bars: unknown): ClipBars =>
	isClipBars(bars) ? bars : DEFAULT_BARS;

export type TrackClips = { clips: Clip[]; bars: number };

const count = (value: unknown): value is number =>
	typeof value === "number" && Number.isInteger(value) && value >= 0;

export const clipEnd = (clip: Clip) => clip.start + clip.bars;

// A track doc's `notes` and `bars` as clips in order and a length. Empty
// cells and anything that isn't a loop or a sound are left out. A clip that
// would start inside the one before it can only come from a broken write,
// it's left out too so two clips never play over each other.
export const readTrack = (notes: unknown, bars: unknown): TrackClips => {
	const list: unknown[] = Array.isArray(notes) ? notes : [];
	const read: Clip[] = [];

	list.forEach((note, index) => {
		if (!note || typeof note !== "object") return;
		const entry = note as Record<string, unknown>;

		if (entry.type !== "loop" && entry.type !== "sound") return;
		if (typeof entry.id !== "string" || entry.id === "") return;

		// an old cell has no start, its place in the list is where it is
		const placed = count(entry.start);

		read.push({
			type: entry.type,
			name: typeof entry.name === "string" ? entry.name : "",
			id: entry.id,
			start: placed ? (entry.start as number) : index * DEFAULT_BARS,
			bars: placed ? soundBars(entry.bars) : DEFAULT_BARS,
		});
	});

	read.sort((a, b) => a.start - b.start);

	const clips: Clip[] = [];
	for (const clip of read) {
		const last = clips[clips.length - 1];
		if (!last || clip.start >= clipEnd(last)) clips.push(clip);
	}

	const last = clips[clips.length - 1];
	const length = count(bars) ? bars : list.length * DEFAULT_BARS;

	return { clips, bars: Math.max(length, last ? clipEnd(last) : 0) };
};

// what goes in the doc's `notes`, nothing but the fields a clip has
export const writeClips = (clips: Clip[]) =>
	[...clips]
		.sort((a, b) => a.start - b.start)
		.map(({ type, name, id, start, bars }) => ({ type, name, id, start, bars }));

export const sameClip = (a: Clip, b: Clip) =>
	a.type === b.type && a.id === b.id && a.start === b.start && a.bars === b.bars;

// the clip that covers a bar, if one does
export const clipAt = (clips: Clip[], bar: number) =>
	clips.find((clip) => clip.start <= bar && bar < clipEnd(clip)) ?? null;

// the bar the first clip after `bar` starts on, or where a track has to stop
const nextStart = (track: TrackClips, bar: number) =>
	Math.min(
		Math.max(MAX_BARS, track.bars),
		...track.clips.filter((clip) => clip.start > bar).map((clip) => clip.start)
	);

// Whether a clip can be `bars` long without running into the next one. A
// clip can run past the end of its track, the track gets longer.
export const fits = (track: TrackClips, clip: Clip, bars: ClipBars) =>
	clip.start + bars <= nextStart(track, clip.start);

const longest = (track: TrackClips, clips: Clip[]) => ({
	clips: clips,
	bars: Math.max(track.bars, ...clips.map(clipEnd)),
});

// Puts a loop or a sound on a track. All of these come back with null when
// there's nothing to write, which is also what happens when the track
// changed under a pick and what was picked isn't there any more.
//
// Over a clip it takes that clip's place and length. On an empty bar it
// gets the length the loop or sound has on its own, cut down to the longest
// of 4, 2 or 1 bars that fits before the next clip, so clips never overlap.
export const placeItem = (
	track: TrackClips,
	at: { bar: number; clip: Clip | null },
	item: Item
): TrackClips | null => {
	const what = { type: item.type, name: item.name, id: item.id };

	if (at.clip) {
		const old = at.clip;
		if (!track.clips.some((clip) => sameClip(clip, old))) return null;

		return longest(
			track,
			track.clips.map((clip) =>
				sameClip(clip, old) ? { ...what, start: old.start, bars: old.bars } : clip
			)
		);
	}

	if (!count(at.bar) || at.bar >= track.bars) return null;
	if (clipAt(track.clips, at.bar)) return null;

	const room = nextStart(track, at.bar) - at.bar;
	const bars = CLIP_BARS.filter(
		(bars) => bars <= soundBars(item.bars) && bars <= room
	).pop();
	if (!bars) return null;

	return longest(
		track,
		[...track.clips, { ...what, start: at.bar, bars: bars }].sort(
			(a, b) => a.start - b.start
		)
	);
};

// Makes a clip another length. Only a length that fits is taken.
export const resizeClip = (
	track: TrackClips,
	old: Clip,
	bars: ClipBars
): TrackClips | null => {
	if (old.bars === bars) return null;
	if (!track.clips.some((clip) => sameClip(clip, old))) return null;
	if (!fits(track, old, bars)) return null;

	return longest(
		track,
		track.clips.map((clip) =>
			sameClip(clip, old) ? { ...clip, bars: bars } : clip
		)
	);
};

export const removeClip = (track: TrackClips, old: Clip): TrackClips | null =>
	track.clips.some((clip) => sameClip(clip, old))
		? {
				clips: track.clips.filter((clip) => !sameClip(clip, old)),
				bars: track.bars,
			}
		: null;

// one more empty bar on the end
export const addBar = (track: TrackClips): TrackClips | null =>
	track.bars < MAX_BARS ? { clips: track.clips, bars: track.bars + 1 } : null;

// takes the last bar off, only when it's empty
export const removeBar = (track: TrackClips): TrackClips | null =>
	track.bars > 0 && !clipAt(track.clips, track.bars - 1)
		? { clips: track.clips, bars: track.bars - 1 }
		: null;

// The pieces a clip is played as. A clip plays its source from the start,
// and when the clip is longer than the source it plays it again, so a 2 bar
// loop in a 4 bar clip is heard twice. A source longer than the clip is cut
// off where the clip ends.
//
// `framesAt` is how many samples from the start of the song bar n starts
// on (framesOf in tempo.ts). Every piece starts on a bar line worked out
// from the start of the song, so a repeat lands on exactly the sample a clip
// starting there would. `length` is how much room the piece has, at most
// `sourceBars` long; the caller copies no more of the source than it has.
export const fill = (
	clip: { start: number; bars: number },
	sourceBars: number,
	framesAt: (bar: number) => number
) => {
	const pieces: { at: number; length: number }[] = [];
	const last = clip.start + clip.bars;

	for (let bar = clip.start; bar < last; bar += sourceBars) {
		const end = Math.min(bar + sourceBars, last);
		pieces.push({ at: framesAt(bar), length: framesAt(end) - framesAt(bar) });
	}

	return pieces;
};
