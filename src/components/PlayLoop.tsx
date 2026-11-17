import { useEffect } from "react";
import { FaStop, FaVolumeUp } from "react-icons/fa";
import {
	previewLoop,
	stopLoopPreview,
	useLoopPreview,
} from "@/utils/preview";
import { Tip } from "./ui/tooltip";

// Listens to a loop on its own, at the tempo the studio is on. Pressing it
// again stops it. Previews share one slot, so starting one stops whichever
// was playing.
const PlayLoop = ({
	id,
	name,
	bpm,
	disabled = false,
	className = "h-6 w-6",
}: {
	id: string;
	name: string;
	bpm: string;
	disabled?: boolean;
	className?: string;
}) => {
	// nothing is fetched until the button is pressed
	const state = useLoopPreview(id);

	// a preview is of one tempo. it stops when the tempo changes, and when
	// the button goes away.
	useEffect(() => () => stopLoopPreview(id), [id, bpm]);

	return (
		<Tip label={state == "idle" ? "Listen" : "Stop"}>
			<button
				className={className}
				disabled={disabled}
				aria-label={state == "idle" ? `Listen to ${name}` : `Stop ${name}`}
				onClick={(event) => {
					// the row behind this button is what puts a loop in a cell.
					// this one only listens.
					event.stopPropagation();

					if (state == "idle") {
						previewLoop(id, bpm);
					} else {
						stopLoopPreview(id);
					}
				}}
			>
				{state == "idle" ? (
					<FaVolumeUp className="w-full h-full" />
				) : state == "loading" ? (
					<div className="animate-spin w-full h-full border-4 border-black border-b-transparent rounded-full"></div>
				) : (
					<FaStop className="w-full h-full" />
				)}
			</button>
		</Tip>
	);
};

export default PlayLoop;
