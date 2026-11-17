import { ComponentProps, ReactElement } from "react";
import { IconType } from "react-icons";
import { cn } from "@/utils/cn";
import { BIG_ICON, ICON } from "./icons";
import { Spinner } from "./spinner";
import { Tip } from "./tooltip";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "md" | "lg";

// Primary is the one thing to do on a screen: Play, Create a Studio, Record,
// Save. It's the page's pink with a shadow under it, which reads on the blue
// cards and the yellow rows both. Everything else is secondary or ghost.
const variants: Record<ButtonVariant, string> = {
	primary:
		"bg-page border-control border-ink shadow-pop font-bold enabled:active:translate-x-0.5 enabled:active:translate-y-0.5 enabled:active:shadow-none",
	secondary: "bg-surface border-control border-ink enabled:hover:bg-paper",
	ghost: "bg-transparent enabled:hover:bg-ink/10",
	danger:
		"bg-danger text-paper border-control border-ink shadow-pop font-bold enabled:active:translate-x-0.5 enabled:active:translate-y-0.5 enabled:active:shadow-none",
};

const sizes: Record<ButtonSize, string> = {
	md: "px-4 py-2 text-base",
	lg: "px-4 py-3 text-lg",
};

// the classes of a button, for something that has to look like one (a link)
export const buttonStyles = ({
	variant = "secondary",
	size = "md",
	className,
}: {
	variant?: ButtonVariant;
	size?: ButtonSize;
	className?: string;
} = {}) =>
	cn(
		// at least 44px tall under a finger
		"inline-flex items-center justify-center gap-2 rounded whitespace-nowrap select-none pointer-coarse:min-h-11",
		variants[variant],
		sizes[size],
		// on: aria-pressed for a toggle, aria-checked for a radio
		"aria-pressed:bg-ink aria-pressed:text-surface aria-checked:bg-ink aria-checked:text-surface",
		// a disabled button looks it and doesn't respond. the same as
		// `disabled` in state.ts, and an "on" one stays readable.
		"disabled:text-ink/60 disabled:border-ink/40 disabled:shadow-none disabled:cursor-not-allowed aria-disabled:text-ink/60 aria-disabled:border-ink/40 aria-disabled:shadow-none aria-disabled:cursor-not-allowed aria-pressed:disabled:text-surface/60 aria-checked:disabled:text-surface/60",
		className
	);

export const Button = ({
	variant,
	size,
	className,
	type = "button",
	...props
}: ComponentProps<"button"> & {
	variant?: ButtonVariant;
	size?: ButtonSize;
}) => (
	<button
		type={type}
		className={buttonStyles({ variant, size, className })}
		{...props}
	/>
);

// A button that's only an icon. It says what it does in a tooltip and to a
// screen reader, and it's at least 40px square whatever the icon's size, 44
// under a finger. On a touch screen the tooltip shows while it's held.
export const IconButton = ({
	label,
	icon: Icon,
	big = false,
	busy = false,
	side,
	className,
	type = "button",
	...props
}: Omit<ComponentProps<"button">, "children"> & {
	label: string;
	icon: IconType;
	// a 28px icon instead of 20
	big?: boolean;
	// a spinner where the icon goes, while what it started is loading
	busy?: boolean;
	side?: "top" | "right" | "bottom" | "left";
}): ReactElement => (
	<Tip label={label} side={side}>
		<button
			type={type}
			aria-label={label}
			className={cn(
				"grid place-items-center min-w-10 min-h-10 pointer-coarse:min-w-11 pointer-coarse:min-h-11 rounded select-none",
				variants.ghost,
				"aria-pressed:bg-ink aria-pressed:text-surface",
				"disabled:text-ink/60 disabled:cursor-not-allowed aria-pressed:disabled:text-surface/60",
				big && "min-w-12 min-h-12 pointer-coarse:min-w-12 pointer-coarse:min-h-12",
				className
			)}
			{...props}
		>
			{busy ? (
				<Spinner size={big ? "md" : "sm"} />
			) : (
				<Icon size={big ? BIG_ICON : ICON} aria-hidden />
			)}
		</button>
	</Tip>
);
