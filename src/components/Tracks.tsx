import { db } from "@/utils/firebase";
import { Track as TrackType } from "@/utils/types";
import {
	Timestamp,
	addDoc,
	collection,
	doc,
	updateDoc,
} from "firebase/firestore";
import { FaPlus, FaPlusCircle, FaTrash, FaVolumeMute } from "react-icons/fa";
import Track from "./Track";

const Tracks = ({
	tracks,
	selectedCell,
	setSelectedCell,
	studio,
	loading,
	mute,
	muted,
}: {
	setSelectedCell: Function;
	selectedCell: any[];
	tracks: TrackType[];
	bpm: string;
	studio: string;
	loading: boolean;
	mute: (track: TrackType, index: number) => void;
	muted: boolean[];
}) => {
	return (
		<div className="p-10 space-y-4 w-full overflow-x-scroll">
			{loading ? (
				<div className="w-full grid place-items-center">
					<div className="animate-spin w-16 h-16 border-8 border-yellow border-b-transparent rounded-full"></div>
				</div>
			) : (
				<>
					<div className="flex border-b-8 border-black w-max">
						{new Array(
							Math.max(...tracks.map((track) => track.notes.length)) > 0
								? Math.max(...tracks.map((track) => track.notes.length))
								: 0
						)
							.fill(0)
							.map((_: any, i: number) => (
								<div className="relative" key={i}>
									<div className="w-56 font-bold pl-1">{i * 8 + 1}</div>
									<div className="absolute flex">
										{new Array(8).fill(0).map((_: any, i: number) => (
											<div
												key={i}
												className="h-4 w-7 border-l-2 border-black"
											></div>
										))}
									</div>
								</div>
							))}
					</div>

					{tracks.map((track, index) => (
						<Track
							key={index}
							track={track}
							selectedCell={selectedCell}
							setSelectedCell={setSelectedCell}
							studio={studio}
							onMute={() => {
								mute(track, index);
							}}
							muted={muted[index]}
						/>
					))}

					<div className="border-t-8 border-black pt-4 sticky left-0">
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
							className="bg-yellow border-8 p-2 border-black flex items-center space-x-2 rounded-xl text-xl"
						>
							<FaPlus />
							<div>New Track</div>
						</button>
					</div>
				</>
			)}
		</div>
	);
};

export default Tracks;
