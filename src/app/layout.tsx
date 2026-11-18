import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";

// the one typeface, as a CSS variable that tailwind's font-sans points at
const font = Space_Grotesk({
	subsets: ["latin"],
	weight: ["400", "700"],
	variable: "--font-sans",
});

export const metadata: Metadata = {
	title: "KeyBuddies",
	description: "Learn and create music with friends in real-time!",
	openGraph: {
		title: "KeyBuddies",
		description: "Start a studio, share the code, and make music together.",
		type: "website",
		siteName: "KeyBuddies",
	},
	twitter: { card: "summary_large_image" },
};

// phones draw the page at their own width instead of a shrunk desktop page.
// cover lets the page go under the notch and the home bar, and the parts
// that sit at the edges pad themselves with the safe area insets. pinch zoom
// stays on.
export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	viewportFit: "cover",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={font.variable}>
			<body className="font-sans">
				<TooltipProvider>{children}</TooltipProvider>
			</body>
		</html>
	);
}
