"use client";

import { ReactNode, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { useEscape } from "@/utils/escape";
import { useFocusTrap } from "@/utils/focus";
import { cn } from "@/utils/cn";
import { Card } from "./ui/card";
import { IconButton } from "./ui/button";
import { CloseIcon } from "./ui/icons";

// The row of buttons at the bottom of a panel (Listen, Save). It stays on
// screen while what's above it scrolls, and pads itself above the home bar.
export const panelFooter =
	"sticky bottom-0 z-sticky mt-auto -mx-4 sm:-mx-8 px-4 sm:px-8 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-6 bg-accent border-t-hair border-ink flex flex-wrap items-center gap-4";

// A recorder or an editor over the studio. It works like a dialog: the page
// behind it is dimmed, the X or Escape closes it, Tab stays inside it, and
// the focus goes back to where it was once it's gone. A dialog or a popup
// opened on top of it gets Escape first.
//
// It's drawn on the body, not where it's opened from. The recorders and
// editors live in the sidebar, which small screens hide on the tracks tab,
// so turning an iPad or shrinking the window would hide an open panel.
//
// On a phone it's the whole screen. On anything bigger it's a card as tall
// as what's in it, up to the height of the window. Either way the title
// stays at the top, the middle scrolls, and the footer stays at the bottom.
const Panel = ({
	title,
	close,
	children,
}: {
	title: string;
	close: () => void;
	children: ReactNode;
}) => {
	const heading = useId();
	const box = useRef<HTMLDivElement>(null);
	const trap = useFocusTrap(box);

	useEscape(close);

	useEffect(() => {
		box.current?.focus();
	}, []);

	return createPortal(
		<div className="fixed inset-0 z-dialog grid place-items-center bg-ink/50 sm:p-6 lg:p-12">
			<Card
				ref={box}
				role="dialog"
				aria-modal="true"
				aria-labelledby={heading}
				tabIndex={-1}
				onKeyDown={trap}
				className={cn(
					"w-full h-full flex flex-col p-0 overflow-hidden outline-none",
					"rounded-none border-0 sm:rounded sm:border-frame",
					"sm:h-auto sm:max-h-full sm:max-w-6xl"
				)}
			>
				<div className="shrink-0 flex justify-between items-center gap-2 px-4 sm:px-8 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:pt-6 border-b-hair border-ink">
					<h3 id={heading} className="text-xl font-bold">
						{title}
					</h3>
					<IconButton
						label="Close"
						side="left"
						icon={CloseIcon}
						big
						onClick={close}
					/>
				</div>

				<div className="flex-1 min-h-0 overflow-y-auto overscroll-contain flex flex-col gap-2 px-4 sm:px-8 pt-4">
					{children}
				</div>
			</Card>
		</div>,
		document.body
	);
};

export default Panel;
