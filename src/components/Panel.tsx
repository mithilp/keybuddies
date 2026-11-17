"use client";

import { ReactNode, useEffect, useId, useRef } from "react";
import { FaCircleXmark } from "react-icons/fa6";
import { Tip } from "@/components/ui/tooltip";
import { useEscape } from "@/utils/escape";
import { keepTabInside } from "./Dialog";

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

	useEscape(close);

	useEffect(() => {
		const before = document.activeElement;
		box.current?.focus();

		return () => {
			if (before instanceof HTMLElement) before.focus();
		};
	}, []);

	return (
		<div className="fixed top-0 left-0 z-20 w-screen h-screen p-12">
			<div
				ref={box}
				role="dialog"
				aria-modal="true"
				aria-labelledby={heading}
				tabIndex={-1}
				onKeyDown={(event) => keepTabInside(event, box.current)}
				className="bg-blue border-8 border-black h-full rounded-xl p-8 space-y-2 outline-none"
			>
				<div className="flex justify-between items-center">
					<h3 id={heading} className="text-2xl font-bold">
						{title}
					</h3>
					<Tip label="Close" side="left">
						<button onClick={close} aria-label="Close">
							<FaCircleXmark size={32} />
						</button>
					</Tip>
				</div>

				{children}
			</div>
		</div>
	);
};

export default Panel;
