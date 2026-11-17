import { db } from "@/utils/firebase";
import { SelectedCell, Track as TrackType } from "@/utils/types";
import { Timestamp, addDoc, collection } from "firebase/firestore";
import { FaPlus } from "react-icons/fa";
import { CELL_BEATS } from "@/utils/tempo";
import Playhead, { BEAT_WIDTH } from "./Playhead";
import Track from "./Track";

const Tracks = ({
	tracks,
	selectedCell,
	setSelectedCell,
	studio,
	loading,
	mute,
	muted,
	beat,
	playing,
	liveBeat,
	seek,
}: {
	setSelectedCell: (cell: SelectedCell) => void;
	selectedCell: SelectedCell;
	tracks: TrackType[];
	studio: string;
	loading: boolean;
	mute: (track: TrackType) => void;
	// the ids of the muted tracks
	muted: ReadonlySet<string>;
	beat: number;
	playing: boolean;
	liveBeat: () => number;
	seek: (beat: number) => void;
}) => {
	// the song is as long as its longest track
	const cells = Math.max(0, ...tracks.map((track) => track.notes.length));
	const beats = cells * CELL_BEATS;

	return (
		// this is the box that scrolls, down through the tracks and sideways
		// along the song
		<div className="flex-1 min-h-0 overflow-auto p-10 space-y-4">
			{loading ? (
				<div className="w-full grid place-items-center">
					<div className="animate-spin w-16 h-16 border-8 border-yellow border-b-transparent rounded-full"></div>
				</div>
			) : (
				<>
					{/* the ruler and the tracks are in one box that's as wide as
					    the song, so the playhead can run down all of them */}
					<div className="relative w-max min-w-full">
						<div className="space-y-4">
							<div
								className="flex border-b-8 border-black w-max cursor-pointer"
								title="Click to move the playhead"
								onClick={(event) => {
									const x =
										event.clientX -
										event.currentTarget.getBoundingClientRect().left;

									// the nearest beat, but never the very end
									seek(
										Math.max(
											0,
											Math.min(Math.round(x / BEAT_WIDTH), beats - 1)
										)
									);
								}}
							>
								{Array.from({ length: cells }, (_, i) => (
									<div className="relative" key={i}>
										<div className="w-56 font-bold pl-1">
											{i * CELL_BEATS + 1}
										</div>
										<div className="absolute flex">
											{Array.from({ length: CELL_BEATS }, (_, i) => (
												<div
													key={i}
													className="h-4 w-7 border-l-2 border-black"
												></div>
											))}
										</div>
									</div>
								))}
							</div>

							{tracks.map((track) => (
								<Track
									key={track.id}
									track={track}
									selectedCell={selectedCell}
									setSelectedCell={setSelectedCell}
									studio={studio}
									onMute={() => {
										mute(track);
									}}
									muted={muted.has(track.id)}
								/>
							))}
						</div>

						{beats > 0 && (
							<Playhead
								beat={beat}
								playing={playing}
								liveBeat={liveBeat}
								beats={beats}
							/>
						)}
					</div>

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
