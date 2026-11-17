// Runs against the Firestore emulator, see `npm run test:rules`. The writes
// here are the ones the app makes, copied from the code that makes them.

import {
	assertFails,
	assertSucceeds,
	initializeTestEnvironment,
	type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
	Timestamp,
	addDoc,
	arrayRemove,
	arrayUnion,
	collection,
	collectionGroup,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	orderBy,
	query,
	runTransaction,
	setDoc,
	updateDoc,
	where,
	writeBatch,
	type Firestore,
} from "firebase/firestore";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, beforeEach, describe, test } from "node:test";
import { backup, moveSounds } from "../../scripts/move-sounds.ts";

const STUDIO = "482913";
const OTHER = "751204";
const SOUND = "aB3dE5fG7hJ9kL1mN2pQ";

const empty = { type: "empty", name: "", id: "" };
const fourEmpty = () => [empty, empty, empty, empty];

const piano = [
	{ note: 60, start: 0, end: 8 },
	{ note: 64, start: 8, end: 16 },
	{ note: 67, start: 16, end: 32 },
];
const drums = [
	{ note: 1, start: 0, end: 1 },
	{ note: 4, start: 4, end: 5 },
	{ note: 3, start: 2, end: 3 },
];

let env: RulesTestEnvironment;
// a visitor, the app has no sign-in
let db: Firestore;

const asFirestore = (db: unknown) => db as Firestore;

before(async () => {
	env = await initializeTestEnvironment({
		projectId: "demo-keybuddies",
		firestore: {
			rules: readFileSync(
				new URL("../../firestore.rules", import.meta.url),
				"utf8",
			),
		},
	});
	db = asFirestore(env.unauthenticatedContext().firestore());
});

after(async () => {
	await env.cleanup();
});

beforeEach(async () => {
	await env.clearFirestore();
});

// writes that skip the rules, for what's already in the database
const seed = (path: string, data: object) =>
	env.withSecurityRulesDisabled(async (context) => {
		await setDoc(doc(asFirestore(context.firestore()), path), data);
	});

const seedStudio = (code = STUDIO, data: object = {}) =>
	seed(`studios/${code}`, {
		createdAt: Timestamp.now(),
		bpm: "120",
		...data,
	});

const seedTrack = (id: string, data: object = {}) =>
	seed(`studios/${STUDIO}/tracks/${id}`, {
		createdAt: Timestamp.now(),
		name: "Track 1",
		order: 0,
		notes: fourEmpty(),
		...data,
	});

const seedSound = (data: object = {}) =>
	seed(`sounds/${SOUND}`, {
		name: "Piano sound",
		type: "piano",
		sequence: piano,
		code: "305118",
		...data,
	});

const studio = (code = STUDIO) => doc(db, "studios", code);
const track = (id: string) => doc(db, "studios", STUDIO, "tracks", id);
const sound = () => doc(db, "sounds", SOUND);
// a sound's place in a studio's soundList
const listed = (id: string, code = STUDIO) =>
	doc(db, "studios", code, "soundList", id);

describe("studios", () => {
	test("claimStudio makes a studio in a transaction", async () => {
		const ref = studio();

		await assertSucceeds(
			runTransaction(db, async (transaction) => {
				if ((await transaction.get(ref)).exists()) return false;
				transaction.set(ref, { createdAt: Timestamp.now(), bpm: "120" });
				return true;
			}),
		);
	});

	test("joining reads a studio by its code", async () => {
		await seedStudio();
		await assertSucceeds(getDoc(studio()));
		await assertSucceeds(getDoc(studio("999999")));
	});

	test("studios can't be listed", async () => {
		await seedStudio();
		await assertFails(getDocs(collection(db, "studios")));
	});

	test("a studio needs a 6 digit code", async () => {
		const data = { createdAt: Timestamp.now(), bpm: "120" };

		for (const code of ["12345", "1234567", "abcdef", "12a456"]) {
			await assertFails(setDoc(doc(db, "studios", code), data));
		}
	});

	test("a new studio has only what claimStudio writes", async () => {
		await assertFails(
			setDoc(studio(), { createdAt: Timestamp.now(), bpm: "120", x: 1 }),
		);
		await assertFails(setDoc(studio(), { bpm: "120" }));
		await assertFails(setDoc(studio(), { createdAt: "now", bpm: "120" }));
		await assertFails(
			setDoc(studio(), { createdAt: Timestamp.now(), bpm: "999" }),
		);
		await assertFails(
			setDoc(studio(), { createdAt: Timestamp.now(), bpm: 120 }),
		);
		await assertFails(
			setDoc(studio(), {
				createdAt: Timestamp.now(),
				bpm: "120",
				library: [],
			}),
		);
	});

	test("the tempo buttons set 80, 120 or 160", async () => {
		await seedStudio();

		for (const tempo of ["80", "120", "160"]) {
			await assertSucceeds(updateDoc(studio(), { bpm: tempo }));
		}

		await assertFails(updateDoc(studio(), { bpm: "100" }));
		await assertFails(updateDoc(studio(), { bpm: 80 }));
	});

	test("loops are added to and taken out of the library", async () => {
		await seedStudio();

		// addLoop, removeLoop and keepLoops in src/utils/library.ts
		await assertSucceeds(
			updateDoc(studio(), {
				library: arrayUnion("bass_1"),
				libraryRemoved: arrayRemove("bass_1"),
			}),
		);
		await assertSucceeds(
			updateDoc(studio(), {
				library: arrayRemove("bass_1"),
				libraryRemoved: arrayUnion("bass_1"),
			}),
		);
		await assertSucceeds(
			updateDoc(studio(), {
				library: arrayUnion("piano_2", "love_story_drums"),
			}),
		);
	});

	test("the library has a size cap", async () => {
		await seedStudio();

		const ids = (length: number) =>
			Array.from({ length }, (_, i) => `loop_${i}`);

		await assertSucceeds(updateDoc(studio(), { library: ids(100) }));
		await assertFails(updateDoc(studio(), { library: ids(101) }));
		await assertSucceeds(updateDoc(studio(), { libraryRemoved: ids(100) }));
		await assertFails(updateDoc(studio(), { libraryRemoved: ids(101) }));
		await assertFails(updateDoc(studio(), { libraryRemoved: "bass_1" }));
	});

	test("createdAt doesn't change and nothing new is added", async () => {
		await seedStudio();

		await assertFails(updateDoc(studio(), { createdAt: Timestamp.now() }));
		await assertFails(updateDoc(studio(), { owner: "someone" }));
	});

	test("a studio from 2024 with odd fields still takes the app's updates", async () => {
		await seedStudio(STUDIO, { bpm: 120, owner: "old", tracks: 4 });

		await assertSucceeds(updateDoc(studio(), { bpm: "160" }));
		await assertSucceeds(
			updateDoc(studio(), { library: arrayUnion("bass_2") }),
		);
	});

	test("studios can't be deleted", async () => {
		await seedStudio();
		await assertFails(deleteDoc(studio()));
	});
});

describe("tracks", () => {
	const newTrack = (i: number) => ({
		createdAt: Timestamp.now(),
		name: `Track ${i + 1}`,
		order: i,
		notes: fourEmpty(),
	});

	// createStudio and the New Track button now, an empty track 8 bars long
	const clipTrack = (i: number) => ({
		createdAt: Timestamp.now(),
		name: `Track ${i + 1}`,
		order: i,
		notes: [],
		bars: 8,
	});

	test("a new studio gets its four tracks", async () => {
		await seedStudio();

		for (let i = 0; i < 4; i++) {
			await assertSucceeds(
				addDoc(collection(db, `studios/${STUDIO}/tracks`), newTrack(i)),
			);
			await assertSucceeds(
				addDoc(collection(db, `studios/${STUDIO}/tracks`), clipTrack(i)),
			);
		}
	});

	test("the studio page reads its tracks in order", async () => {
		await seedStudio();
		await seedTrack("t1");

		await assertSucceeds(
			getDocs(
				query(collection(db, `studios/${STUDIO}/tracks`), orderBy("order")),
			),
		);
	});

	test("tracks only go in a studio that's there", async () => {
		await assertFails(
			addDoc(collection(db, `studios/${STUDIO}/tracks`), newTrack(0)),
		);
		await assertFails(
			addDoc(collection(db, "studios/abc/tracks"), newTrack(0)),
		);
	});

	test("a new track has the app's shape", async () => {
		await seedStudio();
		const tracks = collection(db, `studios/${STUDIO}/tracks`);

		await assertFails(addDoc(tracks, { ...newTrack(0), muted: true }));
		await assertFails(addDoc(tracks, { ...newTrack(0), name: "" }));
		await assertFails(
			addDoc(tracks, { ...newTrack(0), name: "x".repeat(101) }),
		);
		await assertFails(addDoc(tracks, { ...newTrack(0), order: "0" }));
		await assertFails(addDoc(tracks, { ...newTrack(0), order: -1 }));
		await assertFails(addDoc(tracks, { ...newTrack(0), order: 1001 }));
		await assertFails(addDoc(tracks, { ...newTrack(0), createdAt: "now" }));
		await assertFails(addDoc(tracks, { ...newTrack(0), notes: "none" }));
		await assertFails(
			addDoc(tracks, {
				...newTrack(0),
				notes: Array.from({ length: 2001 }, () => empty),
			}),
		);
		await assertSucceeds(addDoc(tracks, { ...clipTrack(0), bars: 0 }));
		await assertSucceeds(addDoc(tracks, { ...clipTrack(0), bars: 2000 }));
		await assertFails(addDoc(tracks, { ...clipTrack(0), bars: 2001 }));
		await assertFails(addDoc(tracks, { ...clipTrack(0), bars: -1 }));
		await assertFails(addDoc(tracks, { ...clipTrack(0), bars: "8" }));
		await assertFails(addDoc(tracks, { ...clipTrack(0), bars: 1.5 }));
	});

	test("cells are set, added and taken out in transactions", async () => {
		await seedStudio();
		await seedTrack("t1");
		const ref = track("t1");

		// setCell, addCell and removeCell from before clips had lengths. a tab
		// that hasn't reloaded since still writes these.
		const edit = (change: (cells: (typeof empty)[]) => object[]) =>
			runTransaction(db, async (transaction) => {
				const snapshot = await transaction.get(ref);
				if (!snapshot.exists()) return;
				transaction.update(ref, { notes: change(snapshot.data().notes) });
			});

		await assertSucceeds(
			edit((cells) =>
				cells.map((old, i) =>
					i === 0 ? { type: "loop", name: "Bass 1", id: "bass_1" } : old,
				),
			),
		);
		await assertSucceeds(
			edit((cells) =>
				cells.map((old, i) =>
					i === 1 ? { type: "sound", name: "Piano sound", id: SOUND } : old,
				),
			),
		);
		await assertSucceeds(edit((cells) => [...cells, empty]));
		await assertSucceeds(edit((cells) => cells.filter((_, i) => i !== 2)));
	});

	test("clips are put in, resized and taken out in transactions", async () => {
		await seedStudio();
		await seedTrack("t1");
		const ref = track("t1");

		// editTrack in src/utils/track-edits.ts, which writes an old track
		// the new way the first time it changes
		const edit = (notes: object[], bars: number) =>
			runTransaction(db, async (transaction) => {
				const snapshot = await transaction.get(ref);
				if (!snapshot.exists()) return;
				transaction.update(ref, { notes, bars });
			});
		const bass = { type: "loop", name: "Bass 1", id: "bass_1" };
		const hum = { type: "sound", name: "Piano sound", id: SOUND };

		await assertSucceeds(edit([{ ...bass, start: 0, bars: 2 }], 8));
		await assertSucceeds(
			edit(
				[
					{ ...bass, start: 0, bars: 1 },
					{ ...hum, start: 6, bars: 4 },
				],
				10,
			),
		);
		await assertSucceeds(edit([{ ...hum, start: 6, bars: 4 }], 10));
		await assertSucceeds(edit([{ ...hum, start: 6, bars: 4 }], 11));
		await assertSucceeds(edit([], 0));
	});

	test("a track's length is a whole number of bars", async () => {
		await seedStudio();
		await seedTrack("t1", { notes: [], bars: 8 });

		await assertSucceeds(updateDoc(track("t1"), { bars: 9 }));
		await assertSucceeds(updateDoc(track("t1"), { bars: 2000 }));
		await assertFails(updateDoc(track("t1"), { bars: 2001 }));
		await assertFails(updateDoc(track("t1"), { bars: -1 }));
		await assertFails(updateDoc(track("t1"), { bars: "9" }));
		await assertFails(updateDoc(track("t1"), { bars: 8.5 }));
	});

	test("only the clips of a track change", async () => {
		await seedStudio();
		await seedTrack("t1");

		await assertFails(updateDoc(track("t1"), { name: "Renamed" }));
		await assertFails(updateDoc(track("t1"), { order: 3 }));
		await assertFails(updateDoc(track("t1"), { createdAt: Timestamp.now() }));
		await assertFails(updateDoc(track("t1"), { notes: { 0: empty } }));
	});

	test("a track's cells have a cap", async () => {
		await seedStudio();
		await seedTrack("t1");
		const cells = (length: number) => Array.from({ length }, () => empty);

		await assertSucceeds(updateDoc(track("t1"), { notes: cells(2000) }));
		await assertFails(updateDoc(track("t1"), { notes: cells(2001) }));
	});

	test("a track from 2024 with odd fields still takes cell edits", async () => {
		await seedStudio();
		await seedTrack("t1", { instrument: "piano", order: "0" });

		await assertSucceeds(
			updateDoc(track("t1"), { notes: [...fourEmpty(), empty] }),
		);
		await assertSucceeds(updateDoc(track("t1"), { notes: [], bars: 8 }));
	});

	test("tracks are deleted with their delete button", async () => {
		await seedStudio();
		await seedTrack("t1");

		await assertSucceeds(deleteDoc(track("t1")));
	});
});

describe("sounds", () => {
	// saveSound in src/utils/sounds.ts, from Piano and Drum save and from
	// Duplicate in SoundButtons
	const newSound = (data: object = {}) => ({
		name: "Piano sound",
		type: "piano",
		sequence: piano,
		...data,
	});

	const saveSound = (data: object, code = STUDIO) => {
		const ref = doc(collection(db, "sounds"));
		const batch = writeBatch(db);
		batch.set(ref, data);
		batch.set(listed(ref.id, code), {});
		return batch.commit();
	};

	// shareCode in src/utils/codes.ts
	const share = (code: string, id = SOUND) =>
		runTransaction(db, async (transaction) => {
			const ref = doc(db, "shareCodes", code);
			if ((await transaction.get(ref)).exists()) return false;
			transaction.set(ref, { sound: id });
			transaction.update(doc(db, "sounds", id), { code });
			return true;
		});

	test("piano and drum sounds are saved into their studio, and copied", async () => {
		await seedStudio();

		await assertSucceeds(saveSound(newSound()));
		await assertSucceeds(
			saveSound(
				newSound({
					name: "Drum beat",
					type: "drum",
					sequence: drums,
					steps: 32,
				}),
			),
		);
		await assertSucceeds(saveSound(newSound({ name: "Piano sound copy" })));
		await assertSucceeds(saveSound(newSound({ sequence: [] })));
	});

	test("drum sounds can say how many steps they have", async () => {
		await seedStudio();
		const drum = { name: "Drum beat", type: "drum", sequence: drums };

		await assertSucceeds(saveSound(newSound({ ...drum, steps: 16 })));
		await assertSucceeds(saveSound(newSound({ ...drum, steps: 32 })));
		await assertFails(saveSound(newSound({ ...drum, steps: 17 })));
		await assertFails(saveSound(newSound({ steps: 16 })));
		// 64 is a 4 bar beat, which says so
		await assertFails(saveSound(newSound({ ...drum, steps: 64 })));
	});

	test("piano and drum sounds can be 1, 2 or 4 bars", async () => {
		await seedStudio();
		const drum = { name: "Drum beat", type: "drum", sequence: drums };

		// Piano and Drum save
		await assertSucceeds(saveSound(newSound({ bars: 1 })));
		await assertSucceeds(saveSound(newSound({ bars: 2 })));
		await assertSucceeds(saveSound(newSound({ bars: 4 })));
		await assertSucceeds(saveSound(newSound({ ...drum, steps: 16, bars: 1 })));
		await assertSucceeds(saveSound(newSound({ ...drum, steps: 32, bars: 2 })));
		await assertSucceeds(saveSound(newSound({ ...drum, steps: 64, bars: 4 })));

		await assertFails(saveSound(newSound({ bars: 3 })));
		await assertFails(saveSound(newSound({ bars: 0 })));
		await assertFails(saveSound(newSound({ bars: "2" })));
		// a beat's steps go with its length
		await assertFails(saveSound(newSound({ ...drum, steps: 32, bars: 1 })));
		await assertFails(saveSound(newSound({ ...drum, steps: 16, bars: 4 })));
		await assertFails(saveSound(newSound({ steps: 64, bars: 4 })));
	});

	test("a sound's length doesn't change", async () => {
		await seedSound({ type: "drum", sequence: drums, steps: 64, bars: 4 });

		await assertFails(updateDoc(sound(), { bars: 2 }));
		await assertFails(updateDoc(sound(), { steps: 32 }));
		await assertSucceeds(updateDoc(sound(), { sequence: drums }));
	});

	test("a new sound has the app's shape", async () => {
		await seedStudio();
		const sounds = collection(db, "sounds");

		await assertSucceeds(addDoc(sounds, newSound()));
		await assertFails(addDoc(sounds, newSound({ type: "guitar" })));
		await assertFails(addDoc(sounds, newSound({ name: "" })));
		await assertFails(addDoc(sounds, newSound({ name: "x".repeat(201) })));
		await assertFails(addDoc(sounds, newSound({ sequence: "C D E" })));
		await assertFails(
			addDoc(
				sounds,
				newSound({
					sequence: Array.from({ length: 5001 }, () => piano[0]),
				}),
			),
		);
		await assertFails(addDoc(sounds, newSound({ owner: "someone" })));
		// the code comes from sharing, and studios keep their own list
		await assertFails(addDoc(sounds, newSound({ code: "305118" })));
		await assertFails(addDoc(sounds, newSound({ in: [STUDIO] })));
	});

	test("sounds are only read by id", async () => {
		await seedStudio();
		await seedSound();
		await seed(`studios/${STUDIO}/soundList/${SOUND}`, {});

		await assertSucceeds(getDoc(sound()));
		await assertFails(getDocs(collection(db, "sounds")));
		await assertFails(
			getDocs(query(collection(db, "sounds"), where("code", "==", "305118"))),
		);
		await assertFails(
			getDocs(
				query(collection(db, "sounds"), where("in", "array-contains", STUDIO)),
			),
		);
	});

	test("a studio's sounds are listed by its code, and only that way", async () => {
		await seedStudio();
		await seedSound();
		await seed(`studios/${STUDIO}/soundList/${SOUND}`, {});

		await assertSucceeds(
			getDocs(collection(db, "studios", STUDIO, "soundList")),
		);
		await assertFails(getDocs(collectionGroup(db, "soundList")));
		await assertFails(getDocs(collectionGroup(db, "tracks")));
		await assertFails(getDocs(collection(db, "studios", "abc", "soundList")));
	});

	test("a sound is added to a studio by code and taken out of one", async () => {
		await seedStudio();
		await seedStudio(OTHER);
		await seedSound();
		await seed(`studios/${STUDIO}/soundList/${SOUND}`, {});

		// addSound, and adding one the studio already has
		await assertSucceeds(setDoc(listed(SOUND, OTHER), {}));
		await assertSucceeds(setDoc(listed(SOUND, OTHER), {}));
		// removeSound, the delete button in SoundButtons
		await assertSucceeds(deleteDoc(listed(SOUND, STUDIO)));
		await assertSucceeds(deleteDoc(listed(SOUND, OTHER)));
	});

	test("only sounds that are there go in studios that are there", async () => {
		await seedStudio();
		await seedSound();

		await assertFails(setDoc(listed("missing", STUDIO), {}));
		await assertFails(setDoc(listed(SOUND, OTHER), {}));
		await assertFails(setDoc(listed(SOUND, "abc"), {}));
		await assertFails(setDoc(listed(SOUND, STUDIO), { name: "x" }));
		await assertFails(saveSound(newSound({ name: "Piano sound" }), "999999"));
	});

	test("a sound's notes are edited", async () => {
		await seedSound();

		// EditPianoSound
		await assertSucceeds(
			updateDoc(sound(), {
				sequence: [...piano, { note: 72, start: 32, end: 40 }],
			}),
		);
		await assertFails(updateDoc(sound(), { sequence: "C D E" }));
		await assertSucceeds(
			updateDoc(sound(), {
				sequence: Array.from({ length: 5000 }, () => piano[0]),
			}),
		);
		await assertFails(
			updateDoc(sound(), {
				sequence: Array.from({ length: 5001 }, () => piano[0]),
			}),
		);
		await assertSucceeds(updateDoc(sound(), { steps: 32 }));
		await assertFails(updateDoc(sound(), { steps: 8 }));
	});

	test("sharing takes a code and puts it on the sound", async () => {
		// a new sound has no code until it's shared
		await seed(`sounds/${SOUND}`, newSound());

		await assertSucceeds(share("618204"));
		// AddSound looks it up
		await assertSucceeds(getDoc(doc(db, "shareCodes", "618204")));
	});

	test("a share code only ever means one sound", async () => {
		const OTHER_SOUND = "zZ9yY8xX7wW6vV5uU4tT";
		await seedSound();
		await seed(`sounds/${OTHER_SOUND}`, {
			name: "Drum beat",
			type: "drum",
			sequence: drums,
		});
		await seed("shareCodes/305118", { sound: SOUND });

		// the code goes on the sound with its shareCodes doc, not alone
		await assertFails(updateDoc(sound(), { code: "618204" }));
		await assertFails(
			setDoc(doc(db, "shareCodes", "618204"), { sound: SOUND }),
		);
		// a code that's taken can't be taken again or given to another sound
		await assertFails(
			runTransaction(db, async (transaction) => {
				transaction.set(doc(db, "shareCodes", "305118"), {
					sound: OTHER_SOUND,
				});
				transaction.update(doc(db, "sounds", OTHER_SOUND), {
					code: "305118",
				});
			}),
		);
		await assertFails(
			updateDoc(doc(db, "sounds", OTHER_SOUND), { code: "305118" }),
		);
		await assertFails(
			setDoc(doc(db, "shareCodes", "305118"), { sound: OTHER_SOUND }),
		);
		await assertFails(deleteDoc(doc(db, "shareCodes", "305118")));
		// and it has to be a code
		await assertFails(share("61820", OTHER_SOUND));
		// for a sound id of at most 100 characters
		const LONG = "x".repeat(101);
		await seed(`sounds/${LONG}`, newSound());
		await assertFails(share("402917", LONG));
		await assertSucceeds(share("618204", OTHER_SOUND));
	});

	test("share codes are looked up one at a time", async () => {
		await seedSound();
		await seed("shareCodes/305118", { sound: SOUND });

		await assertSucceeds(getDoc(doc(db, "shareCodes", "305118")));
		await assertSucceeds(getDoc(doc(db, "shareCodes", "999999")));
		await assertFails(getDocs(collection(db, "shareCodes")));
	});

	test("a sound's name and type don't change", async () => {
		await seedSound();

		await assertFails(updateDoc(sound(), { name: "Renamed" }));
		await assertFails(updateDoc(sound(), { type: "drum" }));
		await assertFails(updateDoc(sound(), { owner: "someone" }));
		await assertFails(updateDoc(sound(), { in: arrayUnion(STUDIO) }));
	});

	// old sounds keep their `in` after scripts/move-sounds.ts
	test("a sound from 2024 with odd fields still gets a code and a studio", async () => {
		await seedStudio();
		await seedStudio(OTHER);
		await seed(`sounds/${SOUND}`, {
			name: "old one",
			type: "piano",
			sequence: piano,
			in: [STUDIO],
			code: "305118",
			createdAt: Timestamp.now(),
		});

		await assertSucceeds(share("618204"));
		await assertSucceeds(setDoc(listed(SOUND, OTHER), {}));
		await assertSucceeds(updateDoc(sound(), { sequence: drums }));
		await assertSucceeds(updateDoc(sound(), { steps: 32 }));
		await assertSucceeds(deleteDoc(listed(SOUND, OTHER)));
		// but `in` itself is closed
		await assertFails(updateDoc(sound(), { in: arrayUnion(OTHER) }));
		await assertFails(updateDoc(sound(), { in: arrayRemove(STUDIO) }));
	});

	test("sounds can't be deleted", async () => {
		await seedSound();
		await assertFails(deleteDoc(sound()));
	});
});

describe("moving old sounds", () => {
	// sound ids sort in this order, so A is moved first
	const A = "aaaaaaaaaaaaaaaaaaa1";
	const B = "bbbbbbbbbbbbbbbbbbb2";
	const C = "ccccccccccccccccccc3";
	const THIRD = "390117";

	const seedOld = async () => {
		await seedStudio();
		await seedStudio(OTHER);
		const old = { name: "old", type: "piano", sequence: piano };
		await seed(`sounds/${A}`, {
			...old,
			in: [STUDIO, OTHER, "999999", "abc"],
			code: "305118",
		});
		// an old sound that got the same code as A
		await seed(`sounds/${B}`, { ...old, in: [STUDIO], code: "305118" });
		// from before `in` and codes
		await seed(`sounds/${C}`, old);
	};

	// the script runs while the database is still open
	const open = <T>(work: (db: Firestore) => Promise<T>) => {
		let result: T | undefined;
		return env
			.withSecurityRulesDisabled(async (context) => {
				result = await work(asFirestore(context.firestore()));
			})
			.then(() => result!);
	};

	const run = (write: boolean) => open((db) => moveSounds(db, write));

	const ids = async (code: string) =>
		(await getDocs(collection(db, "studios", code, "soundList"))).docs
			.map((entry) => entry.id)
			.sort();

	test("without --write nothing changes", async () => {
		await seedOld();

		assert.deepEqual(await run(false), {
			sounds: 3,
			listed: 3,
			codes: 1,
			taken: 1,
		});
		assert.deepEqual(await ids(STUDIO), []);
		assert.equal(
			(await getDoc(doc(db, "shareCodes", "305118"))).exists(),
			false,
		);
	});

	test("sounds go in their studios' lists and take their codes", async () => {
		await seedOld();

		assert.deepEqual(await run(true), {
			sounds: 3,
			listed: 3,
			codes: 1,
			taken: 1,
		});

		assert.deepEqual(await ids(STUDIO), [A, B]);
		assert.deepEqual(await ids(OTHER), [A]);
		assert.deepEqual((await getDoc(doc(db, "shareCodes", "305118"))).data(), {
			sound: A,
		});

		// nothing is taken off the old sounds
		const a = (await getDoc(doc(db, "sounds", A))).data();
		assert.deepEqual(a?.in, [STUDIO, OTHER, "999999", "abc"]);
		assert.equal(a?.code, "305118");
		assert.deepEqual((await getDoc(doc(db, "sounds", B))).data()?.in, [STUDIO]);

		// B gets a code of its own when it's shared
		await assertSucceeds(
			runTransaction(db, async (transaction) => {
				transaction.set(doc(db, "shareCodes", "618204"), { sound: B });
				transaction.update(doc(db, "sounds", B), { code: "618204" });
			}),
		);

		// a second run has nothing left to do
		assert.deepEqual(await run(true), {
			sounds: 3,
			listed: 0,
			codes: 0,
			taken: 0,
		});
		assert.deepEqual(await ids(STUDIO), [A, B]);
		assert.deepEqual(await ids(OTHER), [A]);
	});

	test("a second run leaves out sounds taken out of a studio", async () => {
		await seedOld();
		await seedStudio(THIRD);
		await run(true);

		// removeSound in the new app
		await assertSucceeds(deleteDoc(listed(A, OTHER)));
		// an old tab's addSound, before the rules are published
		await open((db) =>
			updateDoc(doc(db, "sounds", A), { in: arrayUnion(THIRD) }),
		);

		assert.deepEqual(await run(false), {
			sounds: 3,
			listed: 1,
			codes: 0,
			taken: 1,
		});
		assert.deepEqual(await run(true), {
			sounds: 3,
			listed: 1,
			codes: 0,
			taken: 1,
		});
		assert.deepEqual(await ids(STUDIO), [A, B]);
		assert.deepEqual(await ids(OTHER), []);
		assert.deepEqual(await ids(THIRD), [A]);
	});

	test("moved sounds take the app's updates", async () => {
		await seedOld();
		await run(true);

		await assertSucceeds(
			updateDoc(doc(db, "sounds", A), { sequence: [...piano, piano[0]] }),
		);
		await assertSucceeds(setDoc(listed(C, OTHER), {}));
		await assertSucceeds(deleteDoc(listed(B, STUDIO)));
		// the script's notes are closed to the app
		await assertFails(getDoc(doc(db, "movedSounds", A)));
		await assertFails(setDoc(doc(db, "movedSounds", A), { in: [] }));
	});

	test("the backup has every sound and studio and writes nothing", async () => {
		await seedOld();
		await seedTrack("t1");
		await seed(`studios/${STUDIO}/soundList/${A}`, {});

		const saved = JSON.parse(JSON.stringify(await open(backup)));

		assert.deepEqual(Object.keys(saved.sounds).sort(), [A, B, C]);
		assert.deepEqual(saved.sounds[A].in, [STUDIO, OTHER, "999999", "abc"]);
		assert.deepEqual(Object.keys(saved.studios).sort(), [STUDIO, OTHER].sort());
		assert.equal(saved.studios[STUDIO].data.bpm, "120");
		assert.deepEqual(Object.keys(saved.studios[STUDIO].tracks), ["t1"]);
		assert.equal(saved.studios[STUDIO].tracks.t1.name, "Track 1");
		assert.deepEqual(saved.studios[STUDIO].soundList, [A]);
		assert.deepEqual(saved.studios[OTHER].tracks, {});

		assert.deepEqual(await ids(OTHER), []);
		assert.equal(
			(await getDoc(doc(db, "shareCodes", "305118"))).exists(),
			false,
		);
	});
});

describe("everything else", () => {
	test("paths the app doesn't use are closed", async () => {
		await seedStudio();

		await assertFails(getDoc(doc(db, "users", "someone")));
		await assertFails(setDoc(doc(db, "users", "someone"), { a: 1 }));
		await assertFails(getDocs(collection(db, "anything")));
		// sounds used to live under the studio in early 2024
		await assertFails(getDoc(doc(db, `studios/${STUDIO}/sounds/old`)));
		await assertFails(
			setDoc(doc(db, `studios/${STUDIO}/sounds/old`), { name: "x" }),
		);
		await assertFails(
			setDoc(doc(db, `studios/${STUDIO}/tracks/t1/more/x`), { a: 1 }),
		);
	});
});
