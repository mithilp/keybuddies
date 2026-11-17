"use client";

import { ReactNode, useEffect, useId, useRef } from "react";
import { useEscape } from "@/utils/escape";
import { useFocusTrap } from "@/utils/focus";
import { Card } from "./ui/card";
import { IconButton } from "./ui/button";
import { CloseIcon } from "./ui/icons";

// A recorder or an editor that takes up the whole window. It works like a
// dialog: the X or Escape closes it, Tab stays inside it, and the focus goes
// back to where it was once it's gone. A dialog or a popup opened on top of
// it gets Escape first.
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

	return (
		<div className="fixed top-0 left-0 z-dialog w-screen h-screen p-12">
			<Card
				ref={box}
				role="dialog"
				aria-modal="true"
				aria-labelledby={heading}
				tabIndex={-1}
				onKeyDown={trap}
				className="h-full p-8 space-y-2 outline-none"
			>
				<div className="flex justify-between items-center">
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

				{children}
			</Card>
		</div>
	);
};

export default Panel;
