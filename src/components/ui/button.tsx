import { ComponentProps, ReactElement } from "react";
import { IconType } from "react-icons";
import { cn } from "@/utils/cn";
import { BIG_ICON, ICON } from "./icons";
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
		"inline-flex items-center justify-center gap-2 rounded whitespace-nowrap select-none",
		variants[variant],
		sizes[size],
		// on: aria-pressed for a toggle, aria-checked for a radio
		"aria-pressed:bg-ink aria-pressed:text-surface aria-checked:bg-ink aria-checked:text-surface",
		// a disabled button looks it and doesn't respond
		"disabled:opacity-50 disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:cursor-not-allowed",
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
// screen reader, and it's at least 40px square whatever the icon's size.
export const IconButton = ({
	label,
	icon: Icon,
	big = false,
	side,
	className,
	type = "button",
	...props
}: Omit<ComponentProps<"button">, "children"> & {
	label: string;
	icon: IconType;
	// a 28px icon instead of 20
	big?: boolean;
	side?: "top" | "right" | "bottom" | "left";
}): ReactElement => (
	<Tip label={label} side={side}>
		<button
			type={type}
			aria-label={label}
			className={cn(
				"grid place-items-center min-w-10 min-h-10 rounded",
				variants.ghost,
				"aria-pressed:bg-ink aria-pressed:text-surface",
				"disabled:opacity-50 disabled:cursor-not-allowed",
				big && "min-w-12 min-h-12",
				className
			)}
			{...props}
		>
			<Icon size={big ? BIG_ICON : ICON} aria-hidden />
		</button>
	</Tip>
);
