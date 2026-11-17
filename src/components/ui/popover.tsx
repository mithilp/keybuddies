import { ComponentProps } from "react";
import { cn } from "@/utils/cn";

// A small menu that opens next to what it's for. Where it goes is up to the
// caller (top-10, bottom-10, ...); it needs a `relative` parent.
export const Popover = ({ className, ...props }: ComponentProps<"div">) => (
	<div
		role="menu"
		className={cn(
			"absolute z-popover flex items-center gap-1 bg-surface border-control border-ink rounded p-1",
			className
		)}
		{...props}
	/>
);
