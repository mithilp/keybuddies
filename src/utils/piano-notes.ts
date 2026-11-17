import { HIGHEST_NOTE, LOWEST_NOTE } from "./MIDI";
import { PIANO_STEPS } from "./tempo";
import { Key } from "./types";

// A saved piano recording as notes that can be drawn and played. The piano
// roll and the renderer both read recordings through this, so they agree on
// what's in one.
//
// Older recordings have notes that newer ones can't: no length, because the
// key was let go of within a step or was still down when recording stopped,
// a start before the cell from a move left that went wrong, a start past the
// end of it, or a key there's no sample for. Notes that could never sound
// are left out. The rest are kept inside the cell and are at least one step
// long.
export const pianoNotes = (sequence: Array<Key>): Array<Key> =>
	sequence
		.filter(
			(key) =>
				key.note >= LOWEST_NOTE &&
				key.note <= HIGHEST_NOTE &&
				key.start < PIANO_STEPS
		)
		.map((key) => {
			const start = Math.max(0, key.start);
			const end = Math.min(PIANO_STEPS, Math.max(start + 1, key.end));

			return { note: key.note, start: start, end: end };
		});
