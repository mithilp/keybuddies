import { HIGHEST_NOTE, LOWEST_NOTE } from "./MIDI";
import { Key } from "./types";

// A saved piano recording as notes that can be drawn and played. The piano
// roll and the renderer both read recordings through this, so they agree on
// what's in one.
//
// Older recordings have notes that newer ones can't: no length, because the
// key was let go of within a step or was still down when recording stopped,
// a start before the sound from a move left that went wrong, a start past
// the end of it, or a key there's no sample for. Notes that could never
// sound are left out. The rest are kept inside the sound, `steps` long, and
// are at least one step long.
export const pianoNotes = (sequence: Array<Key>, steps: number): Array<Key> =>
	sequence
		.filter(
			(key) =>
				key.note >= LOWEST_NOTE &&
				key.note <= HIGHEST_NOTE &&
				key.start < steps
		)
		.map((key) => {
			const start = Math.max(0, key.start);
			const end = Math.min(steps, Math.max(start + 1, key.end));

			return { note: key.note, start: start, end: end };
		});
