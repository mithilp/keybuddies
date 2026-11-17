import { ComponentProps } from "react";
import { cn } from "@/utils/cn";

// The thick-framed box that holds a screen's worth of something: the card on
// the home page, a dialog, a panel.
export const cardStyles = "bg-accent border-frame border-ink rounded p-6";

export const Card = ({ className, ...props }: ComponentProps<"div">) => (
	<div className={cn(cardStyles, className)} {...props} />
);
