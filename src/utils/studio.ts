import {
	Timestamp,
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDoc,
	onSnapshot,
	orderBy,
	query,
	updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { readTrack } from "./clips";
import { Track } from "./types";

// A studio lives at studios/{code}, with its tracks under
// studios/{code}/tracks. Everything the app reads or writes about a studio
// or its tracks goes through here, apart from the clip edits in
// track-edits.ts.

// the tempo of a studio that never had one picked
export const DEFAULT_BPM = "120";

// how long a new track is, in bars
const TRACK_BARS = 8;

const tracksOf = (studio: string) =>
	collection(db, "studios", studio, "tracks");

// What the studio's own doc says. `library` and `libraryRemoved` are passed
// on as they came: a studio from before the library has neither, and
// loops.ts makes sense of them.
export type StudioData = {
	bpm: string;
	library: unknown;
	libraryRemoved: unknown;
};

export const studioExists = async (studio: string) =>
	(await getDoc(doc(db, "studios", studio))).exists();

// Listens to the studio's doc. `change` gets null when there's no such
// studio, and `fromServer` says whether the answer came from the server or
// from what this browser remembered.
//
// Metadata changes are included so a studio that isn't in the cache still
// gets a second answer once the server has been heard from.
export const listenStudio = (
	studio: string,
	change: (data: StudioData | null, fromServer: boolean) => void,
	failed: (error: Error) => void
) =>
	onSnapshot(
		doc(db, "studios", studio),
		{ includeMetadataChanges: true },
		(snap) => {
			const data = snap.data();

			change(
				data
					? {
							bpm: data.bpm ?? DEFAULT_BPM,
							library: data.library,
							libraryRemoved: data.libraryRemoved,
						}
					: null,
				!snap.metadata.fromCache
			);
		},
		failed
	);

// Listens to the studio's tracks, in order. Old tracks are cells and new
// ones are clips, and both come out the same.
export const listenTracks = (
	studio: string,
	change: (tracks: Track[]) => void,
	failed: (error: Error) => void
) =>
	onSnapshot(
		query(tracksOf(studio), orderBy("order")),
		(snap) => {
			change(
				snap.docs.map((track) => {
					const data = track.data();
					const { clips, bars } = readTrack(data);

					return {
						name: data.name,
						createdAt: data.createdAt,
						order: data.order,
						clips: clips,
						bars: bars,
						id: track.id,
					};
				})
			);
		},
		failed
	);

export const setBpm = (studio: string, bpm: string) =>
	updateDoc(doc(db, "studios", studio), { bpm: bpm });

// An empty track at the end. `order` is where it goes, and it's named for it.
export const addTrack = (studio: string, order: number) =>
	addDoc(tracksOf(studio), {
		createdAt: Timestamp.now(),
		name: `Track ${order + 1}`,
		order: order,
		// `notes` is only there so a tab still on the old app can show it
		notes: [],
		clips: [],
		bars: TRACK_BARS,
	});

export const deleteTrack = (studio: string, id: string) =>
	deleteDoc(doc(tracksOf(studio), id));
