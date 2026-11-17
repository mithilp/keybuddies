import { db } from "@/utils/firebase";
import { Clip, ClipBars, Track } from "@/utils/types";
import { Placing } from "@/utils/placing";
import { CLIP_BARS, clipAt, fits } from "@/utils/clips";
import {
	addTrackBar,
	removeTrackBar,
	setClipBars,
	takeOutClip,
} from "@/utils/track-edits";
import { deleteDoc, doc } from "firebase/firestore";
import { useState } from "react";
import { ConfirmDialog } from "./Dialog";
import { Tip } from "./ui/tooltip";
import {
	FaMinusCircle,
	FaPlusCircle,
	FaTrash,
	FaVolumeMute,
	FaVolumeUp,
} from "react-icons/fa";
import { BAR_WIDTH, CLIP_GAP } from "@/utils/grid";

const barsLabel = (bars: number) => (bars == 1 ? "1 bar" : `${bars} bars`);

const Track = ({
	track,
	placing,
	studio,
	onMute,
	muted,
	failed,
}: {
	track: Track;
	placing: Placing;
	studio: string;
	onMute: () => void;
	muted: boolean;
	// gets a message when a change couldn't be saved
	failed: (message: string) => void;
}) => {
	// The page shows the message, not the track. A deleted track is off the
	// screen before the delete comes back, so it couldn't show its own.
	const couldnt = (message: string) => (error: unknown) => {
		console.error(error);
		failed(message);
	};

	const unsaved = couldnt("Couldn't save that change. Try again.");

	const resize = (clip: Clip, bars: ClipBars) => {
		setClipBars(studio, track.id, clip, bars).catch(unsaved);
	};

	// What's picked is blue. While a loop or a sound is picked instead,
	// every clip and empty bar is pink: any of them can take it.
	const border = (picked: boolean) =>
		picked ? "border-blue" : placing.item ? "border-pink" : "border-black";

	// whether the "delete this track?" dialog is open
	const [deleting, setDeleting] = useState(false);

	const remove = () => {
		setDeleting(false);
		deleteDoc(doc(db, "studios", studio, "tracks", track.id)).catch(
			couldnt(`Couldn't delete ${track.name}. Try again.`)
		);
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
				<div
					className="relative h-24"
					style={{ width: track.bars * BAR_WIDTH }}
				>
					{Array.from({ length: track.bars }, (_, bar) => bar)
						.filter((bar) => !clipAt(track.clips, bar))
						.map((bar) => {
							const picked =
								placing.slot?.track == track.id &&
								!placing.slot.clip &&
								placing.slot.bar == bar;

							return (
								<div
									key={`empty ${bar}`}
									className={`absolute top-0 h-24 bg-white/60 p-1 rounded-xl border-8 cursor-pointer text-sm ${border(picked)}`}
									style={{ left: bar * BAR_WIDTH, width: BAR_WIDTH - CLIP_GAP }}
									aria-label={`Bar ${bar + 1} of ${track.name}, empty`}
									onClick={() => {
										placing.pickSlot({ track: track.id, bar: bar, clip: null });
									}}
								>
									Empty
								</div>
							);
						})}

					{track.clips.map((clip) => {
						const picked =
							placing.slot?.track == track.id &&
							placing.slot.clip?.start == clip.start;

						return (
							<div
								key={`clip ${clip.start}`}
								className={`absolute top-0 h-24 flex flex-col justify-between bg-yellow p-1 rounded-xl border-8 cursor-pointer ${border(picked)}`}
								style={{
									left: clip.start * BAR_WIDTH,
									width: clip.bars * BAR_WIDTH - CLIP_GAP,
								}}
								onClick={() => {
									placing.pickSlot({
										track: track.id,
										bar: clip.start,
										clip: clip,
									});
								}}
							>
								<div className="truncate font-bold" title={clip.name}>
									{clip.name}
								</div>
								<div className="flex items-center justify-between space-x-1">
									<select
										className="appearance-none bg-transparent text-sm underline cursor-pointer min-w-0"
										aria-label={`Length of ${clip.name} on bar ${clip.start + 1} of ${track.name}`}
										value={clip.bars}
										// the clip behind this is what gets picked otherwise
										onClick={(event) => event.stopPropagation()}
										onChange={(event) => {
											resize(clip, Number(event.target.value) as ClipBars);
										}}
									>
										{CLIP_BARS.map((bars) => (
											<option
												key={bars}
												value={bars}
												disabled={!fits(track, clip, bars)}
											>
												{barsLabel(bars)}
											</option>
										))}
									</select>
									<Tip label="Take out">
										<button
											className="text-lg"
											aria-label={`Take ${clip.name} off bar ${clip.start + 1} of ${track.name}`}
											onClick={(event) => {
												// the clip behind this button is what gets picked
												event.stopPropagation();

												takeOutClip(studio, track.id, clip).catch(unsaved);
											}}
										>
											<FaTrash />
										</button>
									</Tip>
								</div>
							</div>
						);
					})}
				</div>

				<Tip label="Add a bar">
					<button
						aria-label={`Add a bar to ${track.name}`}
						onClick={() => {
							addTrackBar(studio, track.id).catch(unsaved);
						}}
					>
						<FaPlusCircle color="black" size={32} />
					</button>
				</Tip>

				<Tip label="Take off the last bar">
					<button
						className="pr-4 disabled:opacity-30"
						aria-label={`Take the last bar off ${track.name}`}
						// only an empty last bar can go
						disabled={
							track.bars == 0 || clipAt(track.clips, track.bars - 1) !== null
						}
						onClick={() => {
							removeTrackBar(studio, track.id).catch(unsaved);
						}}
					>
						<FaMinusCircle color="black" size={32} />
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
		</div>
	);
};

export default Track;
