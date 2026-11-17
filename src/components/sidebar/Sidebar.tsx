import Image from "next/image";
import logo from "../../../public/images/keybuddies-logo.png";
import { Placing } from "@/utils/placing";
import { Item } from "@/utils/types";
import { cn } from "@/utils/cn";
import Instruments from "./Instruments";
import Library from "./Library";
import Sounds from "./Sounds";

// The left side of the studio, or the Sounds tab on a phone. It's one panel
// that scrolls on its own: the instruments to record with, everything in the
// studio that can go on a track, and the way into the library.
const Sidebar = ({
	placing,
	bpm,
	studio,
	loops,
	failed,
	className,
}: {
	placing: Placing;
	bpm: string;
	studio: string;
	// the library loops this studio has
	loops: Item[];
	// gets a message when something couldn't be loaded or saved
	failed: (message: string) => void;
	className?: string;
}) => {
	return (
		<div
			className={cn(
				"min-h-0 bg-accent overflow-y-auto overscroll-contain lg:border-r-frame border-ink",
				className
			)}
		>
			<div className="pt-[10px] px-4">
				<Image alt="KeyBuddies Logo" src={logo} width={200} height={45} />
			</div>

			<Instruments bpm={bpm} studio={studio} />

			<Sounds
				placing={placing}
				bpm={bpm}
				studio={studio}
				loops={loops}
				failed={failed}
			/>

			<div className="p-4 pt-2">
				<Library bpm={bpm} studio={studio} loops={loops} />
			</div>
		</div>
	);
};

export default Sidebar;
