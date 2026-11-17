"use client";

import { doc, getDoc } from "firebase/firestore";
import crunker from "./crunker";
import { db } from "./firebase";
import { renderSound } from "./instruments";
import { loopUrl } from "./loops";
import { cellFrames } from "./tempo";
import { Cell, Track } from "./types";

export type RenderedTrack = { track: string; buffer: AudioBuffer };

// an error whose message is written for whoever pressed play
export class SongError extends Error {}

// Copies one cell's audio into a track, starting at sample `at`. It never
// writes more than a cell, so nothing can push the next cell late.
const place = (
	track: AudioBuffer,
	cell: AudioBuffer,
	at: number,
	frames: number
) => {
	const length = Math.min(cell.length, frames);

	for (let channel = 0; channel < track.numberOfChannels; channel++) {
		// mono goes to both sides
		const from = cell.getChannelData(
			Math.min(channel, cell.numberOfChannels - 1)
		);
		track.getChannelData(channel).set(from.subarray(0, length), at);
	}
};

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
	const context = audio.context;

	// how long a cell is comes from the tempo, not from any file
	const frames = cellFrames(Number(bpm), context.sampleRate);

	// the same loops and sounds show up in lots of cells, so each one is only
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

	// an empty cell is nothing at all, the track is silent until written to
	const renderCell = (cell: Cell): Promise<AudioBuffer | null> => {
		if (cell.type == "loop") {
			return once(`loop ${cell.id}`, async () => {
				try {
					return (await audio.fetchAudio(loopUrl(cell.id, bpm)))[0];
				} catch (error) {
					console.error(error);
					throw new SongError(
						`Couldn't load the loop "${cell.name}" at ${bpm} BPM.`
					);
				}
			});
		}

		if (cell.type == "sound") {
			return once(`sound ${cell.id}`, async () => {
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
						frames
					);
				} catch (error) {
					if (error instanceof SongError) throw error;

					console.error(error);
					throw new SongError(`Couldn't play the sound "${cell.name}".`);
				}
			});
		}

		return Promise.resolve(null);
	};

	return Promise.all(
		tracks
			.filter((track) => track.notes.length > 0)
			.map(async (track) => {
				const cells = await Promise.all(track.notes.map(renderCell));

				const buffer = context.createBuffer(
					2,
					cells.length * frames,
					context.sampleRate
				);

				cells.forEach((cell, index) => {
					if (cell) place(buffer, cell, index * frames, frames);
				});

				return { track: track.id, buffer: buffer };
			})
	);
};
