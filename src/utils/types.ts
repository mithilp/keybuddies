import { Timestamp } from "firebase/firestore";

export type Track = {
	createdAt: Timestamp;
	name: string;
	order: number;
	notes: Cell[];
	id: string;
};

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

export type Key = {
	note: number;
	start: number;
	end: number;
};
