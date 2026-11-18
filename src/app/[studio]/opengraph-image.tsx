import { isStudioCode } from "@/utils/studio-code";
import { linkImage } from "../og";

export { size, contentType } from "../og";
export const alt = "Join my studio on KeyBuddies";

// what a studio's link shows when it's sent to someone
export default async function Image({
	params,
}: {
	params: Promise<{ studio: string }>;
}) {
	const { studio } = await params;

	return linkImage({
		title: "Join my studio on KeyBuddies",
		code: isStudioCode(studio) ? studio : undefined,
		line: "Make music together, right in your browser.",
	});
}
