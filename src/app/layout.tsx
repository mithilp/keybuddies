import type { Metadata } from "next";
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
