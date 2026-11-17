"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Track } from "@/utils/types";
import { DEFAULT_BPM, listenStudio, listenTracks } from "@/utils/studio";
import { cellOnlyLoops, studioLoops } from "@/utils/loops";
import { keepLoops } from "@/utils/library";

// how long firestore gets to answer before the studio counts as not loading
const PATIENCE = 10000;

// What firestore has said about the studio so far. "missing" is the server
// saying there's no such studio. "failed" is not getting an answer, and says
// nothing about whether the studio exists.
export type StudioLoad = "loading" | "ready" | "missing" | "failed";

// Everything the studio page shows that comes from firestore: whether the
// studio is there, its tempo, its tracks and the library loops it has.
export const useStudio = (studio: string) => {
	const [bpm, setBpm] = useState(DEFAULT_BPM);

	const [load, setLoad] = useState<StudioLoad>("loading");

	// goes up to ask firestore again
	const [attempt, setAttempt] = useState(0);

	const retry = () => {
		setLoad("loading");
		setAttempt((attempt) => attempt + 1);
	};

	// the studio can be there before its tracks are
	const [loading, setLoading] = useState(true);

	const [tracks, setTracks] = useState<Track[]>([]);

	// The studio's `library` and `libraryRemoved` fields, as they came. A
	// studio from before the library has neither.
	const [library, setLibrary] = useState<{ added: unknown; removed: unknown }>({
		added: undefined,
		removed: undefined,
	});

	// whether those two came from the server, and not from what this browser
	// remembered of the studio
	const [synced, setSynced] = useState(false);

	// the library loops this studio has, for the sidebar
	const loops = useMemo(
		() => studioLoops(tracks, library.added, library.removed),
		[tracks, library]
	);

	// the loops that are only in that list because a clip holds them
	const cellOnly = useMemo(
		() => cellOnlyLoops(tracks, library.added, library.removed),
		[tracks, library]
	);

	// the ones that were already written down from this page. a write that
	// was turned down brings them back, and it isn't tried again.
	const kept = useRef(new Set<string>());

	// A studio from before the library has loops on its tracks and no list of
	// them. They're written into `library` here, so they don't leave the
	// sidebar when their last clip is replaced. It waits for the server: a
	// remembered studio can be missing a loop that was removed since.
	useEffect(() => {
		if (!synced || loading) return;

		const ids = cellOnly.filter((id) => !kept.current.has(id));
		if (ids.length === 0) return;

		ids.forEach((id) => kept.current.add(id));

		// the list still has them while a clip does, so this can fail quietly
		keepLoops(studio, ids).catch(console.error);
	}, [synced, loading, cellOnly, studio]);

	useEffect(() => {
		// A listener that got an error is over, nothing more comes from it.
		// The other one is ignored from then on, half a studio isn't shown.
		let over = false;

		const failed = (error: Error) => {
			console.error(error);
			over = true;
			setLoad("failed");
		};

		// With no connection firestore doesn't fail, it waits. The listeners
		// stay on, so the studio still shows up if the answer comes late.
		const slow = setTimeout(() => {
			setLoad((load) => (load === "loading" ? "failed" : load));
		}, PATIENCE);

		const studioUnsub = listenStudio(
			studio,
			(data, fromServer) => {
				if (over) return;

				if (!data) {
					// an empty cache only means firestore hasn't been reached yet.
					// keep the spinner until the server says it isn't there.
					if (fromServer) setLoad("missing");
					return;
				}

				setLoad("ready");
				setBpm(data.bpm);
				setLibrary({ added: data.library, removed: data.libraryRemoved });
				setSynced(fromServer);
			},
			failed
		);

		const tracksUnsub = listenTracks(
			studio,
			(tracks) => {
				if (over) return;

				setTracks(tracks);
				setLoading(false);
			},
			failed
		);

		return () => {
			clearTimeout(slow);
			studioUnsub();
			tracksUnsub();
		};
	}, [studio, attempt]);

	return { load, retry, bpm, tracks, loading, loops };
};
