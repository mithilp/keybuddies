import { db } from "@/utils/firebase";
import { Track as TrackType } from "@/utils/types";
import { Placing } from "@/utils/placing";
import { Timestamp, addDoc, collection } from "firebase/firestore";
import { FaPlus } from "react-icons/fa";
import { BAR_BEATS } from "@/utils/tempo";
import Playhead from "./Playhead";
import {
	BAR_WIDTH,
	BEAT_WIDTH,
	RULER_HEIGHT,
	TICK_HEIGHT,
	TICK_WIDTH,
	beatAt,
} from "@/utils/grid";
import Track from "./Track";

const Tracks = ({
	tracks,
	placing,
	studio,
	loading,
	mute,
	muted,
	beat,
	playing,
	liveBeat,
	seek,
	failed,
}: {
	placing: Placing;
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
	// gets a message when a change to a track couldn't be saved
	failed: (message: string) => void;
}) => {
	// the song is as long as its longest track
	const bars = Math.max(0, ...tracks.map((track) => track.bars));
	const beats = bars * BAR_BEATS;

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
								onClick={(event) => {
									const x =
										event.clientX -
										event.currentTarget.getBoundingClientRect().left;

									seek(beatAt(x, beats));
								}}
							>
								{Array.from({ length: bars }, (_, i) => (
									<div className="relative" key={i}>
										{/* one bar, numbered. the playhead starts right
										    under it */}
										<div
											className="font-bold pl-1"
											style={{
												width: BAR_WIDTH,
												height: RULER_HEIGHT,
												lineHeight: `${RULER_HEIGHT}px`,
											}}
										>
											{i + 1}
										</div>
										<div className="absolute flex">
											{Array.from({ length: BAR_BEATS }, (_, i) => (
												<div
													key={i}
													className="border-black"
													style={{
														width: BEAT_WIDTH,
														height: TICK_HEIGHT,
														borderLeftWidth: TICK_WIDTH,
													}}
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
									placing={placing}
									studio={studio}
									onMute={() => {
										mute(track);
									}}
									muted={muted.has(track.id)}
									failed={failed}
								/>
							))}
						</div>

						{beats > 0 && (
							<Playhead
								beat={beat}
								playing={playing}
								liveBeat={liveBeat}
								beats={beats}
								seek={seek}
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
									// `notes` is only there so a tab still on the old app can show it
									notes: [],
									clips: [],
									bars: 8,
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
