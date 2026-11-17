// the tempos a studio can be in. every loop has a file for each of them.
export const TEMPOS = ["80", "120", "160"];

// a bar is 4 beats. tracks are laid out in bars and clips are 1, 2 or 4 of
// them long.
export const BAR_BEATS = 4;

// piano notes are written in eighths of a beat, 32 to a bar
export const PIANO_BAR_STEPS = 32;

// How many samples from the start of the song to the start of bar `bars`.
// Everything that builds audio goes by this number, and a position is always
// worked out from the start, never by adding lengths up, so tracks can't
// drift apart however long they are. A 2 bar loop is 176400 samples at 120
// BPM and 44.1 kHz.
export const framesOf = (bars: number, bpm: number, sampleRate: number) =>
	Math.round((bars * BAR_BEATS * 60 * sampleRate) / bpm);
