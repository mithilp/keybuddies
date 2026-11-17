import loops from "@/utils/loops";
import { previewLoop } from "@/utils/preview";
import { Track } from "@/utils/types";
import { setCell } from "@/utils/cells";
import { useState } from "react";
import Notice from "../Notice";
import PlayLoop from "../PlayLoop";

const Loops = ({
	setSelectedCell,
	selectedCell,
	tracks,
	bpm,
	studio,
}: {
	setSelectedCell: Function;
	selectedCell: any[];
	tracks: Track[];
	bpm: string;
	studio: string;
}) => {
	const [notice, setNotice] = useState("");

	return (
		<div className="p-4 space-y-2">
			{loops.map((loop, index) => (
				<div
					key={index}
					onClick={() => {
						if (selectedCell[0] != -1) {
							const track = tracks.find(
								(track) => track.id === selectedCell[0]
							);
							if (track) {
								previewLoop(loop.id, bpm);
								setCell(studio, track.id, selectedCell[1], {
									type: "loop",
									name: loop.name,
									id: loop.id,
								}).catch((error) => {
									console.error(error);
									setNotice("Couldn't put the loop in. Try again.");
								});
							}
							setSelectedCell([-1, -1]);
						}
					}}
					className={`bg-yellow cursor-pointer flex justify-between items-center p-4 rounded-xl border-8 ${
						selectedCell[0] != -1 ? "border-pink" : "border-black"
					}`}
				>
					<div>{loop.name}</div>
					<PlayLoop
						bpm={bpm}
						selected={selectedCell[0] != -1}
						id={loop.id}
						name={loop.name}
					/>
				</div>
			))}

			{notice && <Notice message={notice} close={() => setNotice("")} />}
		</div>
	);
};

export default Loops;
