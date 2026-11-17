import { db } from "@/utils/firebase";
import { Track } from "@/utils/types";
import { Placing } from "@/utils/placing";
import { addCell, removeCell } from "@/utils/cells";
import { deleteDoc, doc } from "firebase/firestore";
import { useState } from "react";
import Notice from "./Notice";
import { ConfirmDialog } from "./Dialog";
import { Tip } from "./ui/tooltip";
import {
	FaPlusCircle,
	FaTrash,
	FaVolumeMute,
	FaVolumeUp,
} from "react-icons/fa";

const Track = ({
	track,
	placing,
	studio,
	onMute,
	muted,
}: {
	track: Track;
	placing: Placing;
	studio: string;
	onMute: () => void;
	muted: boolean;
}) => {
	const [notice, setNotice] = useState("");

	const failed = (error: unknown) => {
		console.error(error);
		setNotice("Couldn't save that change. Try again.");
	};

	// whether the "delete this track?" dialog is open
	const [deleting, setDeleting] = useState(false);

	const remove = () => {
		setDeleting(false);
		deleteDoc(doc(db, "studios", studio, "tracks", track.id)).catch(failed);
	};

	return (
		<div>
			<div className="flex items-center space-x-4">
				<h3 className="text-lg uppercase font-black">{track.name}</h3>

				<Tip label={muted ? "Unmute track" : "Mute track"}>
					<button
						onClick={() => onMute()}
						aria-pressed={muted}
						aria-label={`Mute ${track.name}`}
					>
						{muted ? <FaVolumeMute /> : <FaVolumeUp />}
					</button>
				</Tip>

				<Tip label="Delete track">
					<button
						onClick={() => setDeleting(true)}
						aria-label={`Delete ${track.name}`}
					>
						<FaTrash />
					</button>
				</Tip>
			</div>
			<div className="flex items-center space-x-2">
				{track.notes.map((note, index) => {
					const picked =
						placing.cell?.track == track.id && placing.cell.index == index;

					// The picked cell is blue. While a loop or a sound is picked
					// instead, every cell is pink: any of them can take it.
					const border = picked
						? "border-blue"
						: placing.item
						? "border-pink"
						: "border-black";

					return (
						<div
							key={index}
							className={`flex bg-yellow p-4 rounded-xl border-8 cursor-pointer ${border}`}
							onClick={() => {
								placing.pickCell({ track: track.id, index: index, cell: note });
							}}
						>
							<div className="w-36">
								{note.type == "empty" ? "Select a loop" : note.name}
							</div>
							<Tip label="Delete cell">
								<button
									className="text-2xl"
									aria-label={`Delete cell ${index + 1} of ${track.name}`}
									onClick={(event) => {
										// the cell behind this button is what gets picked
										event.stopPropagation();

										removeCell(studio, track.id, index, note).catch(failed);
									}}
								>
									<FaTrash />
								</button>
							</Tip>
						</div>
					);
				})}

				<Tip label="Add a cell">
					<button
						className="pr-4"
						aria-label={`Add a cell to ${track.name}`}
						onClick={() => {
							addCell(studio, track.id).catch(failed);
						}}
					>
						<FaPlusCircle color="black" size={32} />
					</button>
				</Tip>
			</div>

			{deleting && (
				<ConfirmDialog
					title="Delete this track?"
					message={`${track.name} and everything in it will be gone for everyone in the studio.`}
					confirm="Delete"
					onConfirm={remove}
					onCancel={() => setDeleting(false)}
				/>
			)}

			{notice && <Notice message={notice} close={() => setNotice("")} />}
		</div>
	);
};

export default Track;
