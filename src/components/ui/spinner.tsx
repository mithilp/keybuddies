import { cn } from "@/utils/cn";

const sizes = {
	sm: "w-5 h-5 border-hair",
	md: "w-6 h-6 border-control",
	lg: "w-16 h-16 border-frame",
};

// something is loading
export const Spinner = ({
	size = "md",
	label = "Loading",
	className,
}: {
	size?: keyof typeof sizes;
	label?: string;
	className?: string;
}) => (
	<span
		role="status"
		aria-label={label}
		className={cn(
			"inline-block shrink-0 animate-spin rounded-full border-ink border-b-transparent",
			sizes[size],
			className
		)}
	></span>
);
