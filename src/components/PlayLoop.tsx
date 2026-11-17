import { useEffect } from "react";
import { FaVolumeUp } from "react-icons/fa";
import {
	previewLoop,
	stopLoopPreview,
	useLoopPreview,
} from "@/utils/preview";
import { Tip } from "./ui/tooltip";

const PlayLoop = ({
	id,
	name,
	selected,
	bpm,
}: {
	id: string;
	name: string;
	selected: boolean;
	bpm: string;
}) => {
	// nothing is fetched until the button is pressed
	const state = useLoopPreview(id);

	// a preview is of one tempo. it stops when the tempo changes, and when
	// the loop list goes away.
	useEffect(() => () => stopLoopPreview(id), [id, bpm]);

	return (
		<Tip label={state == "idle" ? "Listen" : "Stop"}>
			<button
				className="w-6 h-6"
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
				{state != "idle" ? (
					<div className="animate-spin w-full h-full border-4 border-black border-b-transparent rounded-full"></div>
				) : (
					<FaVolumeUp
						className="w-full h-full"
						color={selected ? "#ff90bc" : "black"}
					/>
				)}
			</button>
		</Tip>
	);
};

export default PlayLoop;
