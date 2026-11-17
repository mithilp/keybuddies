import {
	collection,
	deleteDoc,
	doc,
	onSnapshot,
	setDoc,
	updateDoc,
	writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import { Key, Sound } from "./types";

// A sound lives at sounds/{id}, and a studio has it when there's an empty
// doc for it at studios/{code}/soundList/{id}. The rules only let a sound be
// read by its id, so the studio's list is how its sidebar finds them.
//
// Sounds made before this kept the codes of their studios in an `in` field.
// scripts/move-sounds.ts moves those over.

export const soundList = (studio: string) =>
	collection(db, "studios", studio, "soundList");

// The longest name the rules take. The naming dialogs stop there.
export const NAME_LENGTH = 200;

// "Piano sound copy", cut to fit
export const copyName = (name: string) => `${name} copy`.slice(0, NAME_LENGTH);

// Saves a new sound and puts it in the studio, both or neither. It gets a
// share code the first time it's shared.
export const saveSound = async (
	studio: string,
	sound: Omit<Sound, "id" | "code">
) => {
	const ref = doc(collection(db, "sounds"));
	const batch = writeBatch(db);

	const data = { ...sound };
	// firestore won't take an undefined field. a sound without steps or a
	// length has none.
	if (data.steps === undefined) delete data.steps;
	if (data.bars === undefined) delete data.bars;

	batch.set(ref, data);
	batch.set(doc(soundList(studio), ref.id), {});

	await batch.commit();
};

export const addSound = (studio: string, id: string) =>
	setDoc(doc(soundList(studio), id), {});

// Takes a sound out of a studio. It stays in any other studio that has it,
// and the clips that hold it keep playing it.
export const removeSound = (studio: string, id: string) =>
	deleteDoc(doc(soundList(studio), id));

// A sound gets a new recording. Its name, type and length stay.
export const updateSequence = (id: string, sequence: Key[]) =>
	updateDoc(doc(db, "sounds", id), { sequence: sequence });

// Listens to every sound in a studio. The studio's list says which sounds it
// has, and each sound is listened to by its id so an edit to one shows up.
// `change` waits until the list and every sound in it have answered, so the
// sounds don't come in one at a time. Gives back what stops all of it.
export const listenSounds = (
	studio: string,
	change: (sounds: Sound[]) => void,
	failed: (error: Error) => void
) => {
	let ids: string[] | null = null;
	const listening = new Map<string, () => void>();
	const answered = new Map<string, Sound | null>();

	const show = () => {
		if (!ids || ids.some((id) => !answered.has(id))) return;

		change(
			ids.flatMap((id) => {
				const sound = answered.get(id);
				return sound ? [sound] : [];
			})
		);
	};

	const listen = (id: string) =>
		onSnapshot(
			doc(db, "sounds", id),
			(sound) => {
				const data = sound.data();

				answered.set(
					id,
					data
						? {
								name: data.name,
								type: data.type,
								sequence: data.sequence,
								id: sound.id,
								code: data.code,
								steps: data.steps,
								bars: data.bars,
							}
						: null
				);
				show();
			},
			failed
		);

	const listUnsub = onSnapshot(
		soundList(studio),
		(list) => {
			const listed = list.docs.map((entry) => entry.id);
			ids = listed;

			for (const id of listed) {
				if (!listening.has(id)) listening.set(id, listen(id));
			}

			// sounds that were taken out of the studio
			for (const [id, unsub] of listening) {
				if (listed.includes(id)) continue;

				unsub();
				listening.delete(id);
				answered.delete(id);
			}

			show();
		},
		failed
	);

	return () => {
		listUnsub();
		listening.forEach((unsub) => unsub());
	};
};
