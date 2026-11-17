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

export type Cell = {
	type: "sound" | "empty" | "loop";
	name: string;
	id: string;
};

export type Sound = {
	name: string;
	id: string;
	sequence: Key[];
	type: "piano" | "guitar" | "drum";
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
