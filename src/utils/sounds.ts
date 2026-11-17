import { collection, deleteDoc, doc, setDoc, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import { Sound } from "./types";

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
export const copyName = (name: string) =>
	`${name} copy`.slice(0, NAME_LENGTH);

// Saves a new sound and puts it in the studio, both or neither. It gets a
// share code the first time it's shared.
export const saveSound = async (
	studio: string,
	sound: Omit<Sound, "id" | "code">
) => {
	const ref = doc(collection(db, "sounds"));
	const batch = writeBatch(db);

	const data = { ...sound };
	// firestore won't take an undefined field. a sound without steps has none.
	if (data.steps === undefined) delete data.steps;

	batch.set(ref, data);
	batch.set(doc(soundList(studio), ref.id), {});

	await batch.commit();
};

export const addSound = (studio: string, id: string) =>
	setDoc(doc(soundList(studio), id), {});

// Takes a sound out of a studio. It stays in any other studio that has it,
// and the cells that hold it keep playing it.
export const removeSound = (studio: string, id: string) =>
	deleteDoc(doc(soundList(studio), id));
