// the tempos a studio can be in. every loop has a file for each of them.
export const TEMPOS = ["80", "120", "160"];

// a cell on a track is always this many beats
export const CELL_BEATS = 8;

// piano notes are written in eighths of a beat, 64 to a cell
export const PIANO_STEPS = 64;

// How many samples one cell is. Everything that builds audio for a cell goes
// by this number, so a cell is the same length whatever is in it and tracks
// can't drift apart. 176400 at 120 BPM and 44.1 kHz.
export const cellFrames = (bpm: number, sampleRate: number) =>
	Math.round((CELL_BEATS * 60 * sampleRate) / bpm);
