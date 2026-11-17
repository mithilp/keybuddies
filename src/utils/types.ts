import { Timestamp } from "firebase/firestore";

export type Track = {
	createdAt: Timestamp;
	name: string;
	order: number;
	notes: Cell[];
	id: string;
};

// "loading" is the gap between pressing play and the tracks starting
export type Playback = "stopped" | "loading" | "playing";

// The cell that's picked to take a loop or a sound: the id of its track, its
// place on it and what was in it when it was picked. Cells go by position, so
// the last one is how to tell that it's still the same cell. null when
// nothing is picked.
export type SelectedCell = { track: string; index: number; cell: Cell } | null;

export type Cell = {
	type: "sound" | "empty" | "loop";
	name: string;
	id: string;
};

export type Sound = {
	name: string;
	id: string;
	sequence: Key[];
	type: "piano" | "drum";
	// what a friend types in to add this sound to their studio
	code?: string;
};

// One note in a recorded sound. What the numbers mean depends on the sound.
//
// piano: `note` is a MIDI number. `start` and `end` count eighths of a beat
// from the start of the cell, 64 to a cell.
//
// drum: `note` is a position in the drum list (0 clap, 1 kick, 2 open hat,
// 3 closed hat, 4 snare, 5 low tom). `start` is the half-beat step it lands
// on, 0 to 15, with 0 being the first beat of the cell. `end` is `start + 1`
// and only there to keep the shape the same, drums ring out on their own.
export type Key = {
	note: number;
	start: number;
	end: number;
};
