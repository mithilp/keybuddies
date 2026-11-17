import { setBpm } from "@/utils/studio";
import { TEMPOS } from "@/utils/tempo";
import { Playback } from "@/utils/types";
import { Tip } from "./ui/tooltip";
import { cn } from "@/utils/cn";
import { selected } from "./ui/state";
import { Button } from "./ui/button";
import { Spinner } from "./ui/spinner";
import { Menu, MenuItem } from "./ui/menu";
import {
	BIG_ICON,
	CheckIcon,
	DownloadIcon,
	ICON,
	LoopIcon,
	MoreIcon,
	PauseIcon,
	PlayIcon,
} from "./ui/icons";

// the square buttons on the right, smaller on a phone
const square = "h-12 w-12 sm:h-16 sm:w-16 p-0";

// On a phone there's room for the code, the tempo and Play, and the rest go
// in a menu that opens under its button and says what each thing is.
const More = ({
	looping,
	toggleLoop,
	exporting,
	download,
	className,
}: {
	looping: boolean;
	toggleLoop: () => void;
	exporting: number | null;
	download: () => void;
	className?: string;
}) => {
	const percent = Math.round((exporting ?? 0) * 100);

	return (
		<Menu
			className={className}
			variant="secondary"
			buttonClassName={square}
			label={
				exporting === null ? "More" : `More, making the download, ${percent}%`
			}
			button={
				exporting === null ? (
					<MoreIcon size={BIG_ICON} aria-hidden />
				) : (
					<span className="text-sm font-bold">{percent}%</span>
				)
			}
		>
			{(close) => (
				<>
					<MenuItem
						onClick={() => {
							close();
							download();
						}}
						disabled={exporting !== null}
					>
						<DownloadIcon size={ICON} aria-hidden />
						{exporting === null
							? "Download the song"
							: `Making it, ${percent}%`}
					</MenuItem>
					<MenuItem
						role="menuitemcheckbox"
						aria-checked={looping}
						onClick={toggleLoop}
					>
						<LoopIcon size={ICON} aria-hidden />
						<span className="flex-1">Loop the song</span>
						{looping && <CheckIcon size={ICON} aria-hidden />}
					</MenuItem>
				</>
			)}
		</Menu>
	);
};

const Header = ({
	studio,
	bpm,
	playback,
	play,
	stop,
	looping,
	toggleLoop,
	exporting,
	download,
	failed,
	className,
}: {
	studio: string;
	bpm: string;
	playback: Playback;
	play: () => void;
	stop: () => void;
	looping: boolean;
	toggleLoop: () => void;
	exporting: number | null;
	download: () => void;
	// gets a message when the tempo couldn't be saved
	failed: (message: string) => void;
	className?: string;
}) => {
	const percent = Math.round((exporting ?? 0) * 100);

	return (
		// on a phone it pads itself below the notch, and wraps to two rows
		// when the code and the controls don't fit on one. it's over the
		// playhead so the More menu can open down over the tracks.
		<div
			className={cn(
				"relative z-popover shrink-0 flex flex-wrap items-center gap-2 justify-between bg-page border-ink border-b-frame px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:py-6 sm:px-4",
				className
			)}
		>
			<div>
				<span className="text-sm sm:text-base uppercase font-bold">
					Studio Code
				</span>
				<br />
				<span className="text-2xl sm:text-3xl font-bold">{studio}</span>
			</div>

			<div className="flex gap-2 items-center">
				<h1 className="sr-only sm:not-sr-only text-xl font-bold">BPM:</h1>
				{/* three radio buttons drawn as one block. Tab gets to it and the
				    arrow keys go through the tempos. The focus ring goes round
				    the block. */}
				<Tip label="Tempo, in beats per minute" side="bottom">
					<div
						role="radiogroup"
						aria-label="Tempo, in beats per minute"
						className="flex h-12 sm:h-16 bg-surface border-control border-ink rounded overflow-hidden text-xl font-bold has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink"
					>
						{TEMPOS.map((tempo, index) => (
							<label
								key={tempo}
								className={cn(
									"relative grid place-items-center px-2 sm:px-3 text-lg sm:text-xl cursor-pointer border-ink",
									index > 0 && "border-l-hair",
									bpm === tempo ? selected : "hover:bg-paper"
								)}
							>
								<input
									type="radio"
									name="bpm"
									value={tempo}
									checked={bpm === tempo}
									onChange={() => {
										setBpm(studio, tempo).catch((error) => {
											console.error(error);
											failed("Couldn't change the tempo. Try again.");
										});
									}}
									className="sr-only"
								/>
								{tempo}
							</label>
						))}
					</div>
				</Tip>
				<More
					className="sm:hidden"
					looping={looping}
					toggleLoop={toggleLoop}
					exporting={exporting}
					download={download}
				/>
				<Tip
					label={
						exporting === null ? "Download the song" : "Making the download"
					}
					side="bottom"
				>
					<Button
						onClick={download}
						disabled={exporting !== null}
						aria-busy={exporting !== null}
						aria-label={
							exporting === null
								? "Download the song"
								: `Making the download, ${percent}%`
						}
						className={cn(square, "hidden sm:inline-flex")}
					>
						{exporting === null ? (
							<DownloadIcon size={BIG_ICON} aria-hidden />
						) : (
							<span className="text-sm font-bold">{percent}%</span>
						)}
					</Button>
				</Tip>
				<Tip label={looping ? "Stop looping" : "Loop the song"} side="bottom">
					<Button
						onClick={toggleLoop}
						aria-pressed={looping}
						aria-label="Loop the song"
						className={cn(square, "hidden sm:inline-flex")}
					>
						<LoopIcon size={BIG_ICON} aria-hidden />
					</Button>
				</Tip>
				<Tip
					label={
						playback === "stopped"
							? "Play"
							: playback === "playing"
								? "Pause"
								: "Loading, press to cancel"
					}
					side="bottom"
				>
					{/* the one primary button in the studio */}
					<Button
						variant="primary"
						onClick={playback === "stopped" ? play : stop}
						aria-label={
							playback === "stopped"
								? "Play the song"
								: playback === "playing"
									? "Pause the song"
									: "Loading the song, press to cancel"
						}
						className={square}
					>
						{playback === "loading" ? (
							<Spinner size="md" label="Loading the song" />
						) : playback === "playing" ? (
							<PauseIcon size={BIG_ICON} aria-hidden />
						) : (
							<PlayIcon size={BIG_ICON} aria-hidden />
						)}
					</Button>
				</Tip>
			</div>
		</div>
	);
};

export default Header;
