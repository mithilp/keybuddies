import { FaCircleXmark } from "react-icons/fa6";
import { Tip } from "@/components/ui/tooltip";

const PianoModalHeader = ({ close }: { close: () => void }) => {
	return (
		<div className="flex justify-between items-center">
			<h3 className="text-2xl font-bold">Record a Piano Sound</h3>
			<Tip label="Close" side="left">
				<button onClick={close} aria-label="Close">
					<FaCircleXmark size={32} />
				</button>
			</Tip>
		</div>
	);
};

export default PianoModalHeader;
