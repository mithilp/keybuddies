import { doc, runTransaction } from "firebase/firestore";
import {
	addBar,
	placeItem,
	readTrack,
	removeBar,
	removeClip,
	resizeClip,
	TrackClips,
	writeClips,
} from "./clips";
import { db } from "./firebase";
import { Clip, ClipBars, Item } from "./types";

// Changes the clips of one track. The track is read from the server inside
// a transaction, `change` makes the new clips and length out of it and
// that's what is written. If someone else changed the track in between,
// Firestore runs the whole thing again on their version, so two people
// working on different clips of a track both keep their change.
//
// An old track (cells, no `bars`) is read the way it's shown, and the first
// change writes it as clips. `change` comes back with null when there's
// nothing to write.
const editTrack = (
	studio: string,
	track: string,
	change: (track: TrackClips) => TrackClips | null
) =>
	runTransaction(db, async (transaction) => {
		const ref = doc(db, "studios", studio, "tracks", track);
		const snapshot = await transaction.get(ref);

		// the track was deleted while this was on its way
		if (!snapshot.exists()) return;

		const data = snapshot.data();
		const next = change(readTrack(data.notes, data.bars));

		if (next) {
			transaction.update(ref, {
				notes: writeClips(next.clips),
				bars: next.bars,
			});
		}
	});

// Puts a loop or a sound on a bar, or over the clip that was there. When
// what was picked isn't there any more nothing is written.
export const putItem = (
	studio: string,
	track: string,
	at: { bar: number; clip: Clip | null },
	item: Item
) => editTrack(studio, track, (now) => placeItem(now, at, item));

export const setClipBars = (
	studio: string,
	track: string,
	clip: Clip,
	bars: ClipBars
) => editTrack(studio, track, (now) => resizeClip(now, clip, bars));

export const takeOutClip = (studio: string, track: string, clip: Clip) =>
	editTrack(studio, track, (now) => removeClip(now, clip));

export const addTrackBar = (studio: string, track: string) =>
	editTrack(studio, track, addBar);

export const removeTrackBar = (studio: string, track: string) =>
	editTrack(studio, track, removeBar);
