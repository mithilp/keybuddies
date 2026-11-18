import { ComponentProps, ReactNode, useEffect, useRef, useState } from "react";
import { useEscape } from "@/utils/escape";
import { cn } from "@/utils/cn";
import { Button, ButtonVariant } from "./button";
import { Popover } from "./popover";

// A button that opens a list of things to do under it, each one with its
// name written out. A tap anywhere else, Escape, or picking one closes it.
// `button` is what's on the button, `label` what a screen reader says for it.
export const Menu = ({
	label,
	button,
	variant = "ghost",
	buttonClassName,
	className,
	children,
}: {
	label: string;
	button: ReactNode;
	variant?: ButtonVariant;
	buttonClassName?: string;
	className?: string;
	// gets `close`, for the items that open something of their own
	children: (close: () => void) => ReactNode;
}) => {
	const [open, setOpen] = useState(false);
	const box = useRef<HTMLDivElement>(null);
	const close = () => setOpen(false);

	useEscape(close, open);

	useEffect(() => {
		if (!open) return;

		const away = (event: PointerEvent) => {
			if (!box.current?.contains(event.target as Node)) setOpen(false);
		};

		document.addEventListener("pointerdown", away);
		return () => document.removeEventListener("pointerdown", away);
	}, [open]);

	return (
		<div ref={box} className={cn("relative", className)}>
			<Button
				variant={variant}
				onClick={() => setOpen(!open)}
				aria-haspopup="menu"
				aria-expanded={open}
				aria-label={label}
				className={buttonClassName}
			>
				{button}
			</Button>

			{open && (
				<Popover
					aria-label={label}
					className="right-0 top-full mt-1 w-56 flex-col items-stretch"
				>
					{children(close)}
				</Popover>
			)}
		</div>
	);
};

// one thing in a Menu: an icon and what it does
export const MenuItem = ({
	className,
	role = "menuitem",
	...props
}: ComponentProps<"button">) => (
	<Button
		role={role}
		variant="ghost"
		className={cn("h-12 justify-start text-left", className)}
		{...props}
	/>
);
