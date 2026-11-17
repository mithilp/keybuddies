import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// tailwind-merge has to know the names in tailwind.config.ts, or it takes
// border-frame for a border color and drops it next to border-ink
const twMerge = extendTailwindMerge({
	extend: {
		theme: {
			shadow: ["pop"],
		},
		classGroups: {
			"border-w": [{ border: ["frame", "control", "hair"] }],
			"border-w-x": [{ "border-x": ["frame", "control", "hair"] }],
			"border-w-y": [{ "border-y": ["frame", "control", "hair"] }],
			"border-w-t": [{ "border-t": ["frame", "control", "hair"] }],
			"border-w-r": [{ "border-r": ["frame", "control", "hair"] }],
			"border-w-b": [{ "border-b": ["frame", "control", "hair"] }],
			"border-w-l": [{ "border-l": ["frame", "control", "hair"] }],
			z: [{ z: ["base", "sticky", "playhead", "popover", "dialog", "toast"] }],
		},
	},
});

// joins class names, and a later class wins over an earlier one it clashes
// with, so a component's defaults can be overridden from outside
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
