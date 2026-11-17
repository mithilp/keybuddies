"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/utils/cn";

// One of these sits at the root of the app. A tooltip shows up after a short
// wait, and it can't be hovered or clicked itself, so it never gets between
// the mouse and what's under it.
const TooltipProvider = ({ children }: { children: React.ReactNode }) => (
	<TooltipPrimitive.Provider
		delayDuration={300}
		skipDelayDuration={200}
		disableHoverableContent
	>
		{children}
	</TooltipPrimitive.Provider>
);

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
	React.ElementRef<typeof TooltipPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
	<TooltipPrimitive.Portal>
		<TooltipPrimitive.Content
			ref={ref}
			sideOffset={sideOffset}
			collisionPadding={8}
			className={cn(
				"z-toast pointer-events-none select-none bg-paper text-ink border-control border-ink rounded px-3 py-1 text-sm font-bold",
				className
			)}
			{...props}
		/>
	</TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

// Focus opens a tooltip too, but only the keyboard's. A dialog hands the
// focus back to the button that opened it, and after a click that shouldn't
// leave the tooltip sitting there.
const keyboardOnly = (event: React.FocusEvent<HTMLElement>) => {
	if (!event.target.matches(":focus-visible")) event.preventDefault();
};

// The tooltip of a button that only has an icon on it. It goes around the
// button:
//
//   <Tip label="Delete track"><button>...</button></Tip>
//
// A disabled button doesn't say when the mouse is over it, so a button that
// can be disabled gets a span around it that does.
const Tip = ({
	label,
	side = "top",
	children,
}: {
	label: string;
	side?: "top" | "right" | "bottom" | "left";
	children: React.ReactElement<{ disabled?: boolean }>;
}) => (
	<Tooltip>
		<TooltipTrigger asChild onFocus={keyboardOnly}>
			{children.props.disabled === undefined ? (
				children
			) : (
				<span
					className={cn(
						"inline-flex [&>:disabled]:pointer-events-none",
						children.props.disabled && "cursor-not-allowed"
					)}
				>
					{children}
				</span>
			)}
		</TooltipTrigger>
		<TooltipContent side={side}>{label}</TooltipContent>
	</Tooltip>
);

export { Tip, TooltipProvider };
