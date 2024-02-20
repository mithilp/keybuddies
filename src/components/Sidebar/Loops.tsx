import { db } from "@/utils/firebase";
import loops from "@/utils/loops";
import { Track } from "@/utils/types";
import { doc, updateDoc } from "firebase/firestore";
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
	return (
		<div className="p-4 space-y-2">
			{loops.map((loop, index) => (
				<div
					key={index}
					onClick={async () => {
						if (selectedCell[0] != -1) {
							const track = tracks.find(
								(track) => track.id === selectedCell[0]
							);
							if (track) {
								track.notes[selectedCell[1]] = loop;
								await updateDoc(
									doc(db, "studios", studio, "tracks", selectedCell[0]),
									{
										notes: track.notes,
									}
								);
							}
							setSelectedCell([-1, -1]);
						}
					}}
					className={`bg-yellow cursor-pointer flex justify-between p-4 rounded-xl border-8 ${
						selectedCell[0] != -1 ? "border-pink" : "border-black"
					}`}
				>
					<div>{loop.name}</div>
					<PlayLoop bpm={bpm} selected={selectedCell[0] != -1} id={loop.id} />
				</div>
			))}
		</div>
	);
};

export default Loops;
