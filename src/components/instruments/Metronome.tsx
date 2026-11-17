import { useEffect, useState } from "react";
import { Button } from "../ui/button";

const Metronome = ({ mspb }: { mspb: number }) => {
	const [ticking, setTicking] = useState(false);

	useEffect(() => {
		const myInterval = setInterval(() => {
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
		<Button aria-pressed={ticking} onClick={() => setTicking(!ticking)}>
			Metronome
		</Button>
	);
};

export default Metronome;
