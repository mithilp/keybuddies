import { ReactNode } from "react";
import { cn } from "@/utils/cn";
import { Placing } from "@/utils/placing";
import { Track } from "@/utils/types";
import { Button } from "./ui/button";
import { CloseIcon, ICON } from "./ui/icons";

// While a bar or a sound is waiting for the other half, this says what's
// waiting and has a Cancel that lets go of it. On a phone it's how to get
// out of a pick without a keyboard, and it stays up whichever tab is open.
const PickBar = ({
	placing,
	tracks,
	className,
}: {
	placing: Placing;
	tracks: Track[];
	className?: string;
}) => {
	const { slot, item, cancel } = placing;

	if (!slot && !item) return null;

	let message: ReactNode = "";

	if (item) {
		// a mouse clicks and a finger taps. the CSS picks, so the server and
		// the first render agree.
		message = (
			<>
				Placing {item.name}.{" "}
				<span className="pointer-coarse:hidden">Click</span>
				<span className="hidden pointer-coarse:inline">Tap</span> a bar to put
				it there.
			</>
		);
	} else if (slot) {
		const track = tracks.find((track) => track.id === slot.track);
		const where = `${track?.name ?? "the track"}, bar ${slot.bar + 1}`;

		message = slot.clip
			? `Pick a sound to swap in for ${slot.clip.name} on ${where}.`
			: `Pick a sound for ${where}.`;
	}

	return (
		<div
			role="status"
			className={cn(
				"flex items-center gap-3 bg-surface border-t-frame border-ink px-3 py-2 sm:px-4",
				className
			)}
		>
			<p className="flex-1 min-w-0 font-bold">{message}</p>
			<Button onClick={cancel} className="shrink-0 min-h-11">
				<CloseIcon size={ICON} aria-hidden />
				Cancel
			</Button>
		</div>
	);
};

export default PickBar;
