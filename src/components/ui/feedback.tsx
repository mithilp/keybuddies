import { ReactNode } from "react";
import { cn } from "@/utils/cn";
import { ErrorIcon, ICON } from "./icons";

// What went wrong, next to the thing it went wrong with: under a box in a
// dialog, on the home card. A problem with the whole page goes to the Notice.
export const ErrorMessage = ({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) => (
	<p
		role="alert"
		className={cn("flex items-center gap-2 text-danger font-bold", className)}
	>
		<ErrorIcon size={ICON} aria-hidden className="shrink-0" />
		<span>{children}</span>
	</p>
);

// the dot next to something live, like a recording. it doesn't pulse for
// anyone who asked for less motion.
export const LiveDot = ({ className }: { className?: string }) => (
	<span
		aria-hidden
		className={cn(
			"inline-block w-3 h-3 rounded-full bg-page animate-pulse motion-reduce:animate-none",
			className
		)}
	></span>
);
