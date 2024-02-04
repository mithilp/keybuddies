import { useState } from "react";
import { FaPause, FaPlay } from "react-icons/fa";
import { FaEarListen } from "react-icons/fa6";

const PlayLoop = ({
	id,
	selected,
	bpm,
}: {
	id: string;
	selected: boolean;
	bpm: string;
}) => {
	const play = () => {
		const a = new Audio(`/${id}_${bpm}.mp3`);
		a.play();
	};

	return (
		<button onClick={play}>
			<FaEarListen
				color={selected ? "#ff90bc" : "black"}
				size={32}
				className="transition"
			/>
		</button>
	);
};

export default PlayLoop;
