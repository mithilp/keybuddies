import { useState } from "react";
import { FaVolumeUp } from "react-icons/fa";

const PlayLoop = ({
	id,
	selected,
	bpm,
}: {
	id: string;
	selected: boolean;
	bpm: string;
}) => {
	const [audio] = useState(new Audio(`/loops/${id}_${bpm}.mp3`));

	const [playing, setPlaying] = useState(false);

	const play = () => {
		if (!playing) {
			setPlaying(true);
			audio.play();
			setTimeout(() => {
				setPlaying(false);
			}, audio.duration * 1000);
		}
	};

	return (
		<button className="w-6 h-6" onClick={play}>
			{playing ? (
				<div className="animate-spin w-full h-full border-4 border-black border-b-transparent rounded-full"></div>
			) : (
				<FaVolumeUp
					className="w-full h-full"
					color={selected ? "#ff90bc" : "black"}
				/>
			)}
		</button>
	);
};

export default PlayLoop;
