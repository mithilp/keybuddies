import Image from "next/image";
import logo from "../../../public/images/keybuddies-logo.png";
import { Placing } from "@/utils/placing";
import Instruments from "./Instruments";
import Loops from "./Loops";
import Sounds from "./Sounds";

// The left side of the studio. It's one panel that scrolls on its own, with
// everything that can go in a cell in it.
const Sidebar = ({
	placing,
	bpm,
	studio,
}: {
	placing: Placing;
	bpm: string;
	studio: string;
}) => {
	return (
		<div className="col-span-1 bg-blue text-black overflow-y-scroll h-screen border-r-8 border-black">
			<div className="pt-[10px] px-4">
				<Image alt="KeyBuddies Logo" src={logo} width={200} height={45} />
			</div>

			<Instruments bpm={bpm} studio={studio} />

			<Sounds placing={placing} bpm={bpm} studio={studio} />

			<Loops placing={placing} bpm={bpm} />
		</div>
	);
};

export default Sidebar;
