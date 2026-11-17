import { KeyboardEvent, RefObject, useEffect } from "react";

// Tab and Shift Tab go round the buttons and boxes in `box` and never leave
// it. Focus that's on `box` itself goes to the first or the last one.
export const keepTabInside = (
	event: KeyboardEvent,
	box: HTMLElement | null
) => {
	if (event.key !== "Tab" || !box) return;

	const stops = box.querySelectorAll<HTMLElement>(
		"button:not(:disabled), input:not(:disabled), select:not(:disabled)"
	);
	if (stops.length === 0) return;

	const first = stops[0];
	const last = stops[stops.length - 1];
	const at = document.activeElement;

	if (event.shiftKey && (at === first || at === box)) {
		event.preventDefault();
		last.focus();
	} else if (!event.shiftKey && at === last) {
		event.preventDefault();
		first.focus();
	}
};

// What a dialog or a panel does with the focus: Tab stays inside `box`, and
// once it's gone the focus goes back to where it was before it opened. What
// comes back is the key handler, for the box or something around it.
export const useFocusTrap = (box: RefObject<HTMLElement | null>) => {
	useEffect(() => {
		const before = document.activeElement;

		return () => {
			if (before instanceof HTMLElement) before.focus();
		};
	}, []);

	return (event: KeyboardEvent) => keepTabInside(event, box.current);
};
