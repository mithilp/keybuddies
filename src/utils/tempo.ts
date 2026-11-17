// a cell on a track is always this many beats
export const CELL_BEATS = 8;

// How many samples one cell is. Everything that builds audio for a cell goes
// by this number, so a cell is the same length whatever is in it and tracks
// can't drift apart. 176400 at 120 BPM and 44.1 kHz.
export const cellFrames = (bpm: number, sampleRate: number) =>
	Math.round((CELL_BEATS * 60 * sampleRate) / bpm);
