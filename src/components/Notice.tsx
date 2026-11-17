import { IconButton } from "./ui/button";
import { CloseIcon, ErrorIcon, ICON } from "./ui/icons";

// What went wrong on the page, pinned to the bottom of the screen until it's
// closed. A page has one of these, and everything under it sends its
// problems up to it.
const Notice = ({ message, close }: { message: string; close: () => void }) => {
	return (
		<div
			role="alert"
			className="fixed bottom-6 left-1/2 -translate-x-1/2 z-toast max-w-[90vw] flex items-center gap-4 bg-surface text-danger border-control border-ink rounded pl-4 pr-1 py-1 text-lg font-bold"
		>
			<ErrorIcon size={ICON} aria-hidden className="shrink-0" />
			<div>{message}</div>
			<IconButton
				label="Close"
				icon={CloseIcon}
				className="text-ink"
				onClick={close}
			/>
		</div>
	);
};

export default Notice;
