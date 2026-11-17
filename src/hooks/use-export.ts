"use client";

import { useState } from "react";
import { Track } from "@/utils/types";
import { renderSong, SongError } from "@/utils/song";
import { mixDown, save, toWav } from "@/utils/export";

// Saving the song as one WAV file. `report` gets a message when something
// goes wrong, and an empty one when a download starts.
export const useExport = (
	studio: string,
	tracks: Track[],
	bpm: string,
	report: (message: string) => void
) => {
	// null when no download is being made, otherwise how far along it is from
	// 0 to 1
	const [exporting, setExporting] = useState<number | null>(null);

	// It's the whole song, muted tracks too: mute only lives in this browser,
	// so the file would depend on what happened to be muted here.
	const download = async () => {
		if (exporting !== null) return;

		if (!tracks.some((track) => track.clips.length > 0)) {
			report("There's nothing to export yet.");
			return;
		}

		report("");
		setExporting(0);

		try {
			const song = await renderSong(tracks, bpm, (ready, total) =>
				setExporting(ready / total)
			);

			save(toWav(mixDown(song)), `keybuddies-${studio}.wav`);
		} catch (error) {
			console.error(error);

			report(
				error instanceof SongError
					? error.message
					: "Something went wrong exporting the song. Try again."
			);
		} finally {
			setExporting(null);
		}
	};

	return { exporting, download };
};
