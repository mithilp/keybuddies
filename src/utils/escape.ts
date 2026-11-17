import { useEffect, useRef } from "react";

// Escape closes one thing at a time, the one on top: a dialog before the
// recorder it was opened from, a note's popup before the piano it's on.
//
// Everything that closes on Escape goes through here instead of listening
// for it itself. Two listeners on the window would both hear the same press,
// stopping it only keeps it from going anywhere else. So there's one
// listener, and it only calls whatever started listening last. That's the
// thing that opened last, which is the one on top.
const open: { current: () => void }[] = [];

// what the one listener does with a key press
export const escapeKey = (
	event: Pick<KeyboardEvent, "key" | "stopPropagation">
) => {
	if (event.key !== "Escape" || open.length === 0) return;

	// nothing under it hears this press, a picked cell stays picked
	event.stopPropagation();
	open[open.length - 1].current();
};

const onKey = (event: KeyboardEvent) => escapeKey(event);

// Puts `close` on top. What comes back takes it off again, wherever it is by
// then.
export const onEscape = (close: { current: () => void }) => {
	open.push(close);
	if (open.length === 1 && typeof window !== "undefined") {
		window.addEventListener("keydown", onKey, true);
	}

	return () => {
		const at = open.lastIndexOf(close);
		if (at !== -1) open.splice(at, 1);

		if (open.length === 0 && typeof window !== "undefined") {
			window.removeEventListener("keydown", onKey, true);
		}
	};
};

// Calls `close` when Escape is pressed while this is on top. `active` is
// false while there's nothing to close.
export const useEscape = (close: () => void, active = true) => {
	const latest = useRef(close);

	useEffect(() => {
		latest.current = close;
	});

	useEffect(() => {
		if (!active) return;
		return onEscape(latest);
	}, [active]);
};
