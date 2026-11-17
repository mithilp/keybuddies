import { arrayRemove, arrayUnion, doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

// Which library loops a studio has is two lists on its document: `library`
// is the loops that were added, `libraryRemoved` the ones that were taken
// out of the list while a cell still held them. A loop is only ever in one
// of them. Both are written with arrayUnion and arrayRemove, so two people
// adding at the same time both get their loop.
//
// The studio page reads them off the studio it's already listening to, and
// `studioLoops` makes the list out of them.
//
// A studio from before the library has loops in its cells and neither list.
// The studio page puts those in `library` with `keepLoops` when it opens.

export const addLoop = (studio: string, id: string) =>
	updateDoc(doc(db, "studios", studio), {
		library: arrayUnion(id),
		libraryRemoved: arrayRemove(id),
	});

// Takes a loop out of the studio's list. The cells that hold it are left
// alone and keep playing.
export const removeLoop = (studio: string, id: string) =>
	updateDoc(doc(db, "studios", studio), {
		library: arrayRemove(id),
		libraryRemoved: arrayUnion(id),
	});

// Writes down loops that are only in the list because a cell holds them, so
// they stay in it when the cell is gone.
export const keepLoops = (studio: string, ids: string[]) =>
	updateDoc(doc(db, "studios", studio), {
		library: arrayUnion(...ids),
	});
