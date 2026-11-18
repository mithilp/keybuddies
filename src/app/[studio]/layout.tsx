import type { Metadata } from "next";
import { isStudioCode } from "@/utils/studio-code";

// What a studio's link says when it's sent to someone. The page itself runs
// in the browser, so this lives here. The picture is opengraph-image.tsx.
export async function generateMetadata({
	params,
}: {
	params: Promise<{ studio: string }>;
}): Promise<Metadata> {
	const { studio } = await params;
	if (!isStudioCode(studio)) return {};

	const title = "Join my studio on KeyBuddies";
	const description = `Studio ${studio}. Open the link to make music with me, no account needed.`;

	// the browser tab says which studio this is, the link says come in
	return {
		title: `Studio ${studio} · KeyBuddies`,
		description: description,
		openGraph: { title, description, type: "website", siteName: "KeyBuddies" },
		twitter: { card: "summary_large_image", title, description },
	};
}

export default function StudioLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
