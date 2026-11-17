"use client";

import { doc, getDoc } from "firebase/firestore";
import crunker from "./crunker";
import { db } from "./firebase";
import { renderSound } from "./instruments";
import { Cell, Track } from "./types";

export type RenderedTrack = { track: string; buffer: AudioBuffer };

// Renders every track of a song into its own buffer. Nothing plays here, so
// whoever calls this can start all the tracks at the same moment.
// Tracks with no cells are left out.
export const renderSong = async (
	tracks: Track[],
	bpm: string
): Promise<RenderedTrack[]> => {
	if (!crunker) return [];
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

	const file = (name: string) =>
		once(name, async () => (await audio.fetchAudio(`/loops/${name}.mp3`))[0]);

	// a cell of silence, which is also what sets how long a cell is
	const silent = () => file(`silent_${bpm}`);

	const renderCell = (cell: Cell) => {
		if (cell.type == "loop") {
			return file(`${cell.id}_${bpm}`);
		}

		if (cell.type == "sound") {
			return once(`sound ${cell.id}`, async () => {
				const snap = await getDoc(doc(db, "sounds", cell.id));

				return renderSound(
					snap.data()!.type,
					snap.data()!.sequence,
					Number(bpm),
					await silent()
				);
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
