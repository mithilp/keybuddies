import { cn } from "@/utils/cn";
import { buttonStyles } from "./ui/button";
import { ICON, LibraryIcon, TracksIcon } from "./ui/icons";

export type View = "sounds" | "tracks";

const tabs = [
	{ view: "sounds", label: "Sounds", icon: LibraryIcon },
	{ view: "tracks", label: "Tracks", icon: TracksIcon },
] as const;

// The bottom of the studio on a phone or a portrait iPad, where the sidebar
// and the tracks don't both fit: one button for each. It pads itself above
// the home bar.
const TabBar = ({
	view,
	show,
	className,
}: {
	view: View;
	show: (view: View) => void;
	className?: string;
}) => (
	<nav
		aria-label="Studio"
		className={cn(
			"grid grid-cols-2 gap-2 bg-page border-t-frame border-ink px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]",
			className
		)}
	>
		{tabs.map(({ view: tab, label, icon: Icon }) => (
			<button
				key={tab}
				type="button"
				onClick={() => show(tab)}
				aria-pressed={view === tab}
				className={buttonStyles({
					className: "h-12 font-bold",
				})}
			>
				<Icon size={ICON} aria-hidden />
				{label}
			</button>
		))}
	</nav>
);

export default TabBar;
