import { db } from "@/utils/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import { FaCircle, FaPause, FaPlay } from "react-icons/fa";

const Header = ({
	studio,
	bpm,
	play,
	stop,
}: {
	studio: string;
	bpm: string;
	play: (onFinish: Function) => void;
	stop: () => void;
}) => {
	const [playing, setPlaying] = useState(false);

	const playButton = () => {
		setPlaying(!playing);
		if (playing !== true) {
			play(() => {
				setPlaying(false);
			});
		} else {
			stop();
		}
	};

	return (
		<div className="flex sticky top-0 justify-between border-black border-b-8 py-6 px-4">
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
				<button className="bg-yellow border-8 border-black grid place-items-center h-16 w-16 rounded-xl text-3xl font-black">
					<FaCircle color="#ff6767" />
				</button>
				<button
					onClick={playButton}
					className="bg-yellow border-8 border-black grid place-items-center h-16 w-16 rounded-xl text-3xl font-black"
				>
					{playing ? <FaPause color="#000000" /> : <FaPlay color="#000000" />}
				</button>
			</div>
		</div>
	);
};

export default Header;
