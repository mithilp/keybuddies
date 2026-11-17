import {
	Timestamp,
	collection,
	doc,
	getDocs,
	query,
	runTransaction,
	updateDoc,
	where,
} from "firebase/firestore";
import { db } from "./firebase";

// studios and sounds both go by a random 6 digit code
const randomCode = () =>
	Math.floor(100000 + Math.random() * 900000).toString();

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

export const soundsWithCode = async (code: string) => {
	const found = await getDocs(
		query(collection(db, "sounds"), where("code", "==", code))
	);

	return found.docs;
};

// A share code no sound has yet. A sound's code is a field on it and not its
// id, so this is a look and then a write, not a transaction.
export const freeSoundCode = async () => {
	for (let attempt = 0; attempt < TRIES; attempt++) {
		const code = randomCode();

		if ((await soundsWithCode(code)).length === 0) return code;
	}

	throw new Error("Couldn't find a free sound code.");
};

// The code to share a sound with. Sounds made before codes were checked can
// have the same code as another sound, or none. One of those gets a new code
// here, so the code that's handed out only ever means this sound.
export const shareCode = async (id: string, code?: string) => {
	if (code) {
		const same = await soundsWithCode(code);
		if (same.every((sound) => sound.id === id)) return code;
	}

	const fresh = await freeSoundCode();
	await updateDoc(doc(db, "sounds", id), { code: fresh });

	return fresh;
};
