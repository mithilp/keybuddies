import { useEffect, useState } from "react";

const Metronome = ({ mspb }: { mspb: number }) => {
	const [ticking, setTicking] = useState(false);

	useEffect(() => {
		let myInterval = setInterval(() => {
			if (ticking) {
				new Audio("/sounds/metronome.mp3").play();
			} else {
				clearInterval(myInterval);
			}
		}, mspb * 8);
		return () => {
			clearInterval(myInterval);
		};
	});

	return (
		<button
			onClick={() => setTicking(!ticking)}
			className="bg-yellow border-8 border-black p-2 rounded-xl"
		>
			{ticking ? "Stop" : "Start"} Metronome
		</button>
	);
};

export default Metronome;
