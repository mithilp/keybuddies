"use client";

import { doc, getDoc } from "firebase/firestore";
import crunker from "./crunker";
import { db } from "./firebase";
import { renderSound } from "./instruments";
import { Cell, Track } from "./types";

export type RenderedTrack = { track: string; buffer: AudioBuffer };

// an error whose message is written for whoever pressed play
export class SongError extends Error {}

// Renders every track of a song into its own buffer. Nothing plays here, so
// whoever calls this can start all the tracks at the same moment.
// Tracks with no cells are left out. Throws a SongError naming the cell that
// couldn't be built.
export const renderSong = async (
	tracks: Track[],
	bpm: string
): Promise<RenderedTrack[]> => {
	if (!crunker) {
		throw new SongError("This browser can't play audio.");
	}
	const audio = crunker;

	// the same files and sounds show up in lots of cells, so each one is only
	// loaded once per render
	const loading = new Map<string, Promise<AudioBuffer>>();
	const once = (key: string, load: () => Promise<AudioBuffer>) => {
		let buffer = loading.get(key);
		if (!buffer) {
			buffer = load();
			loading.set(key, buffer);
		}
		return buffer;
	};

	const file = (name: string, label: string) =>
		once(name, async () => {
			try {
				return (await audio.fetchAudio(`/loops/${name}.mp3`))[0];
			} catch (error) {
				console.error(error);
				throw new SongError(`Couldn't load ${label} at ${bpm} BPM.`);
			}
		});

	// a cell of silence, which is also what sets how long a cell is
	const silent = () => file(`silent_${bpm}`, "the empty cells");

	const renderCell = (cell: Cell) => {
		if (cell.type == "loop") {
			return file(`${cell.id}_${bpm}`, `the loop "${cell.name}"`);
		}

		if (cell.type == "sound") {
			return once(`sound ${cell.id}`, async () => {
				const cellOfSilence = await silent();

				try {
					const snap = await getDoc(doc(db, "sounds", cell.id));
					const sound = snap.data();

					if (!sound) {
						throw new SongError(
							`The sound "${cell.name}" doesn't exist anymore.`
						);
					}

					return await renderSound(
						sound.type,
						sound.sequence,
						Number(bpm),
						cellOfSilence
					);
				} catch (error) {
					if (error instanceof SongError) throw error;

					console.error(error);
					throw new SongError(`Couldn't play the sound "${cell.name}".`);
				}
			});
		}

		return silent();
	};

	return Promise.all(
		tracks
			.filter((track) => track.notes.length > 0)
			.map(async (track) => ({
				track: track.id,
				buffer: audio.concatAudio(
					await Promise.all(track.notes.map(renderCell))
				),
			}))
	);
};
