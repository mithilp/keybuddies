import { doc, runTransaction } from "firebase/firestore";
import { db } from "./firebase";
import { Cell } from "./types";

// Changes the cells of one track. The cells are read from the server inside
// a transaction, `change` makes the new list out of them and that's what is
// written. If someone else changed the track in between, Firestore runs the
// whole thing again on their version, so two people working on different
// cells of a track both keep their change.
//
// `change` comes back with null when there's nothing to write.
const editCells = (
	studio: string,
	track: string,
	change: (cells: Cell[]) => Cell[] | null
) =>
	runTransaction(db, async (transaction) => {
		const ref = doc(db, "studios", studio, "tracks", track);
		const snapshot = await transaction.get(ref);

		// the track was deleted while this was on its way
		if (!snapshot.exists()) return;

		const cells: Cell[] = snapshot.data().notes ?? [];
		const next = change(cells);

		if (next) transaction.update(ref, { notes: next });
	});

const same = (a: Cell, b: Cell) => a.type === b.type && a.id === b.id;

// puts a loop or a sound in a cell, if the cell is still there
export const setCell = (
	studio: string,
	track: string,
	index: number,
	cell: Cell
) =>
	editCells(studio, track, (cells) =>
		index < cells.length
			? cells.map((old, i) => (i === index ? cell : old))
			: null
	);

export const addCell = (studio: string, track: string) =>
	editCells(studio, track, (cells) => [
		...cells,
		{ type: "empty", name: "", id: "" },
	]);

// Takes a cell out. Cells go by position, so if the one at this position
// isn't the one that was on screen any more (someone else took out a cell
// before it), nothing is removed.
export const removeCell = (
	studio: string,
	track: string,
	index: number,
	seen: Cell
) =>
	editCells(studio, track, (cells) =>
		index < cells.length && same(cells[index], seen)
			? cells.filter((_, i) => i !== index)
			: null
	);
