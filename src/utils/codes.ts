import { Timestamp, doc, getDoc, runTransaction } from "firebase/firestore";
import { db } from "./firebase";

// studios and sounds both go by a random 6 digit code
const randomCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// how many codes to try before giving up. with 900000 of them a second try
// is already rare.
const TRIES = 10;

// Makes a studio under a code nobody has and comes back with the code, or
// null if every try was taken. Checking the code and writing the studio are
// one transaction, so two studios made at the same moment can't land on the
// same code and one can't reset the other.
export const claimStudio = async () => {
	for (let attempt = 0; attempt < TRIES; attempt++) {
		const code = randomCode();
		const studio = doc(db, "studios", code);

		const claimed = await runTransaction(db, async (transaction) => {
			if ((await transaction.get(studio)).exists()) return false;

			transaction.set(studio, { createdAt: Timestamp.now(), bpm: "120" });
			return true;
		});

		if (claimed) return code;
	}

	return null;
};

// A share code is a doc of its own, shareCodes/{code}, holding the id of the
// sound it's for. Sounds can't be listed, so this is how a code is looked up.
// Comes back with the sound's id, or null if no sound has the code.
export const soundWithCode = async (code: string) => {
	const found = await getDoc(doc(db, "shareCodes", code));

	return found.exists() ? (found.get("sound") as string) : null;
};

// The code to share a sound with. A new sound has none until it's first
// shared. One from before share codes were docs, or one whose code another
// old sound took, gets a new one here, so the code that's handed out only
// ever means this sound. Taking the code and writing it on the sound are one
// transaction, the same as claimStudio.
export const shareCode = async (id: string, code?: string) => {
	if (code && (await soundWithCode(code)) === id) return code;

	const sound = doc(db, "sounds", id);

	for (let attempt = 0; attempt < TRIES; attempt++) {
		const fresh = randomCode();
		const share = doc(db, "shareCodes", fresh);

		const claimed = await runTransaction(db, async (transaction) => {
			if ((await transaction.get(share)).exists()) return false;

			transaction.set(share, { sound: id });
			transaction.update(sound, { code: fresh });
			return true;
		});

		if (claimed) return fresh;
	}

	throw new Error("Couldn't find a free sound code.");
};
