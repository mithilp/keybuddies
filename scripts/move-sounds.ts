// Moves sounds from before soundList and shareCodes over to them. Run it
// once, before publishing firestore.rules, while the database is still open:
//
//   node --env-file=.env.local scripts/move-sounds.ts          # says what it would do
//   node --env-file=.env.local scripts/move-sounds.ts --write  # does it
//
// For every sound it puts the sound in the soundList of each studio in its
// `in`, takes `in` off the sound, and makes the shareCodes doc for its code.
// When two old sounds have the same code the first one keeps it, and the
// other gets a new code the next time it's shared. Running it again is safe.

import { initializeApp } from "firebase/app";
import {
	collection,
	deleteField,
	doc,
	getDoc,
	getDocs,
	getFirestore,
	setDoc,
	updateDoc,
	type Firestore,
} from "firebase/firestore";
import { fileURLToPath } from "node:url";

const isCode = (value: unknown): value is string =>
	typeof value === "string" && /^[0-9]{6}$/.test(value);

export const moveSounds = async (db: Firestore, write: boolean) => {
	const counts = { sounds: 0, listed: 0, codes: 0, taken: 0 };
	const studios = new Map<string, boolean>();
	// codes this run has given out, so a run without --write counts the same
	const claimed = new Map<string, string>();

	const studioExists = async (code: string) => {
		if (!studios.has(code)) {
			studios.set(code, (await getDoc(doc(db, "studios", code))).exists());
		}
		return studios.get(code);
	};

	for (const sound of (await getDocs(collection(db, "sounds"))).docs) {
		counts.sounds++;
		const data = sound.data();

		if (Array.isArray(data.in)) {
			for (const code of data.in) {
				if (!isCode(code) || !(await studioExists(code))) continue;

				counts.listed++;
				if (write) {
					await setDoc(doc(db, "studios", code, "soundList", sound.id), {});
				}
			}
		}

		if (isCode(data.code)) {
			const share = doc(db, "shareCodes", data.code);

			if (!claimed.has(data.code)) {
				const owner = await getDoc(share);

				if (owner.exists()) {
					claimed.set(data.code, owner.get("sound"));
				} else {
					claimed.set(data.code, sound.id);
					counts.codes++;
					if (write) await setDoc(share, { sound: sound.id });
				}
			}

			if (claimed.get(data.code) !== sound.id) counts.taken++;
		}

		// last, so a run that stops halfway can be run again
		if ("in" in data && write) {
			await updateDoc(sound.ref, { in: deleteField() });
		}
	}

	return counts;
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const write = process.argv.includes("--write");
	const project = process.env.NEXT_PUBLIC_PROJECT_ID;

	const db = getFirestore(
		initializeApp({
			apiKey: process.env.NEXT_PUBLIC_FIREBASE_API,
			projectId: project,
			appId: process.env.NEXT_PUBLIC_APP_ID,
		})
	);

	const counts = await moveSounds(db, write);

	console.log(
		`${write ? "Moved" : "Would move"} ${counts.sounds} sounds in ${project}: ` +
			`${counts.listed} put in a studio's soundList, ` +
			`${counts.codes} share codes made, ` +
			`${counts.taken} sounds whose code another sound has.`
	);
	if (!write) console.log("Nothing was written. Run with --write to do it.");

	process.exit(0);
}
