import { useCallback, useEffect, useState } from "react";
import { sameCell, setCell } from "./cells";
import { Cell, SelectedCell, Track } from "./types";

type PickedCell = NonNullable<SelectedCell>;

export type Placing = {
	// the cell that's waiting for a loop or a sound, if one is
	cell: SelectedCell;
	// the loop or the sound that's waiting for a cell, if one is
	item: Cell | null;
	// a click on a cell
	pickCell: (cell: PickedCell) => void;
	// a click on a loop or a sound in the sidebar
	pickItem: (item: Cell) => void;
	// lets go of the loop or sound and keeps the cell
	dropItem: () => void;
};

// Putting loops and sounds in cells. It works in both orders: pick a cell and
// then what goes in it, or pick what goes in and then the cell. Whichever is
// picked first waits, the second click puts it in and nothing is picked any
// more. A second click on what's waiting, or Escape, lets go of it.
//
// The studio page has the only one of these, and the tracks and the sidebar
// are both handed it. Loops and recorded sounds go through the same
// `pickItem`, the only difference between them is the cell they make.
//
// `failed` gets a message when the cell couldn't be saved.
export const usePlacing = (
	studio: string,
	tracks: Track[],
	failed: (message: string) => void
): Placing => {
	const [cell, setPicked] = useState<SelectedCell>(null);
	const [item, setItem] = useState<Cell | null>(null);

	// A pick is for the cell it was made on. When that cell isn't at its place
	// any more (someone else took out a cell before it, or put something in
	// it), the pick is let go, so a loop can't land in the cell that moved in.
	if (cell) {
		const track = tracks.find((track) => track.id === cell.track);
		const now = track?.notes[cell.index];

		if (!now || !sameCell(now, cell.cell)) setPicked(null);
	}

	const put = (into: PickedCell, what: Cell) => {
		setPicked(null);
		setItem(null);

		setCell(studio, into.track, into.index, into.cell, what).catch((error) => {
			console.error(error);
			failed(
				`Couldn't put the ${what.type == "loop" ? "loop" : "sound"} in. Try again.`
			);
		});
	};

	const pickCell = (target: PickedCell) => {
		if (item) {
			put(target, item);
		} else if (cell?.track == target.track && cell.index == target.index) {
			setPicked(null);
		} else {
			setPicked(target);
		}
	};

	const pickItem = (next: Cell) => {
		if (cell) {
			put(cell, next);
		} else if (item && sameCell(item, next)) {
			setItem(null);
		} else {
			setItem(next);
		}
	};

	const dropItem = useCallback(() => setItem(null), []);

	const waiting = cell !== null || item !== null;

	// A dialog that's open takes Escape for itself before it gets here.
	useEffect(() => {
		if (!waiting) return;

		const onKey = (event: KeyboardEvent) => {
			if (event.key !== "Escape") return;

			setPicked(null);
			setItem(null);
		};

		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [waiting]);

	return { cell, item, pickCell, pickItem, dropItem };
};
