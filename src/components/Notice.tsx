import { FaCircleXmark } from "react-icons/fa6";
import { Tip } from "./ui/tooltip";

// a small message pinned to the bottom of the screen until it's closed
const Notice = ({ message, close }: { message: string; close: () => void }) => {
	return (
		<div
			role="alert"
			className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 max-w-[90vw] flex items-center space-x-4 bg-yellow border-8 border-black rounded-xl px-4 py-2 text-lg font-bold"
		>
			<div>{message}</div>
			<Tip label="Close">
				<button onClick={close} aria-label="Close">
					<FaCircleXmark size={24} />
				</button>
			</Tip>
		</div>
	);
};

export default Notice;
