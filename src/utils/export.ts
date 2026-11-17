"use client";

import crunker from "./crunker";
import { Song } from "./song";

// the loudest a downloaded mix gets, 1 dB under the most a file can hold
const CEILING = 0.891;

// Adds a song's tracks up into one buffer. A few tracks at full volume on
// top of each other go over what a file can hold and would come out
// distorted, so when the loudest sample of the sum is over the ceiling the
// whole mix is turned down until it fits. A mix that already fits is left
// exactly as it is.
export const mixDown = (song: Song) => {
	const context = crunker!.context;
	const frames = Math.round(song.duration * context.sampleRate);

	const mix = context.createBuffer(2, frames, context.sampleRate);
	let peak = 0;

	for (let channel = 0; channel < 2; channel++) {
		const out = mix.getChannelData(channel);

		for (const { buffer } of song.tracks) {
			const track = buffer.getChannelData(channel);
			for (let i = 0; i < frames; i++) {
				out[i] += track[i];
			}
		}

		for (let i = 0; i < frames; i++) {
			peak = Math.max(peak, Math.abs(out[i]));
		}
	}

	if (peak > CEILING) {
		const gain = CEILING / peak;

		for (let channel = 0; channel < 2; channel++) {
			const out = mix.getChannelData(channel);
			for (let i = 0; i < frames; i++) {
				out[i] *= gain;
			}
		}
	}

	return mix;
};

// a buffer as a 16 bit WAV file
export const toWav = (buffer: AudioBuffer) => {
	const exported = crunker!.export(buffer, "audio/wav");

	// crunker also makes an audio element and two urls for it. nothing here
	// plays the file, so they go before they can hold on to it.
	const elementUrl = exported.element.src;
	exported.element.removeAttribute("src");
	URL.revokeObjectURL(elementUrl);
	URL.revokeObjectURL(exported.url);

	return exported.blob;
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
