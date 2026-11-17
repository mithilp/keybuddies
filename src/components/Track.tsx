import { db } from "@/utils/firebase";
import { SelectedCell, Track } from "@/utils/types";
import { addCell, removeCell } from "@/utils/cells";
import { deleteDoc, doc } from "firebase/firestore";
import { useState } from "react";
import Notice from "./Notice";
import {
	FaPlusCircle,
	FaTrash,
	FaVolumeMute,
	FaVolumeUp,
} from "react-icons/fa";

const Track = ({
	track,
	selectedCell,
	setSelectedCell,
	studio,
	onMute,
	muted,
}: {
	track: Track;
	selectedCell: SelectedCell;
	setSelectedCell: (cell: SelectedCell) => void;
	studio: string;
	onMute: () => void;
	muted: boolean;
}) => {
	const [notice, setNotice] = useState("");

	const failed = (error: unknown) => {
		console.error(error);
		setNotice("Couldn't save that change. Try again.");
	};

	return (
		<div>
			<div className="flex items-center space-x-4">
				<h3 className="text-lg uppercase font-black">{track.name}</h3>

				<button
					onClick={() => onMute()}
					aria-pressed={muted}
					aria-label={`Mute ${track.name}`}
					title={muted ? "Unmute track" : "Mute track"}
				>
					{muted ? <FaVolumeMute /> : <FaVolumeUp />}
				</button>

				<button
					onClick={() => {
						deleteDoc(doc(db, "studios", studio, "tracks", track.id));
					}}
					aria-label={`Delete ${track.name}`}
					title="Delete track"
				>
					<FaTrash />
				</button>
			</div>
			<div className="flex items-center space-x-2">
				{track.notes.map((note, index) => {
					const picked =
						selectedCell?.track == track.id && selectedCell.index == index;

					return (
						<div
							key={index}
							className={`flex bg-yellow p-4 rounded-xl border-8 cursor-pointer ${
								picked ? "border-blue" : "border-black"
							}`}
						>
							{/* a second click on the picked cell lets go of it */}
							<div
								className="w-36"
								onClick={() => {
									setSelectedCell(
										picked
											? null
											: { track: track.id, index: index, cell: note }
									);
								}}
							>
								{note.type == "empty" ? "Select a loop" : note.name}
							</div>
							<button
								className="text-2xl"
								aria-label={`Delete cell ${index + 1} of ${track.name}`}
								title="Delete cell"
								onClick={() => {
									removeCell(studio, track.id, index, note).catch(failed);
								}}
							>
								<FaTrash />
							</button>
						</div>
					);
				})}

				<button
					className="pr-4"
					aria-label={`Add a cell to ${track.name}`}
					title="Add a cell"
					onClick={() => {
						addCell(studio, track.id).catch(failed);
					}}
				>
					<FaPlusCircle color="black" size={32} />
				</button>
			</div>

			{notice && <Notice message={notice} close={() => setNotice("")} />}
		</div>
	);
};

export default Track;
