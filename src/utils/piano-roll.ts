import type { Key } from "./types";

// What the piano roll does with a tap, a drag or a button, without the
// drawing. A note is picked by tapping it, and then it can be moved, made
// longer or shorter, or deleted. Nothing is ever deleted by a plain tap,
// so a finger that misses can't lose a note.

// a note takes up every step from its start up to, not including, its end.
// one that was saved without a length still takes up the step it starts on.
export const covers = (key: Key, step: number) =>
	key.start === step || (key.start < step && key.end > step);

// how many steps a note takes up, never less than one
export const span = (key: Key) => Math.max(1, key.end - key.start);

// the note drawn at a step of a row. where two notes meet, the one that
// starts there is on top.
export const noteAt = (sequence: Key[], note: number, step: number) => {
	const row = sequence.filter((key) => key.note === note);

	return (
		row.find((key) => key.start === step) ??
		row.find((key) => covers(key, step)) ??
		null
	);
};

// the notes, and the one that's picked if one is. `picked` is always one of
// the notes in `sequence`, the same object.
export type Roll = { sequence: Key[]; picked: Key | null };

// the picked note, if it's still in the sequence. a recording that's going
// on replaces notes as their keys come up.
export const pickedIn = (sequence: Key[], picked: Key | null) =>
	picked && sequence.includes(picked) ? picked : null;

// A tap on a step of a row. On an empty step it adds a note one step long,
// unless a note is picked, and then it only lets go of that one. On a note
// it picks it, or lets go of it when it's the one picked. `remove` is the
// Alt click on a mouse, which deletes the note straight away.
//
// `added` is the note that was added, so it can be heard.
export const tap = (
	roll: Roll,
	note: number,
	step: number,
	remove = false
): Roll & { added: Key | null } => {
	const picked = pickedIn(roll.sequence, roll.picked);
	const key = noteAt(roll.sequence, note, step);

	if (!key) {
		if (picked) return { sequence: roll.sequence, picked: null, added: null };

		const added = { note, start: step, end: step + 1 };
		return { sequence: [...roll.sequence, added], picked: null, added };
	}

	if (remove) {
		return {
			sequence: roll.sequence.filter((other) => other !== key),
			picked: picked === key ? null : picked,
			added: null,
		};
	}

	return {
		sequence: roll.sequence,
		picked: picked === key ? null : key,
		added: null,
	};
};

// the note moved `by` steps, as far as it can go. it keeps its length, and
// doesn't go past the end unless it already did.
export const shift = (key: Key, by: number, steps: number): Key => {
	const start = Math.min(steps - 1, Math.max(0, key.start + by));
	const end = Math.min(Math.max(steps, key.end), start + span(key));

	return { ...key, start, end };
};

// the note ending at `end`, at least one step long and not past the end
export const resize = (key: Key, end: number, steps: number): Key => ({
	...key,
	end: Math.min(steps, Math.max(key.start + 1, end)),
});

// puts `next` where `key` was, and keeps it picked
export const change = (roll: Roll, key: Key, next: Key): Roll => ({
	sequence: roll.sequence.map((other) => (other === key ? next : other)),
	picked: next,
});

// the picked note gone
export const removePicked = (roll: Roll): Roll => ({
	sequence: roll.sequence.filter((other) => other !== roll.picked),
	picked: null,
});
