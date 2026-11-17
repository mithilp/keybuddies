import { useCallback, useEffect, useState } from "react";
import { clipAt, sameClip } from "./clips";
import { putItem } from "./track-edits";
import { Item, Slot, Track } from "./types";
import {
	NOTHING,
	Pick,
	Picked,
	PickedSlot,
	pickItem as pickItemNext,
	pickSlot as pickSlotNext,
} from "./pick";

export type Placing = {
	// the clip or empty bar that's waiting for a loop or a sound, if one is
	slot: Slot;
	// the loop or the sound that's waiting for a place, if one is
	item: Item | null;
	// a tap on a clip or an empty bar. comes back with what it did.
	pickSlot: (slot: PickedSlot) => Pick;
	// a tap on a loop or a sound in the sidebar. comes back with what it did.
	pickItem: (item: Item) => Pick;
	// lets go of the loop or sound and keeps the slot
	dropItem: () => void;
	// lets go of whatever is waiting
	cancel: () => void;
};

// Putting loops and sounds on tracks. It works in both orders: pick a clip
// or an empty bar and then what goes there, or pick what goes and then the
// place. Whichever is picked first waits, the second click puts it in and
// nothing is picked any more. A second click on what's waiting, or Escape,
// lets go of it. Nothing plays when something is put in.
//
// The studio page has the only one of these, and the tracks and the sidebar
// are both handed it. Loops and recorded sounds go through the same
// `pickItem`, the only difference between them is the clip they make.
//
// `failed` gets a message when the change couldn't be saved.
export const usePlacing = (
	studio: string,
	tracks: Track[],
	failed: (message: string) => void
): Placing => {
	const [picked, setPicked] = useState<Picked>(NOTHING);
	const { slot, item } = picked;

	// A pick is for the clip or the empty bar it was made on. When that isn't
	// there any more (someone else changed the clip, or put something on the
	// bar), the pick is let go, so a loop can't land on something nobody
	// picked.
	if (slot) {
		const track = tracks.find((track) => track.id === slot.track);
		const now = track ? clipAt(track.clips, slot.bar) : null;

		const still =
			track &&
			(slot.clip
				? now !== null && sameClip(now, slot.clip)
				: now === null && slot.bar < track.bars);

		if (!still) setPicked({ slot: null, item });
	}

	// does what a pick says, and saves what it put in
	const apply = (next: Pick) => {
		setPicked({ slot: next.slot, item: next.item });

		if (next.put) {
			const { slot: into, item: what } = next.put;

			putItem(studio, into.track, into, what).catch((error) => {
				console.error(error);
				failed(
					`Couldn't put the ${what.type === "loop" ? "loop" : "sound"} in. Try again.`
				);
			});
		}

		return next;
	};

	const pickSlot = (target: PickedSlot) => apply(pickSlotNext(picked, target));

	const pickItem = (next: Item) => apply(pickItemNext(picked, next));

	const dropItem = useCallback(
		() => setPicked((now) => ({ slot: now.slot, item: null })),
		[]
	);

	const cancel = useCallback(() => setPicked(NOTHING), []);

	const waiting = slot !== null || item !== null;

	// A dialog or a recorder that's open takes Escape for itself before it gets
	// here (see escape.ts), so closing one doesn't also let go of the pick.
	useEffect(() => {
		if (!waiting) return;

		const onKey = (event: KeyboardEvent) => {
			if (event.key !== "Escape") return;

			setPicked(NOTHING);
		};

		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [waiting]);

	return { slot, item, pickSlot, pickItem, dropItem, cancel };
};
