// Moves sounds from before soundList and shareCodes over to them:
//
//   node --env-file=.env.local scripts/move-sounds.ts          # says what it would do
//   node --env-file=.env.local scripts/move-sounds.ts --write  # does it
//
// It lists every sound, which firestore.rules turns down, so it only works
// while the database is still open. Run it before merging, so old studios'
// sidebars aren't empty once the new app is up. Then run it again right
// before publishing the rules, to pick up what tabs still on the old app
// saved, shared or added in between. Anything an old tab writes after that
// last run won't show in the new app.
//
// For every sound it puts the sound in the soundList of each studio in its
// `in` and makes the shareCodes doc for its code. It only adds docs: `in` stays
// on old sounds, so tabs still on the old app keep working and nothing is
// lost.
// When two old sounds have the same code the first one keeps it, and the
// other gets a new code the next time it's shared.
//
// Running it again is safe. movedSounds/{id} keeps the codes in `in` it
// already moved, so a second run only moves studios an old tab added since,
// and a sound someone took out of a studio in the new app stays out. The
// rules don't match movedSounds, so the app can't read it. A sound taken out
// in an old tab after the first run stays in the new app, since a rerun only
// adds. It can be taken out again there.
//
// `in` stays on old sounds, and anyone with a sound's share code can read
// it, so the studio codes in it are still out there until it's removed.
//
// Before writing anything it saves every sound, and every studio with its
// tracks and soundList, to backup-<time>.json in the folder it's run from.
// --backup <file> saves it somewhere else, and also works without --write.

import { initializeApp } from "firebase/app";
import {
	collection,
	doc,
	getDoc,
	getDocs,
	getFirestore,
	setDoc,
	type Firestore,
} from "firebase/firestore";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const isCode = (value: unknown): value is string =>
	typeof value === "string" && /^[0-9]{6}$/.test(value);

// Every sound, and every studio with its tracks and soundList. Only reads.
export const backup = async (db: Firestore) => {
	const all = async (path: string) =>
		Object.fromEntries(
			(await getDocs(collection(db, path))).docs.map((entry) => [
				entry.id,
				entry.data(),
			]),
		);

	const studios: Record<string, object> = {};
	for (const studio of (await getDocs(collection(db, "studios"))).docs) {
		studios[studio.id] = {
			data: studio.data(),
			tracks: await all(`studios/${studio.id}/tracks`),
			soundList: Object.keys(await all(`studios/${studio.id}/soundList`)),
		};
	}

	return { sounds: await all("sounds"), studios };
};

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
			const moved = doc(db, "movedSounds", sound.id);
			const done: string[] = (await getDoc(moved)).get("in") ?? [];
			const fresh = data.in.filter(
				(code: unknown) => typeof code === "string" && !done.includes(code),
			);

			for (const code of fresh) {
				if (!isCode(code) || !(await studioExists(code))) continue;

				counts.listed++;
				if (write) {
					await setDoc(doc(db, "studios", code, "soundList", sound.id), {});
				}
			}

			// last, so a run that stops halfway moves this sound again
			if (fresh.length > 0 && write) {
				await setDoc(moved, { in: [...done, ...fresh] });
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
	}

	return counts;
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const write = process.argv.includes("--write");
	const flag = process.argv.indexOf("--backup");
	const file =
		flag === -1
			? write
				? `backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`
				: null
			: process.argv[flag + 1];
	const project = process.env.NEXT_PUBLIC_PROJECT_ID;

	if (file === undefined || file?.startsWith("--")) {
		console.error("--backup needs a file name.");
		process.exit(1);
	}

	const db = getFirestore(
		initializeApp({
			apiKey: process.env.NEXT_PUBLIC_FIREBASE_API,
			projectId: project,
			appId: process.env.NEXT_PUBLIC_APP_ID,
		}),
	);

	if (file) {
		// wx: never writes over an older backup
		writeFileSync(file, JSON.stringify(await backup(db), null, "\t"), {
			flag: "wx",
		});
		console.log(`Saved every sound and studio in ${project} to ${file}.`);
	}

	const counts = await moveSounds(db, write);

	console.log(
		`${write ? "Moved" : "Would move"} ${counts.sounds} sounds in ${project}: ` +
			`${counts.listed} put in a studio's soundList, ` +
			`${counts.codes} share codes made, ` +
			`${counts.taken} sounds whose code another sound has.`,
	);
	if (!write) console.log("Nothing was written. Run with --write to do it.");

	process.exit(0);
}
