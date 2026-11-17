import { BAR_BEATS } from "./tempo";

// How the song is laid out on screen, in px. The ruler, the bars on the
// tracks and the playhead are all measured from these, so a border or a
// size changed in one place can't pull them apart.

// one beat on the ruler
export const BEAT_WIDTH = 28;

// one bar on a track lines up with 4 beats on the ruler
export const BAR_WIDTH = BAR_BEATS * BEAT_WIDTH;

// what's in a bar is this much narrower, so clips next to each other don't
// touch
export const CLIP_GAP = 8;

// the row of bar numbers above the ruler's line. the playhead starts right
// under it, on the line.
export const RULER_HEIGHT = 24;

// the tick at the start of every beat. a beat is on the middle of its tick.
export const TICK_WIDTH = 2;
export const TICK_HEIGHT = 16;

// the playhead's line, and how far it's pulled left so its middle is on
// the middle of a tick
export const PLAYHEAD_WIDTH = 8;
export const PLAYHEAD_LEFT = TICK_WIDTH / 2 - PLAYHEAD_WIDTH / 2;

// its arrow is one beat wide and on the same spot
export const ARROW_LEFT = TICK_WIDTH / 2 - BEAT_WIDTH / 2;

// the beat nearest to `x` px from the start of the song, but never the very
// end
export const beatAt = (x: number, beats: number) =>
	Math.max(0, Math.min(Math.round(x / BEAT_WIDTH), beats - 1));
