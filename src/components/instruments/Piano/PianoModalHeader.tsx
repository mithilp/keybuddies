import { FaCircleXmark } from "react-icons/fa6";

const PianoModalHeader = ({ close }: { close: () => void }) => {
	return (
		<div className="flex justify-between items-center">
			<h3 className="text-2xl font-bold">Record a Piano Sound</h3>
			<button onClick={close}>
				<FaCircleXmark size={32} />
			</button>
		</div>
	);
};

export default PianoModalHeader;
