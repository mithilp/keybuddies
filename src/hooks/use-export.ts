"use client";

import { useRef, useState } from "react";
import { Track } from "@/utils/types";
import { renderSong, SongError } from "@/utils/song";
import { save, toWav } from "@/utils/export";

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

	// Whether a download is being made right now. `exporting` can't say: a
	// second press that comes before the page has re-rendered still sees the
	// old null, and would render the whole song again for a second file.
	const busy = useRef(false);

	// It's the whole song, muted tracks too: mute only lives in this browser,
	// so the file would depend on what happened to be muted here.
	const download = async () => {
		if (busy.current) return;

		if (!tracks.some((track) => track.clips.length > 0)) {
			report("There's nothing to export yet.");
			return;
		}

		busy.current = true;
		report("");
		setExporting(0);

		try {
			const song = await renderSong(tracks, bpm, (ready, total) =>
				setExporting(ready / total)
			);

			save(toWav(song), `keybuddies-${studio}.wav`);
		} catch (error) {
			console.error(error);

			report(
				error instanceof SongError
					? error.message
					: "Something went wrong exporting the song. Try again."
			);
		} finally {
			busy.current = false;
			setExporting(null);
		}
	};

	return { exporting, download };
};
