import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";
import { Tip } from "./ui/tooltip";
import { Button } from "./ui/button";
import { ShareDialog } from "./Dialog";
import { CheckIcon, ICON, ShareIcon } from "./ui/icons";

// how long the button says the link was copied
const COPIED_FOR = 2000;

// Sends the studio's link to a friend. On a phone that's the phone's own
// share sheet. On a computer the link is copied, and the button says so for
// a moment. If it can't be copied, a box shows the link to copy by hand.
const ShareStudio = ({
	studio,
	className,
}: {
	studio: string;
	className?: string;
}) => {
	const [copied, setCopied] = useState(false);
	const [showing, setShowing] = useState(false);
	const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
	useEffect(() => () => clearTimeout(timer.current), []);

	const share = async () => {
		const url = `${window.location.origin}/${studio}`;

		// the share sheet is for phones. a computer's is a detour on the way
		// to pasting it somewhere.
		const phone = window.matchMedia("(pointer: coarse)").matches;
		if (phone && navigator.share) {
			try {
				await navigator.share({
					title: "Join my studio on KeyBuddies",
					text: `Join my studio on KeyBuddies. The code is ${studio}.`,
					url: url,
				});
				return;
			} catch (error) {
				// closing the sheet isn't a problem. anything else, copy it
				if (error instanceof DOMException && error.name === "AbortError")
					return;
			}
		}

		try {
			await navigator.clipboard.writeText(url);
			setCopied(true);
			clearTimeout(timer.current);
			timer.current = setTimeout(() => setCopied(false), COPIED_FOR);
		} catch {
			setShowing(true);
		}
	};

	return (
		<>
			<Tip label={copied ? "Link copied" : "Share the link"} side="bottom">
				<Button
					onClick={share}
					className={cn("h-12 sm:h-16 px-3 sm:px-4 font-bold", className)}
				>
					{copied ? (
						<CheckIcon size={ICON} aria-hidden />
					) : (
						<ShareIcon size={ICON} aria-hidden />
					)}
					{/* only the icon on a phone, but the words are still its name */}
					<span className="sr-only sm:not-sr-only">
						{copied ? "Copied" : "Share"}
					</span>
				</Button>
			</Tip>
			<span role="status" className="sr-only">
				{copied ? "Link copied" : ""}
			</span>
			{showing && (
				<ShareDialog
					title="Share this studio"
					hint="Send this link to a friend and they'll join you here."
					// without the https://, so it fits on a phone. chat apps
					// still make it a link.
					code={`${window.location.host}/${studio}`}
					link
					onClose={() => setShowing(false)}
				/>
			)}
		</>
	);
};

export default ShareStudio;
