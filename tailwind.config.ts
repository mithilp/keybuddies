import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";
import plugin from "tailwindcss/plugin";

// The design tokens. Every value lives in a CSS variable in globals.css, and
// components use the role names here, never a hue or a hex. Most scales are
// replaced rather than extended, so a class that isn't one of these (say
// font-black or border-8) doesn't exist and can't creep back in.
const config: Config = {
	content: [
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	future: {
		// hover: styles only where there is a real pointer, so a tap on a
		// touch screen doesn't leave something looking hovered
		hoverOnlyWhenSupported: true,
	},
	theme: {
		colors: {
			transparent: "transparent",
			current: "currentColor",
			// the page behind everything
			page: "rgb(var(--page) / <alpha-value>)",
			// cards, controls and anything filled
			surface: "rgb(var(--surface) / <alpha-value>)",
			// what's picked, what's primary, panels
			accent: "rgb(var(--accent) / <alpha-value>)",
			// text, borders, and the fill of anything selected or live
			ink: "rgb(var(--ink) / <alpha-value>)",
			// empty things and tooltips
			paper: "rgb(var(--paper) / <alpha-value>)",
			// errors
			danger: "rgb(var(--danger) / <alpha-value>)",
		},
		borderWidth: {
			0: "0",
			// the sidebar, the track area, dialogs, panels and the home card
			frame: "var(--border-frame)",
			// buttons, inputs, clips, cells and menus
			control: "var(--border-control)",
			// dividers
			hair: "var(--border-hair)",
		},
		borderRadius: {
			none: "0",
			DEFAULT: "var(--radius)",
			full: "9999px",
		},
		boxShadow: {
			none: "none",
			// what a primary button stands on
			pop: "4px 4px 0 0 rgb(var(--ink))",
		},
		fontFamily: {
			sans: ["var(--font-sans)", ...defaultTheme.fontFamily.sans],
		},
		fontWeight: {
			normal: "400",
			bold: "700",
		},
		fontSize: {
			sm: ["0.875rem", { lineHeight: "1.25rem" }],
			base: ["1rem", { lineHeight: "1.5rem" }],
			lg: ["1.25rem", { lineHeight: "1.75rem" }],
			xl: ["1.5rem", { lineHeight: "2rem" }],
			"2xl": ["2rem", { lineHeight: "2.5rem" }],
			"3xl": ["3rem", { lineHeight: "1" }],
		},
		zIndex: {
			base: "0",
			// the studio header, sticky rows and columns
			sticky: "10",
			playhead: "20",
			// menus and popups over the page
			popover: "30",
			dialog: "40",
			// notices and tooltips, over everything
			toast: "50",
		},
	},
	plugins: [
		// pointer-coarse: styles for a finger instead of a mouse, mostly to
		// make things at least 44px to hit. it goes by the main pointer.
		plugin(({ addVariant }) => {
			addVariant("pointer-coarse", "@media (pointer: coarse)");
		}),
	],
};
export default config;
