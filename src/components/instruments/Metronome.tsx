import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import crunker, { wake } from "@/utils/crunker";
import { loadSample } from "@/utils/samples";

// a beat is 8 steps of the piano recorder
const STEPS_PER_BEAT = 8;

const CLICK = "/sounds/metronome.mp3";

// Ticks once a beat while it's on. `step` is how long a recorder step is, in
// ms. The click goes through the same audio context as everything else, so
// it starts with the first press and stops the moment it's turned off.
const Metronome = ({ step }: { step: number }) => {
	const [ticking, setTicking] = useState(false);

	useEffect(() => {
		if (!ticking || !crunker) return;

		const context = crunker.context;
		let click: AudioBuffer | null = null;
		let over = false;

		loadSample(CLICK)
			.then((buffer) => {
				if (!over) click = buffer;
			})
			.catch(console.error);

		const tick = () => {
			if (!click) return;

			const source = context.createBufferSource();
			source.buffer = click;
			source.connect(context.destination);
			source.start();
		};

		const interval = setInterval(tick, step * STEPS_PER_BEAT);

		return () => {
			over = true;
			clearInterval(interval);
		};
	}, [ticking, step]);

	const toggle = () => {
		// browsers only let audio start from a click
		if (!ticking && crunker) wake();
		setTicking(!ticking);
	};

	return (
		<Button aria-pressed={ticking} onClick={toggle}>
			Metronome
		</Button>
	);
};

export default Metronome;
