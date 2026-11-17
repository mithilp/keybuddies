import Image from "next/image";
import logo from "../../../public/images/keybuddies-logo.png";
import { Placing } from "@/utils/placing";
import { Cell } from "@/utils/types";
import Instruments from "./Instruments";
import Library from "./Library";
import Sounds from "./Sounds";

// The left side of the studio. It's one panel that scrolls on its own: the
// instruments to record with, everything in the studio that can go in a
// cell, and the way into the library.
const Sidebar = ({
	placing,
	bpm,
	studio,
	loops,
}: {
	placing: Placing;
	bpm: string;
	studio: string;
	// the library loops this studio has
	loops: Cell[];
}) => {
	return (
		<div className="col-span-1 bg-blue text-black overflow-y-scroll h-screen border-r-8 border-black">
			<div className="pt-[10px] px-4">
				<Image alt="KeyBuddies Logo" src={logo} width={200} height={45} />
			</div>

			<Instruments bpm={bpm} studio={studio} />

			<Sounds placing={placing} bpm={bpm} studio={studio} loops={loops} />

			<div className="p-4 pt-2">
				<Library bpm={bpm} studio={studio} loops={loops} />
			</div>
		</div>
	);
};

export default Sidebar;
