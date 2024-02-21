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
	const play = () => {
		console.log(id);
		const a = new Audio(`/loops/${id}_${bpm}.mp3`);
		a.play();
	};

	return (
		<button onClick={play}>
			<FaVolumeUp
				color={selected ? "#ff90bc" : "black"}
				size={32}
				className="transition"
			/>
		</button>
	);
};

export default PlayLoop;
