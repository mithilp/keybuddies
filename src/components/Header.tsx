import { db } from "@/utils/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { Playback } from "@/utils/types";
import { FaDownload, FaPause, FaPlay } from "react-icons/fa";
import { FaRepeat } from "react-icons/fa6";
import { Tip } from "./ui/tooltip";

// the tempos a studio can be in. every loop has a file for each of them.
const TEMPOS = ["80", "120", "160"];

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
				{/* three radio buttons drawn as one block. Tab gets to it and the
				    arrow keys go through the tempos. */}
				<Tip label="Tempo, in beats per minute" side="bottom">
					<div
						role="radiogroup"
						aria-label="Tempo, in beats per minute"
						className="flex h-16 bg-yellow border-8 border-black rounded-xl overflow-hidden text-2xl font-black"
					>
						{TEMPOS.map((tempo, index) => (
							<label
								key={tempo}
								className={`relative grid place-items-center px-3 cursor-pointer border-black has-[:focus-visible]:outline has-[:focus-visible]:outline-4 has-[:focus-visible]:-outline-offset-4 has-[:focus-visible]:outline-black ${
									index > 0 ? "border-l-4" : ""
								} ${bpm == tempo ? "bg-blue" : ""}`}
							>
								<input
									type="radio"
									name="bpm"
									value={tempo}
									checked={bpm == tempo}
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
