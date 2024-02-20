import { db } from "@/utils/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import { FaCircle, FaPause, FaPlay } from "react-icons/fa";

const Header = ({ studio, bpm }: { studio: string; bpm: string }) => {
	const [playing, setPlaying] = useState(false);

	function playTrack() {
		// const audios1: Array<HTMLAudioElement> = track1.map(
		// 	(track) => new Audio(`/loops/${track}_${bpm}.mp3`)
		// );
		// const audios2: Array<HTMLAudioElement> = track2.map(
		// 	(track) => new Audio(`/loops/${track}_${bpm}.mp3`)
		// );
		// const audios3: Array<HTMLAudioElement> = track3.map(
		// 	(track) => new Audio(`/loops/${track}_${bpm}.mp3`)
		// );
		// if (play === "FaPlay") {
		// 	// playing
		// 	setPlay("FaPause");
		// 	let i: number = 0;
		// 	const interval1 = setInterval(() => {
		// 		audios1[i].play();
		// 		i++;
		// 		if (i == audios1.length) {
		// 			clearInterval(interval1);
		// 		}
		// 		if (i > audios1.length && j > audios2.length && k > audios3.length) {
		// 			setPlay("FaPlay");
		// 		}
		// 	}, 4000);
		// 	let j = 0;
		// 	const interval2 = setInterval(() => {
		// 		audios2[j].play();
		// 		j++;
		// 		if (j == audios2.length) {
		// 			clearInterval(interval2);
		// 		}
		// 		if (i > audios1.length && j > audios2.length && k > audios3.length) {
		// 			setPlay("FaPlay");
		// 		}
		// 	}, 4000);
		// 	let k = 0;
		// 	const interval3 = setInterval(() => {
		// 		audios3[k].play();
		// 		k++;
		// 		if (k == audios3.length) {
		// 			clearInterval(interval3);
		// 		}
		// 		if (i > audios1.length && j > audios2.length && k > audios3.length) {
		// 			setPlay("FaPause");
		// 		}
		// 	}, 4000);
		// } else {
		// 	// pausing
		// 	setPlay("FaPlay");
		// 	audios1.forEach((cell, index) => {
		// 		cell.pause();
		// 	});
		// 	audios2.forEach((cell, index) => {
		// 		cell.pause();
		// 	});
		// 	audios3.forEach((cell, index) => {
		// 		cell.pause();
		// 	});
		// }
	}

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
					onClick={() => playTrack()}
					className="bg-yellow border-8 border-black grid place-items-center h-16 w-16 rounded-xl text-3xl font-black"
				>
					{playing ? <FaPlay color="#000000" /> : <FaPause color="#000000" />}
				</button>
			</div>
		</div>
	);
};

export default Header;
