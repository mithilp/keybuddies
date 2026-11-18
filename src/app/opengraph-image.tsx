import { linkImage } from "./og";

export { size, contentType } from "./og";
export const alt = "KeyBuddies, make music with friends";

// what the home page's link shows
export default function Image() {
	return linkImage({
		title: "Make music with friends",
		line: "Start a studio, share the code, play together.",
	});
}
