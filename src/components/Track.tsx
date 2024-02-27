import { db } from "@/utils/firebase";
import { Track } from "@/utils/types";
import { doc, updateDoc } from "firebase/firestore";
import { useState } from "react";
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
	selectedCell: any[];
	setSelectedCell: Function;
	studio: string;
	onMute: Function;
	muted: boolean;
}) => {
	return (
		<div>
			<div className="flex items-center space-x-4">
				<h3 className="text-lg uppercase font-black">{track.name}</h3>

				<button onClick={() => onMute()}>
					{muted ? <FaVolumeMute /> : <FaVolumeUp />}
				</button>

				<button>
					<FaTrash />
				</button>
			</div>
			<div className="flex items-center space-x-2">
				{track.notes.map((note, index) => (
					<div
						key={index}
						className={`flex bg-yellow p-4 rounded-xl border-8 cursor-pointer ${
							track.id == selectedCell[0] && index == selectedCell[1]
								? "border-blue"
								: "border-black"
						}`}
					>
						<div
							className="w-36"
							onClick={() => {
								if (selectedCell[0] == track.id && selectedCell[1] == index) {
									setSelectedCell([-1, -1]);
								}

								setSelectedCell([track.id, index]);
							}}
						>
							{note.type == "empty" ? "Select a loop" : note.name}
						</div>
						<button
							className="text-2xl"
							onClick={async () => {
								track.notes.splice(index, 1);
								await updateDoc(
									doc(db, "studios", studio, "tracks", track.id),
									{
										notes: track.notes,
									}
								);
							}}
						>
							<FaTrash />
						</button>
					</div>
				))}

				<button
					className="pr-4"
					onClick={async () => {
						await updateDoc(doc(db, "studios", studio, "tracks", track.id), {
							notes: [...track.notes, { type: "empty", name: "", id: "" }],
						});
					}}
				>
					<FaPlusCircle color="black" size={32} />
				</button>
			</div>
		</div>
	);
};

export default Track;
