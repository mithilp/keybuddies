import { db } from "@/utils/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { Playback } from "@/utils/types";
import { FaDownload, FaPause, FaPlay } from "react-icons/fa";
import { FaRepeat } from "react-icons/fa6";
import { Tip } from "./ui/tooltip";

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
		<div className="relative z-10 shrink-0 flex flex-wrap gap-2 justify-between bg-pink border-black border-b-8 py-6 px-4">
			<div>
				<span className="leading-7 uppercase font-black">Studio Code</span>
				<br />
				<span className="leading-8 text-5xl font-black">{studio}</span>
			</div>

			<div className="flex space-x-2 items-center">
				<h1 className="text-3xl font-black">BPM:</h1>
				<select
					value={bpm}
					onChange={(e) => {
						updateDoc(doc(db, "studios", studio), {
							bpm: e.target.value,
						});
					}}
					className="bg-yellow border-8 px-2 rounded-xl border-black h-16 text-3xl font-black"
				>
					<option value="80">80</option>
					<option value="120">120</option>
					<option value="160">160</option>
				</select>
				<Tip
					label={
						exporting === null ? "Download the song" : "Making the download"
					}
					side="bottom"
				>
					<button
						onClick={download}
						disabled={exporting !== null}
						aria-busy={exporting !== null}
						aria-label={
							exporting === null
								? "Download the song"
								: `Making the download, ${percent}%`
						}
						className="bg-yellow border-8 border-black grid place-items-center h-16 w-16 rounded-xl text-3xl font-black"
					>
						{exporting === null ? (
							<FaDownload color="#000000" />
						) : (
							<span className="text-sm">{percent}%</span>
						)}
					</button>
				</Tip>
				<Tip label={looping ? "Stop looping" : "Loop the song"} side="bottom">
					<button
						onClick={toggleLoop}
						aria-pressed={looping}
						aria-label="Loop the song"
						className={`${
							looping ? "bg-blue" : "bg-yellow"
						} border-8 border-black grid place-items-center h-16 w-16 rounded-xl text-3xl font-black`}
					>
						<FaRepeat color="#000000" />
					</button>
				</Tip>
				<Tip
					label={
						playback == "stopped"
							? "Play"
							: playback == "playing"
							? "Pause"
							: "Loading, press to cancel"
					}
					side="bottom"
				>
					<button
						onClick={playback == "stopped" ? play : stop}
						aria-label={
							playback == "stopped"
								? "Play the song"
								: playback == "playing"
								? "Pause the song"
								: "Loading the song, press to cancel"
						}
						className="bg-yellow border-8 border-black grid place-items-center h-16 w-16 rounded-xl text-3xl font-black"
					>
						{playback == "loading" ? (
							<div className="animate-spin w-8 h-8 border-4 border-black border-b-transparent rounded-full"></div>
						) : playback == "playing" ? (
							<FaPause color="#000000" />
						) : (
							<FaPlay color="#000000" />
						)}
					</button>
				</Tip>
			</div>
		</div>
	);
};

export default Header;
