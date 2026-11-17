import {
	MouseEvent,
	PointerEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { Tip } from "./ui/tooltip";

// a beat on the ruler is one w-7 tick
export const BEAT_WIDTH = 28;

// how far the pointer has to go before a press on the playhead is a drag, in px
const SLACK = 3;

// The line that shows where the song is, with an arrow on top of it. It lives
// inside the box that scrolls sideways with the ruler and the tracks, so it
// stays lined up with them. It starts at the ruler's thick line (the numbers
// above it are one h-6 row) and runs down through the tracks.
//
// `beat` is where it rests. While the song plays it asks `liveBeat` on every
// frame and moves itself, without re-rendering anything.
//
// The arrow and the line under it can both be dragged sideways. They go from
// beat to beat like a click on the ruler does, and `seek` is told where they
// were let go.
const Playhead = ({
	beat,
	playing,
	liveBeat,
	beats,
	seek,
}: {
	beat: number;
	playing: boolean;
	liveBeat: () => number;
	beats: number;
	seek: (beat: number) => void;
}) => {
	const line = useRef<HTMLDivElement>(null);

	// where the line is drawn right now, in beats
	const at = useRef(0);

	const show = useCallback(
		(to: number) => {
			at.current = Math.max(0, Math.min(to, beats));

			if (line.current) {
				line.current.style.transform = `translateX(${
					at.current * BEAT_WIDTH
				}px)`;
			}
		},
		[beats],
	);

	// The drag that's going on, if one is. `from` is where the pointer went
	// down and `offset` how far that was from the line, both in px. `to` is the
	// beat it has been dragged to, and stays null until the pointer has really
	// moved, so a press that doesn't drag changes nothing.
	const drag = useRef<{
		from: number;
		offset: number;
		to: number | null;
	} | null>(null);

	const [dragging, setDragging] = useState(false);

	useEffect(() => {
		// the hand has it
		if (dragging) return;

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
	}, [beat, playing, liveBeat, show, dragging]);

	// where the pointer is along the song, in px from beat 0
	const along = (event: PointerEvent) => {
		const box = line.current?.parentElement?.getBoundingClientRect();
		return event.clientX - (box?.left ?? 0);
	};

	const grab = (event: PointerEvent<HTMLDivElement>) => {
		if (event.button !== 0) return;

		// every move comes here from now on, wherever the pointer goes
		event.currentTarget.setPointerCapture(event.pointerId);

		drag.current = {
			from: event.clientX,
			offset: along(event) - at.current * BEAT_WIDTH,
			to: null,
		};
		setDragging(true);
	};

	const move = (event: PointerEvent<HTMLDivElement>) => {
		const held = drag.current;
		if (!held) return;

		if (held.to === null && Math.abs(event.clientX - held.from) < SLACK) {
			return;
		}

		// the nearest beat, but never the very end
		held.to = Math.max(
			0,
			Math.min(
				Math.round((along(event) - held.offset) / BEAT_WIDTH),
				beats - 1,
			),
		);
		show(held.to);
	};

	// The song jumps when the playhead is let go, not on the way: every beat
	// it passes would be a jump of its own.
	//
	// A press that never turned into a drag was meant for whatever is under
	// the playhead (a cell, the ruler), so it gets the click instead.
	const release = (event: PointerEvent<HTMLDivElement>) => {
		const held = drag.current;
		if (!held) return;

		drag.current = null;
		setDragging(false);

		if (held.to !== null) {
			seek(held.to);
			return;
		}

		const under = document
			.elementsFromPoint(event.clientX, event.clientY)
			.find((el) => !line.current?.contains(el));
		if (under instanceof HTMLElement) under.click();
	};

	// the drag was taken away (a touch that turned into something else), the
	// line goes back to where the song is
	const cancel = () => {
		drag.current = null;
		setDragging(false);
	};

	// the arrow and the line are both handles for the same drag
	const handle = {
		// no text gets selected on the way
		onMouseDown: (event: MouseEvent) => event.preventDefault(),
		onPointerDown: grab,
		onPointerMove: move,
		onPointerUp: release,
		onPointerCancel: cancel,
		onLostPointerCapture: cancel,
	};

	// The line is 8px wide and pulled left so its middle sits on the middle of
	// a tick. The arrow is one beat wide and centered on the same spot.
	return (
		<div
			ref={line}
			aria-hidden
			className="pointer-events-none absolute top-6 bottom-0 left-0 w-0"
		>
			<div
				{...handle}
				className="pointer-events-auto absolute inset-y-0 -left-[3px] w-2 bg-blue border-x-2 border-black cursor-ew-resize touch-none select-none"
			></div>

			<Tip label="Drag to move through the song">
				<div
					{...handle}
					className="pointer-events-auto absolute top-0 -left-[13px] w-7 h-6 touch-none select-none cursor-ew-resize"
				>
					<svg
						viewBox="0 0 28 24"
						className="block w-full h-full fill-blue stroke-black"
					>
						<path
							d="M2 2H26V9L14 21L2 9Z"
							strokeWidth={4}
							strokeLinejoin="round"
						/>
					</svg>
				</div>
			</Tip>
		</div>
	);
};

export default Playhead;
