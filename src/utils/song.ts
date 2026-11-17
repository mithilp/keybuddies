"use client";

import { doc, getDoc } from "firebase/firestore";
import crunker from "./crunker";
import { db } from "./firebase";
import { renderSound } from "./instruments";
import { loadLoop } from "./samples";
import { cellFrames } from "./tempo";
import { Cell, Track } from "./types";

export type RenderedTrack = { track: string; buffer: AudioBuffer };

// A song ready to play. It's as long as its longest track, and every track's
// buffer is that long too, with silence after its last cell. Same length
// buffers are what let the tracks loop together without drifting.
export type Song = {
	tracks: RenderedTrack[];
	bpm: number;
	// seconds
	duration: number;
};

// an error whose message is written for whoever pressed play
export class SongError extends Error {}

// Everything about a song that can be heard, as one string: the tempo and
// what's in every cell. Two songs with the same one render the same, a track
// that only got a new name doesn't change it.
export const songKey = (tracks: Track[], bpm: string) =>
	JSON.stringify([
		bpm,
		tracks.map((track) => [
			track.id,
			track.notes.map((cell) =>
				cell.type == "empty" ? "" : `${cell.type} ${cell.id}`
			),
		]),
	]);

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

// Renders every track of a song into its own buffer. Nothing plays here, the
// transport starts all the tracks at the same moment.
// Everything the song needs is asked for at once, not one cell after another.
// Tracks with no cells are left out. Throws a SongError naming the cell that
// couldn't be built.
//
// `progress` is told how many of the song's loops and sounds are ready, out
// of how many there are.
export const renderSong = async (
	tracks: Track[],
	bpm: string,
	progress?: (ready: number, total: number) => void
): Promise<Song> => {
	if (!crunker) {
		throw new SongError("This browser can't play audio.");
	}
	const context = crunker.context;

	// how long a cell is comes from the tempo, not from any file
	const frames = cellFrames(Number(bpm), context.sampleRate);

	// how many different loops and sounds the song is made of, for `progress`
	const total = new Set(
		tracks
			.flatMap((track) => track.notes)
			.filter((cell) => cell.type != "empty")
			.map((cell) => `${cell.type} ${cell.id}`)
	).size;
	let ready = 0;

	// The same loops and sounds show up in lots of cells, so each one is only
	// built once per render. Decoded files outlive the render in the sample
	// cache. Sounds don't, they can be edited between two plays.
	const building = new Map<string, Promise<AudioBuffer>>();
	const once = (key: string, build: () => Promise<AudioBuffer>) => {
		let buffer = building.get(key);
		if (!buffer) {
			buffer = build();
			building.set(key, buffer);

			buffer.then(
				() => progress?.(++ready, total),
				() => {}
			);
		}
		return buffer;
	};

	// an empty cell is nothing at all, the track is silent until written to
	const renderCell = (cell: Cell): Promise<AudioBuffer | null> => {
		if (cell.type == "loop") {
			return once(`loop ${cell.id}`, async () => {
				try {
					return await loadLoop(cell.id, bpm);
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
						{
							type: sound.type,
							sequence: sound.sequence,
							steps: sound.steps,
						},
						Number(bpm)
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

	const filled = tracks.filter((track) => track.notes.length > 0);
	const longest = Math.max(0, ...filled.map((track) => track.notes.length));

	const rendered = await Promise.all(
		filled.map(async (track) => {
			const cells = await Promise.all(track.notes.map(renderCell));

			const buffer = context.createBuffer(
				2,
				longest * frames,
				context.sampleRate
			);

			cells.forEach((cell, index) => {
				if (cell) place(buffer, cell, index * frames, frames);
			});

			return { track: track.id, buffer: buffer };
		})
	);

	return {
		tracks: rendered,
		bpm: Number(bpm),
		duration: (longest * frames) / context.sampleRate,
	};
};
