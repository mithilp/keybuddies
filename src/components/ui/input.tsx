import { ComponentProps } from "react";
import { cn } from "@/utils/cn";

const field =
	"bg-surface text-ink border-control border-ink rounded p-2 disabled:opacity-50 disabled:cursor-not-allowed";

export const Input = ({ className, ...props }: ComponentProps<"input">) => (
	<input
		className={cn(field, "placeholder:text-ink/60", className)}
		{...props}
	/>
);

export const Select = ({ className, ...props }: ComponentProps<"select">) => (
	<select className={cn(field, "cursor-pointer", className)} {...props} />
);
