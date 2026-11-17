"use client";

import { use, useState } from "react";
import { Item, Track } from "@/utils/types";
import Sidebar from "@/components/Sidebar/Sidebar";
import Header from "@/components/Header";
import Tracks from "@/components/Tracks";
import Notice from "@/components/Notice";
import StudioNotFound from "@/components/StudioNotFound";
import StudioFailed from "@/components/StudioFailed";
import { Spinner } from "@/components/ui/spinner";
import { isStudioCode } from "@/utils/studio-code";
import { usePlacing } from "@/utils/placing";
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
			<div className="h-screen w-screen grid place-items-center">
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

	// which bar or clip, or which loop or sound, is picked, and putting one in
	// the other
	const placing = usePlacing(studio, tracks, setNotice);

	const playback = usePlayback(tracks, bpm, setNotice);

	const { exporting, download } = useExport(studio, tracks, bpm, setNotice);

	return (
		<div className="grid grid-cols-3">
			<Sidebar
				placing={placing}
				bpm={bpm}
				studio={studio}
				loops={loops}
				failed={setNotice}
			/>

			{/* Two thirds of the screen. The header is not inside the part that
			    scrolls, so the tracks can't end up over or under it whichever
			    way they're scrolled. */}
			<main className="col-span-2 h-screen min-w-0 flex flex-col">
				<Header
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

			{notice && <Notice message={notice} close={() => setNotice("")} />}
		</div>
	);
}
