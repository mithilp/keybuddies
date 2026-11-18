import { Clip, ClipBars, Track } from "@/utils/types";
import { Placing } from "@/utils/placing";
import { CLIP_BARS, barsLabel, clipAt, fits } from "@/utils/clips";
import {
	addTrackBar,
	removeTrackBar,
	setClipBars,
	takeOutClip,
} from "@/utils/track-edits";
import { deleteTrack } from "@/utils/studio";
import { useEffect, useRef, useState } from "react";
import { ConfirmDialog } from "./Dialog";
import TrackName from "./TrackName";
import { Tip } from "./ui/tooltip";
import { IconButton } from "./ui/button";
import {
	AddBarIcon,
	DeleteIcon,
	ICON,
	MutedIcon,
	RemoveBarIcon,
	SoundIcon,
} from "./ui/icons";
import { dropTarget, empty, selected } from "./ui/state";
import { cn } from "@/utils/cn";
import { BAR_WIDTH, CLIP_GAP, CLIP_LEFT } from "@/utils/grid";

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

	// What's picked is filled with ink. While a loop or a sound is picked
	// instead, every clip and empty bar gets a dashed border: any of them can
	// take it.
	const look = (picked: boolean) =>
		picked ? selected : placing.item ? dropTarget : "";

	// Once something is put on a bar of this track, the focus goes to the
	// clip it made. The clip shows up as soon as the change is saved here,
	// before the server has it, so this waits for it to be drawn.
	const bars = useRef<HTMLDivElement>(null);
	const { placed, focused } = placing;
	const landed =
		placed?.track === track.id ? clipAt(track.clips, placed.bar) : null;

	useEffect(() => {
		if (!landed) return;

		bars.current
			?.querySelector<HTMLButtonElement>(`[data-clip="${landed.start}"]`)
			?.focus();
		focused();
	}, [landed, focused]);

	// whether the "delete this track?" dialog is open
	const [deleting, setDeleting] = useState(false);

	const remove = () => {
		setDeleting(false);
		deleteTrack(studio, track.id).catch(
			couldnt(`Couldn't delete ${track.name}. Try again.`)
		);
	};

	return (
		<div>
			{/* starts where the clips do, so the playhead never covers the name */}
			<div
				className="flex items-center gap-2"
				style={{ paddingLeft: CLIP_LEFT }}
			>
				<TrackName
					studio={studio}
					id={track.id}
					name={track.name}
					failed={couldnt(`Couldn't rename ${track.name}. Try again.`)}
				/>

				<IconButton
					label={`Mute ${track.name}`}
					icon={muted ? MutedIcon : SoundIcon}
					aria-pressed={muted}
					onClick={() => onMute()}
				/>

				<IconButton
					label={`Delete ${track.name}`}
					icon={DeleteIcon}
					onClick={() => setDeleting(true)}
				/>

				{/* up here and not at the end of the track, where a long one
				    pushes them off the screen */}
				<IconButton
					label={`Add a bar to ${track.name}`}
					icon={AddBarIcon}
					onClick={() => {
						addTrackBar(studio, track.id).catch(unsaved);
					}}
				/>

				<IconButton
					label={`Take the last bar off ${track.name}`}
					icon={RemoveBarIcon}
					// only an empty last bar can go
					disabled={
						track.bars === 0 || clipAt(track.clips, track.bars - 1) !== null
					}
					onClick={() => {
						removeTrackBar(studio, track.id).catch(unsaved);
					}}
				/>
			</div>
			<div
				ref={bars}
				className="relative h-24"
				style={{ width: track.bars * BAR_WIDTH }}
			>
				{Array.from({ length: track.bars }, (_, bar) => bar)
					.filter((bar) => !clipAt(track.clips, bar))
					.map((bar) => {
						const picked =
							placing.slot?.track === track.id &&
							!placing.slot.clip &&
							placing.slot.bar === bar;

						return (
							<button
								type="button"
								key={`empty ${bar}`}
								className={cn(
									"absolute top-0 h-24 grid place-items-center rounded border-control text-xl font-bold",
									empty,
									look(picked)
								)}
								style={{
									left: bar * BAR_WIDTH + CLIP_LEFT,
									width: BAR_WIDTH - CLIP_GAP,
								}}
								aria-label={`Bar ${bar + 1} of ${track.name}, empty`}
								aria-pressed={picked}
								onClick={() => {
									placing.pickSlot({ track: track.id, bar: bar, clip: null });
								}}
							>
								<span aria-hidden>+</span>
							</button>
						);
					})}

				{track.clips.map((clip) => {
					const picked =
						placing.slot?.track === track.id &&
						placing.slot.clip?.start === clip.start;

					// The whole clip is a button that picks it, under its name and
					// its controls. The name lets clicks through to it, the
					// controls keep their own.
					return (
						<div
							key={`clip ${clip.start}`}
							className={cn(
								"absolute top-0 h-24 bg-surface rounded border-control border-ink",
								look(picked)
							)}
							style={{
								left: clip.start * BAR_WIDTH + CLIP_LEFT,
								width: clip.bars * BAR_WIDTH - CLIP_GAP,
							}}
						>
							<button
								type="button"
								data-clip={clip.start}
								className="absolute inset-0 rounded cursor-pointer"
								aria-label={`${clip.name} on bar ${clip.start + 1} of ${track.name}`}
								aria-pressed={picked}
								// the whole name, when it doesn't fit
								title={clip.name}
								onClick={() => {
									placing.pickSlot({
										track: track.id,
										bar: clip.start,
										clip: clip,
									});
								}}
							></button>

							<div className="relative h-full flex flex-col justify-between p-2 pointer-events-none">
								<div className="truncate font-bold">{clip.name}</div>
								<div className="flex items-center justify-between gap-1 [&>*]:pointer-events-auto">
									<select
										className="appearance-none bg-transparent text-sm underline cursor-pointer min-w-0 pointer-coarse:min-w-11 pointer-coarse:min-h-11"
										aria-label={`Length of ${clip.name} on bar ${clip.start + 1} of ${track.name}`}
										value={clip.bars}
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
											type="button"
											className="grid place-items-center rounded min-w-8 min-h-8 -mr-1.5 -mb-1.5 pointer-coarse:min-w-11 pointer-coarse:min-h-11 pointer-coarse:-mr-3 pointer-coarse:-mb-3"
											aria-label={`Take ${clip.name} off bar ${clip.start + 1} of ${track.name}`}
											onClick={() => {
												takeOutClip(studio, track.id, clip).catch(unsaved);
											}}
										>
											<DeleteIcon size={ICON} aria-hidden />
										</button>
									</Tip>
								</div>
							</div>
						</div>
					);
				})}
			</div>

			{deleting && (
				<ConfirmDialog
					title="Delete this track?"
					message={`${track.name} and everything in it will be gone for everyone in the studio.`}
					confirm="Delete"
					danger
					onConfirm={remove}
					onCancel={() => setDeleting(false)}
				/>
			)}
		</div>
	);
};

export default Track;
