"use client";

import { doc, getDoc } from "firebase/firestore";
import crunker from "./crunker";
import { db } from "./firebase";
import { renderSound } from "./instruments";
import { loadLoop } from "./samples";
import { DEFAULT_BARS, fill, soundBars } from "./clips";
import { framesOf } from "./tempo";
import { Clip, Track } from "./types";

export type RenderedTrack = { track: string; buffer: AudioBuffer };

// A song ready to play. It's as long as its longest track, and every track's
// buffer is that long too, with silence where it has no clips. Same length
// buffers are what let the tracks loop together without drifting.
export type Song = {
	tracks: RenderedTrack[];
	bpm: number;
	// seconds
	duration: number;
};

// an error whose message is written for whoever pressed play
export class SongError extends Error {}

// Everything about a song that can be heard, as one string: the tempo, how
// long every track is and where every clip is. Two songs with the same one
// render the same, a track that only got a new name doesn't change it.
export const songKey = (tracks: Track[], bpm: string) =>
	JSON.stringify([
		bpm,
		tracks.map((track) => [
			track.id,
			track.bars,
			track.clips.map(
				(clip) => `${clip.type} ${clip.id} ${clip.start} ${clip.bars}`
			),
		]),
	]);

// Copies the start of a loop or a sound into a track, at sample `at`. It
// never writes more than `room`, so nothing can push the next bar late.
const place = (
	track: AudioBuffer,
	source: AudioBuffer,
	at: number,
	room: number
) => {
	const length = Math.min(source.length, room, track.length - at);
	if (length <= 0) return;

	for (let channel = 0; channel < track.numberOfChannels; channel++) {
		// mono goes to both sides
		const from = source.getChannelData(
			Math.min(channel, source.numberOfChannels - 1)
		);
		track.getChannelData(channel).set(from.subarray(0, length), at);
	}
};

// a loop or a sound ready to go into tracks, and how many bars it is
type Source = { buffer: AudioBuffer; bars: number };

// Renders every track of a song into its own buffer. Nothing plays here, the
// transport starts all the tracks at the same moment.
// Everything the song needs is asked for at once, not one clip after another.
// Tracks with no bars are left out. Throws a SongError naming the loop or
// sound that couldn't be built.
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

	// where a bar starts comes from the tempo, not from any file
	const framesAt = (bar: number) =>
		framesOf(bar, Number(bpm), context.sampleRate);

	// how many different loops and sounds the song is made of, for `progress`
	const total = new Set(
		tracks
			.flatMap((track) => track.clips)
			.map((clip) => `${clip.type} ${clip.id}`)
	).size;
	let ready = 0;

	// The same loops and sounds show up in lots of clips, so each one is only
	// built once per render. Decoded files outlive the render in the sample
	// cache. Sounds don't, they can be edited between two plays.
	const building = new Map<string, Promise<Source>>();
	const once = (key: string, build: () => Promise<Source>) => {
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

	// every library loop is 2 bars
	const renderClip = (clip: Clip): Promise<Source> => {
		if (clip.type == "loop") {
			return once(`loop ${clip.id}`, async () => {
				try {
					return { buffer: await loadLoop(clip.id, bpm), bars: DEFAULT_BARS };
				} catch (error) {
					console.error(error);
					throw new SongError(
						`Couldn't load the loop "${clip.name}" at ${bpm} BPM.`
					);
				}
			});
		}

		return once(`sound ${clip.id}`, async () => {
			try {
				const snap = await getDoc(doc(db, "sounds", clip.id));
				const sound = snap.data();

				if (!sound) {
					throw new SongError(
						`The sound "${clip.name}" doesn't exist anymore.`
					);
				}

				const buffer = await renderSound(
					{
						type: sound.type,
						sequence: sound.sequence,
						steps: sound.steps,
						bars: sound.bars,
					},
					Number(bpm)
				);
				return { buffer: buffer, bars: soundBars(sound.bars) };
			} catch (error) {
				if (error instanceof SongError) throw error;

				console.error(error);
				throw new SongError(`Couldn't play the sound "${clip.name}".`);
			}
		});
	};

	const filled = tracks.filter((track) => track.bars > 0);
	const longest = framesAt(Math.max(0, ...filled.map((track) => track.bars)));

	const rendered = await Promise.all(
		filled.map(async (track) => {
			const sources = await Promise.all(track.clips.map(renderClip));

			const buffer = context.createBuffer(2, longest, context.sampleRate);

			// a clip plays its source from the start, again and again until the
			// clip is full, and is cut off where it ends
			track.clips.forEach((clip, index) => {
				const source = sources[index];

				for (const piece of fill(clip, source.bars, framesAt)) {
					place(buffer, source.buffer, piece.at, piece.length);
				}
			});

			return { track: track.id, buffer: buffer };
		})
	);

	return {
		tracks: rendered,
		bpm: Number(bpm),
		duration: longest / context.sampleRate,
	};
};
