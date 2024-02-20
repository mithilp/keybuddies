import { db } from "@/utils/firebase";
import { Track } from "@/utils/types";
import {
	Timestamp,
	addDoc,
	collection,
	doc,
	updateDoc,
} from "firebase/firestore";
import { FaPlus, FaPlusCircle, FaTrash } from "react-icons/fa";

const Tracks = ({
	tracks,
	selectedCell,
	setSelectedCell,
	studio,
}: {
	setSelectedCell: Function;
	selectedCell: any[];
	tracks: Track[];
	bpm: string;
	studio: string;
}) => {
	return (
		<div className="p-10 space-y-4 w-full overflow-x-scroll">
			{tracks.map((track, index) => (
				<div key={index}>
					<h3 className="text-lg uppercase font-black">{track.name}</h3>
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
										if (
											selectedCell[0] == track.id &&
											selectedCell[1] == index
										) {
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
								await updateDoc(
									doc(db, "studios", studio, "tracks", track.id),
									{
										notes: [...track.notes, -1],
									}
								);
							}}
						>
							<FaPlusCircle color="black" size={32} />
						</button>
					</div>
				</div>
			))}

			<div className="border-t-2 border-black pt-4 sticky left-0">
				<button
					onClick={async () => {
						await addDoc(collection(db, `studios/${studio}/tracks`), {
							createdAt: Timestamp.now(),
							name: `Track ${tracks.length + 1}`,
							order: tracks.length,
							notes: [
								{ type: "empty", name: "", id: "" },
								{ type: "empty", name: "", id: "" },
								{ type: "empty", name: "", id: "" },
								{ type: "empty", name: "", id: "" },
							],
						});
					}}
					className="bg-yellow border-8 p-2 border-black flex items-center space-x-2 rounded-xl text-xl font-bold"
				>
					<FaPlus />
					<div>New Track</div>
				</button>
			</div>
		</div>
	);
};

export default Tracks;
