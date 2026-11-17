import { useEffect, useRef } from "react";

// a beat on the ruler is one w-7 tick
export const BEAT_WIDTH = 28;

// The line that shows where the song is. It lives inside the box that scrolls
// sideways with the ruler and the tracks, so it stays lined up with them.
//
// `beat` is where it rests. While the song plays it asks `liveBeat` on every
// frame and moves itself, without re-rendering anything.
const Playhead = ({
	beat,
	playing,
	liveBeat,
	beats,
}: {
	beat: number;
	playing: boolean;
	liveBeat: () => number;
	beats: number;
}) => {
	const line = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const show = (at: number) => {
			if (line.current) {
				const x = Math.max(0, Math.min(at, beats)) * BEAT_WIDTH;
				line.current.style.transform = `translateX(${x}px)`;
			}
		};

		if (!playing) {
			show(beat);
			return;
		}

		let frame = 0;
		const follow = () => {
			show(liveBeat());
			frame = requestAnimationFrame(follow);
		};
		follow();

		return () => cancelAnimationFrame(frame);
	}, [beat, playing, liveBeat, beats]);

	// 8px wide and pulled left so its middle sits on the middle of a tick
	return (
		<div
			ref={line}
			aria-hidden
			className="pointer-events-none absolute top-0 bottom-0 -left-[3px] w-2 bg-blue border-x-2 border-black"
		></div>
	);
};

export default Playhead;
