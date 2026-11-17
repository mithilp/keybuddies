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
	type Firestore,
} from "firebase/firestore";
import { readFileSync } from "node:fs";
import { after, before, beforeEach, describe, test } from "node:test";

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
		in: [STUDIO],
		code: "305118",
		...data,
	});

const studio = (code = STUDIO) => doc(db, "studios", code);
const track = (id: string) => doc(db, "studios", STUDIO, "tracks", id);
const sound = () => doc(db, "sounds", SOUND);

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

		const tooMany = Array.from({ length: 101 }, (_, i) => `loop_${i}`);
		await assertFails(updateDoc(studio(), { library: tooMany }));
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

	test("a new studio gets its four tracks", async () => {
		await seedStudio();

		for (let i = 0; i < 4; i++) {
			await assertSucceeds(
				addDoc(collection(db, `studios/${STUDIO}/tracks`), newTrack(i)),
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
		await assertFails(addDoc(tracks, { ...newTrack(0), notes: "none" }));
		await assertFails(
			addDoc(tracks, {
				...newTrack(0),
				notes: Array.from({ length: 1001 }, () => empty),
			}),
		);
	});

	test("cells are set, added and taken out in transactions", async () => {
		await seedStudio();
		await seedTrack("t1");
		const ref = track("t1");

		// setCell, addCell and removeCell in src/utils/cells.ts
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

	test("only the cells of a track change", async () => {
		await seedStudio();
		await seedTrack("t1");

		await assertFails(updateDoc(track("t1"), { name: "Renamed" }));
		await assertFails(updateDoc(track("t1"), { order: 3 }));
		await assertFails(updateDoc(track("t1"), { createdAt: Timestamp.now() }));
		await assertFails(updateDoc(track("t1"), { notes: { 0: empty } }));
	});

	test("a track from 2024 with odd fields still takes cell edits", async () => {
		await seedStudio();
		await seedTrack("t1", { instrument: "piano", order: "0" });

		await assertSucceeds(
			updateDoc(track("t1"), { notes: [...fourEmpty(), empty] }),
		);
	});

	test("tracks are deleted with their delete button", async () => {
		await seedStudio();
		await seedTrack("t1");

		await assertSucceeds(deleteDoc(track("t1")));
	});
});

describe("sounds", () => {
	// Piano and Drum save, and Duplicate in SoundButtons
	const newSound = (data: object = {}) => ({
		name: "Piano sound",
		type: "piano",
		sequence: piano,
		in: [STUDIO],
		code: "305118",
		...data,
	});

	test("piano and drum sounds are saved, and copied", async () => {
		await seedStudio();
		const sounds = collection(db, "sounds");

		await assertSucceeds(addDoc(sounds, newSound()));
		await assertSucceeds(
			addDoc(
				sounds,
				newSound({ name: "Drum beat", type: "drum", sequence: drums }),
			),
		);
		await assertSucceeds(
			addDoc(sounds, newSound({ name: "Piano sound copy" })),
		);
		await assertSucceeds(addDoc(sounds, newSound({ sequence: [] })));
	});

	test("drum sounds can say how many steps they have", async () => {
		await seedStudio();
		const sounds = collection(db, "sounds");
		const drum = { name: "Drum beat", type: "drum", sequence: drums };

		await assertSucceeds(addDoc(sounds, newSound({ ...drum, steps: 16 })));
		await assertSucceeds(addDoc(sounds, newSound({ ...drum, steps: 32 })));
		await assertFails(addDoc(sounds, newSound({ ...drum, steps: 17 })));
		await assertFails(addDoc(sounds, newSound({ steps: 16 })));
	});

	test("a new sound has the app's shape", async () => {
		await seedStudio();
		await seedStudio(OTHER);
		const sounds = collection(db, "sounds");

		await assertFails(addDoc(sounds, newSound({ type: "guitar" })));
		await assertFails(addDoc(sounds, newSound({ name: "" })));
		await assertFails(addDoc(sounds, newSound({ name: "x".repeat(201) })));
		await assertFails(addDoc(sounds, newSound({ code: "12345" })));
		await assertFails(addDoc(sounds, newSound({ code: 305118 })));
		await assertFails(addDoc(sounds, newSound({ in: [STUDIO, OTHER] })));
		await assertFails(addDoc(sounds, newSound({ in: [] })));
		await assertFails(addDoc(sounds, newSound({ in: ["999999"] })));
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

		const noCode: Record<string, unknown> = newSound();
		delete noCode.code;
		await assertFails(addDoc(sounds, noCode));
	});

	test("sounds are read by id, by code and by studio", async () => {
		await seedSound();

		await assertSucceeds(getDoc(sound()));
		await assertSucceeds(
			getDocs(query(collection(db, "sounds"), where("code", "==", "305118"))),
		);
		await assertSucceeds(
			getDocs(
				query(collection(db, "sounds"), where("in", "array-contains", STUDIO)),
			),
		);
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
		await assertSucceeds(updateDoc(sound(), { steps: 32 }));
		await assertFails(updateDoc(sound(), { steps: 8 }));
	});

	test("sharing gives a sound a new code", async () => {
		await seedSound();

		await assertSucceeds(updateDoc(sound(), { code: "618204" }));
		await assertFails(updateDoc(sound(), { code: "61820" }));
	});

	test("a sound is added to a studio by code and taken out of one", async () => {
		await seedStudio();
		await seedStudio(OTHER);
		await seedSound();

		// AddSound
		await assertSucceeds(updateDoc(sound(), { in: arrayUnion(OTHER) }));
		// the delete button in SoundButtons
		await assertSucceeds(updateDoc(sound(), { in: arrayRemove(STUDIO) }));
		await assertSucceeds(updateDoc(sound(), { in: arrayRemove(OTHER) }));
	});

	test("a sound only goes into studios that are there, one at a time", async () => {
		await seedStudio();
		await seedStudio(OTHER);
		await seedSound({ in: [] });

		await assertFails(updateDoc(sound(), { in: arrayUnion("999999") }));
		await assertFails(updateDoc(sound(), { in: arrayUnion("abc") }));
		await assertFails(updateDoc(sound(), { in: arrayUnion(STUDIO, OTHER) }));
		await assertFails(updateDoc(sound(), { in: STUDIO }));
	});

	test("a sound's name and type don't change", async () => {
		await seedSound();

		await assertFails(updateDoc(sound(), { name: "Renamed" }));
		await assertFails(updateDoc(sound(), { type: "drum" }));
		await assertFails(updateDoc(sound(), { owner: "someone" }));
	});

	test("a sound from 2024 with odd fields still gets a code and a studio", async () => {
		await seedStudio(OTHER);
		await seed(`sounds/${SOUND}`, {
			name: "old one",
			type: "piano",
			sequence: piano,
			in: [STUDIO],
			createdAt: Timestamp.now(),
		});

		await assertSucceeds(updateDoc(sound(), { code: "618204" }));
		await assertSucceeds(updateDoc(sound(), { in: arrayUnion(OTHER) }));
	});

	test("a sound from before `in` can still be added to a studio", async () => {
		await seedStudio();
		await seed(`sounds/${SOUND}`, {
			name: "older one",
			type: "drum",
			sequence: drums,
		});

		await assertSucceeds(updateDoc(sound(), { in: arrayUnion(STUDIO) }));
	});

	test("sounds can't be deleted", async () => {
		await seedSound();
		await assertFails(deleteDoc(sound()));
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
