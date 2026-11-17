import { useEffect } from "react";
import { previewLoop, stopLoopPreview, useLoopPreview } from "@/utils/preview";
import { IconButton } from "./ui/button";
import { SoundIcon, StopIcon } from "./ui/icons";

// Listens to a loop on its own, at the tempo the studio is on. Pressing it
// again stops it. Previews share one slot, so starting one stops whichever
// was playing.
const PlayLoop = ({
	id,
	name,
	bpm,
	disabled = false,
}: {
	id: string;
	name: string;
	bpm: string;
	disabled?: boolean;
}) => {
	// nothing is fetched until the button is pressed
	const state = useLoopPreview(id);

	// a preview is of one tempo. it stops when the tempo changes, and when
	// the button goes away.
	useEffect(() => () => stopLoopPreview(id), [id, bpm]);

	return (
		<IconButton
			label={state === "idle" ? `Listen to ${name}` : `Stop ${name}`}
			icon={state === "idle" ? SoundIcon : StopIcon}
			busy={state === "loading"}
			disabled={disabled}
			onClick={(event) => {
				// the row behind this button is what puts a loop on a track.
				// this one only listens.
				event.stopPropagation();

				if (state === "idle") {
					previewLoop(id, bpm);
				} else {
					stopLoopPreview(id);
				}
			}}
		/>
	);
};

export default PlayLoop;
