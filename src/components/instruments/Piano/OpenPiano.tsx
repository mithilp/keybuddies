import { MdPiano } from "react-icons/md";

const OpenPiano = ({ setOpen }: { setOpen: Function }) => {
	return (
		<button
			onClick={() => setOpen(!open)}
			className="bg-yellow p-4 w-full rounded-xl border-8 border-black cursor-pointer"
		>
			<div className="flex items-center space-x-2">
				<MdPiano size={32} />
				<div className="text-xl">Piano</div>
			</div>
		</button>
	);
};

export default OpenPiano;
