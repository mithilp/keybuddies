import { db } from "@/utils/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { TEMPOS } from "@/utils/tempo";
import { Playback } from "@/utils/types";
import { Tip } from "./ui/tooltip";
import { cn } from "@/utils/cn";
import { selected } from "./ui/state";
import { Button } from "./ui/button";
import { Spinner } from "./ui/spinner";
import {
	BIG_ICON,
	DownloadIcon,
	LoopIcon,
	PauseIcon,
	PlayIcon,
} from "./ui/icons";

// the square buttons on the right
const square = "h-16 w-16 p-0";

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
}) => {
	const percent = Math.round((exporting ?? 0) * 100);

	return (
		<div className="relative z-sticky shrink-0 flex flex-wrap gap-2 justify-between bg-page border-ink border-b-frame py-6 px-4">
			<div>
				<span className="uppercase font-bold">Studio Code</span>
				<br />
				<span className="text-3xl font-bold">{studio}</span>
			</div>

			<div className="flex space-x-2 items-center">
				<h1 className="text-xl font-bold">BPM:</h1>
				{/* three radio buttons drawn as one block. Tab gets to it and the
				    arrow keys go through the tempos. The focus ring goes round
				    the block. */}
				<Tip label="Tempo, in beats per minute" side="bottom">
					<div
						role="radiogroup"
						aria-label="Tempo, in beats per minute"
						className="flex h-16 bg-surface border-control border-ink rounded overflow-hidden text-xl font-bold has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink"
					>
						{TEMPOS.map((tempo, index) => (
							<label
								key={tempo}
								className={cn(
									"relative grid place-items-center px-3 cursor-pointer border-ink",
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
										updateDoc(doc(db, "studios", studio), { bpm: tempo });
									}}
									className="sr-only"
								/>
								{tempo}
							</label>
						))}
					</div>
				</Tip>
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
						className={square}
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
						className={square}
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
