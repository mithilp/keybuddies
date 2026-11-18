"use client";

import { use, useState } from "react";
import { Item, Track } from "@/utils/types";
import { cn } from "@/utils/cn";
import Sidebar from "@/components/sidebar/Sidebar";
import Header from "@/components/Header";
import Tracks from "@/components/Tracks";
import Notice from "@/components/Notice";
import TabBar, { View } from "@/components/TabBar";
import PickBar from "@/components/PickBar";
import StudioNotFound from "@/components/StudioNotFound";
import StudioFailed from "@/components/StudioFailed";
import { Spinner } from "@/components/ui/spinner";
import { isStudioCode } from "@/utils/studio-code";
import { Placing, usePlacing } from "@/utils/placing";
import { useStudio } from "@/hooks/use-studio";
import { usePlayback } from "@/hooks/use-playback";
import { useExport } from "@/hooks/use-export";

export default function Page(props: { params: Promise<{ studio: string }> }) {
	const { studio } = use(props.params);

	// only a code that can't be a studio is known to be nothing without asking
	if (!isStudioCode(studio)) {
		return <StudioNotFound studio={studio} />;
	}

	// another studio is another page, with nothing left over from this one
	return <Studio key={studio} studio={studio} />;
}

function Studio({ studio }: { studio: string }) {
	const { load, retry, bpm, tracks, loading, loops } = useStudio(studio);

	if (load === "missing") {
		return <StudioNotFound studio={studio} />;
	}

	// the workspace goes away with whatever was playing in it
	if (load === "failed") {
		return <StudioFailed studio={studio} retry={retry} />;
	}

	if (load === "loading") {
		return (
			<div className="h-dvh grid place-items-center">
				<Spinner size="lg" label="Loading the studio" />
			</div>
		);
	}

	return (
		<Workspace
			studio={studio}
			bpm={bpm}
			tracks={tracks}
			loading={loading}
			loops={loops}
		/>
	);
}

// The studio once it's there: the sidebar, the header and the tracks, and
// the one notice everything on the page sends its problems to.
function Workspace({
	studio,
	bpm,
	tracks,
	loading,
	loops,
}: {
	studio: string;
	bpm: string;
	tracks: Track[];
	loading: boolean;
	loops: Item[];
}) {
	const [notice, setNotice] = useState("");

	// on a phone or a portrait iPad the sidebar and the tracks take turns,
	// with a tab bar at the bottom to go between them. from lg up they're
	// side by side and this does nothing.
	const [view, setView] = useState<View>("tracks");

	// which bar or clip, or which loop or sound, is picked, and putting one in
	// the other
	const picking = usePlacing(studio, tracks, setNotice);

	// a bar picked first needs a sound next, so the sounds come up. a sound
	// picked first, or one that's just been put in, goes back to the tracks.
	const placing: Placing = {
		...picking,
		pickSlot: (slot) => {
			const next = picking.pickSlot(slot);
			if (next.slot) setView("sounds");
			return next;
		},
		pickItem: (item) => {
			const next = picking.pickItem(item);
			if (next.item || next.put) setView("tracks");
			return next;
		},
	};

	const playback = usePlayback(tracks, bpm, setNotice);

	const { exporting, download } = useExport(studio, tracks, bpm, setNotice);

	return (
		// The whole window and never more, so the page itself doesn't scroll:
		// the sidebar and the tracks each scroll inside themselves. Small
		// screens stack the header, one of the two, and the tab bar. From lg
		// up the sidebar is a column on the left and the header and the
		// tracks share the rest.
		<div className="h-dvh overflow-hidden grid grid-rows-[auto_minmax(0,1fr)_auto_auto] lg:grid-cols-[340px_minmax(0,1fr)] lg:grid-rows-[auto_minmax(0,1fr)_auto]">
			<Sidebar
				className={cn(
					"row-start-2 lg:col-start-1 lg:row-start-1 lg:row-span-3 lg:block",
					view === "sounds" ? "block" : "hidden"
				)}
				placing={placing}
				bpm={bpm}
				studio={studio}
				loops={loops}
				failed={setNotice}
			/>

			{/* The header is not inside the part that scrolls, so the tracks
			    can't end up over or under it whichever way they're scrolled. */}
			<Header
				className="row-start-1 lg:col-start-2"
				studio={studio}
				bpm={bpm}
				playback={playback.playback}
				play={playback.play}
				stop={playback.stop}
				looping={playback.looping}
				toggleLoop={playback.toggleLoop}
				exporting={exporting}
				download={download}
				failed={setNotice}
			/>

			<main
				className={cn(
					"row-start-2 lg:col-start-2 min-w-0 min-h-0 flex-col lg:flex",
					view === "tracks" ? "flex" : "hidden"
				)}
			>
				<Tracks
					placing={placing}
					tracks={tracks}
					loading={loading}
					studio={studio}
					mute={playback.mute}
					muted={playback.muted}
					beat={playback.beat}
					playing={playback.playback === "playing"}
					liveBeat={playback.liveBeat}
					seek={playback.seek}
					failed={setNotice}
				/>
			</main>

			{/* what's picked, and a way out of it, whichever tab is up */}
			<PickBar
				className="row-start-3 lg:col-start-2"
				placing={placing}
				tracks={tracks}
			/>

			<TabBar className="row-start-4 lg:hidden" view={view} show={setView} />

			{notice && <Notice message={notice} close={() => setNotice("")} />}
		</div>
	);
}
