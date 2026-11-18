"use client";

import crunker from "./crunker";
import { Song } from "./song";
import { encodeWav } from "./wav";

// A song as one 16 bit WAV file, every track mixed in, muted ones too.
// The tracks go straight into the file, nothing in between holds the whole
// song again.
export const toWav = (song: Song) => {
	const context = crunker!.context;
	const frames = Math.round(song.duration * context.sampleRate);

	const tracks = song.tracks.map(
		({ buffer }) => [buffer.getChannelData(0), buffer.getChannelData(1)] as const
	);

	return new Blob([encodeWav(tracks, frames, context.sampleRate)], {
		type: "audio/wav",
	});
};

// hands a file to the browser's downloads
export const save = (file: Blob, name: string) => {
	const url = URL.createObjectURL(file);

	const link = document.createElement("a");
	link.href = url;
	link.download = name;
	link.style.display = "none";

	document.body.appendChild(link);
	link.click();
	link.remove();

	// the download has to have started before the url goes away
	setTimeout(() => URL.revokeObjectURL(url), 60000);
};
