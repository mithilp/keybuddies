import type { Timestamp } from "firebase/firestore";

export type Track = {
	createdAt: Timestamp;
	name: string;
	order: number;
	// what's on the track, in order, never overlapping. read out of the doc's
	// `notes` field by readTrack, see clips.ts.
	clips: Clip[];
	// how long the track is in bars, empty ones after the last clip included
	bars: number;
	id: string;
};

// "loading" is the gap between pressing play and the tracks starting
export type Playback = "stopped" | "loading" | "playing";

export type ClipBars = 1 | 2 | 4;

// A loop or a sound on a track. `start` is the bar it starts on, counting
// from 0, and `bars` how long it is. A clip shorter than what's in it plays
// the start of it, a longer one plays it again until it's full.
export type Clip = {
	type: "loop" | "sound";
	name: string;
	id: string;
	start: number;
	bars: ClipBars;
};

// A loop or a sound that can go on a track, from the sidebar. `bars` is how
// long it is on its own, 2 when it isn't there.
export type Item = {
	type: "loop" | "sound";
	name: string;
	id: string;
	bars?: ClipBars;
};

// The place that's picked to take a loop or a sound: the id of its track,
// the bar it's on and the clip that was there when it was picked, null for
// an empty bar. null when nothing is picked.
export type Slot = { track: string; bar: number; clip: Clip | null } | null;

export type Sound = {
	name: string;
	id: string;
	sequence: Key[];
	type: "piano" | "drum";
	// what a friend types in to add this sound to their studio
	code?: string;
	// drum: how many sixteenth note steps the beat has, 16 to a bar. beats
	// saved before it was there are on half beats and have 16 steps over 2
	// bars or nothing at all, see drumBeat.
	steps?: number;
	// how long the sound is, 1, 2 or 4 bars. sounds from before it was there
	// are 2.
	bars?: ClipBars;
};

// One note in a recorded sound. What the numbers mean depends on the sound.
//
// piano: `note` is a MIDI number. `start` and `end` count eighths of a beat
// from the start of the sound, 32 to a bar.
//
// drum: `note` is a position in the drum list (0 clap, 1 kick, 2 open hat,
// 3 closed hat, 4 snare, 5 low tom). `start` is the sixteenth note step it
// lands on, 16 to a bar, with 0 being the first beat of the sound. A beat
// saved before sounds had `bars` and with no `steps` (or 16 of them) is on
// half beats instead, 0 to 15 over 2 bars. `end` is
// `start + 1` and only there to keep the shape the same, drums ring out on
// their own.
export type Key = {
	note: number;
	start: number;
	end: number;
};
