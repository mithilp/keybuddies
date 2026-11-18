import { useEffect, useState } from "react";
import SoundButtons from "./SoundButtons";
import { IconType } from "react-icons";
import { Item, Sound } from "@/utils/types";
import { Placing } from "@/utils/placing";
import { listenSounds } from "@/utils/sounds";
import { removeLoop } from "@/utils/library";
import AddSound from "./AddSound";
import PlayLoop from "../PlayLoop";
import { Tip } from "../ui/tooltip";
import { IconButton } from "../ui/button";
import {
	DeleteIcon,
	DrumIcon,
	ICON,
	LibraryIcon,
	PianoIcon,
} from "../ui/icons";
import { disabled, dropTarget, selected } from "../ui/state";
import { cn } from "@/utils/cn";

// What a row is, as an icon: a piano sound, a drum sound or a loop. The
// label is its tooltip, and what a screen reader says for it.
const Kind = ({ label, icon: Icon }: { label: string; icon: IconType }) => (
	<Tip label={label}>
		<span role="img" aria-label={label} className="shrink-0">
			<Icon size={ICON} aria-hidden />
		</span>
	</Tip>
);

// Everything in this studio that can go on a track, in one list: the sounds
// that were recorded here or added by code, and then the loops that were
// added from the library. A row is picked and put on a track the same way
// whichever it is.
const Sounds = ({
	placing,
	bpm,
	studio,
	loops,
	failed,
}: {
	placing: Placing;
	bpm: string;
	studio: string;
	// the library loops this studio has
	loops: Item[];
	// gets a message when something couldn't be loaded or saved
	failed: (message: string) => void;
}) => {
	const [sounds, setSounds] = useState<Array<Sound>>([]);

	// the recorded sounds come from their own listeners. until they've
	// answered there's no telling whether the list is empty.
	const [loaded, setLoaded] = useState(false);

	// the id of the recorded sound being listened to
	const [playing, setPlaying] = useState<string | null>(null);

	useEffect(
		() =>
			listenSounds(
				studio,
				(sounds) => {
					setSounds(sounds);
					setLoaded(true);
				},
				(error) => {
					console.error(error);
					failed(
						"Couldn't load the sounds in this studio. Reload to try again."
					);
				}
			),
		[studio, failed]
	);

	const { item, dropItem } = placing;

	// a picked sound or loop that's taken out of the studio isn't picked any
	// more
	useEffect(() => {
		if (
			item?.type === "sound" &&
			!sounds.some((sound) => sound.id === item.id)
		) {
			dropItem();
		}

		if (item?.type === "loop" && !loops.some((loop) => loop.id === item.id)) {
			dropItem();
		}
	}, [item, sounds, loops, dropItem]);

	// The loop leaves the list. The clips that hold it keep it.
	const remove = (loop: Item) => {
		removeLoop(studio, loop.id).catch((error) => {
			console.error(error);
			failed(`Couldn't remove ${loop.name}. Try again.`);
		});
	};

	// A recorded sound is being listened to. The other rows wait for it,
	// unless it was taken out of the studio while it played.
	const listening = sounds.some((sound) => sound.id === playing)
		? playing
		: null;
	const busy = listening !== null;

	// A row looks picked when it's what will go on the track. While a clip or
	// an empty bar is picked instead, every row is something a click puts
	// there, and they all say so. The picked one keeps its colors while it
	// waits, the waiting look would be ink on ink.
	const row = (picked: boolean, waiting: boolean) =>
		cn(
			"flex items-center justify-between gap-2 p-2 pl-4 rounded border-control border-ink",
			picked ? selected : "bg-surface",
			!picked && placing.slot && dropTarget,
			waiting && !picked && disabled
		);

	// The name side of a row is the button that picks it, so the keyboard can
	// get to it. The buttons on the other side are their own.
	const pick = (waiting: boolean) =>
		cn(
			"flex-1 min-w-0 self-stretch flex items-center gap-2 text-left rounded",
			waiting ? "cursor-not-allowed" : "cursor-pointer"
		);

	return (
		<div className="px-4 pt-4 space-y-2">
			<h3 className="text-lg font-bold">Sounds in this studio</h3>
			{sounds.map((sound) => (
				<div
					key={sound.id}
					className={row(
						item?.type === "sound" && item.id === sound.id,
						busy && listening !== sound.id
					)}
				>
					<button
						type="button"
						className={pick(busy && listening !== sound.id)}
						aria-pressed={item?.type === "sound" && item.id === sound.id}
						onClick={() => {
							placing.pickItem({
								type: "sound",
								name: sound.name,
								id: sound.id,
								bars: sound.bars,
							});
						}}
					>
						{sound.type === "drum" ? (
							<Kind label="Drum sound" icon={DrumIcon} />
						) : (
							<Kind label="Piano sound" icon={PianoIcon} />
						)}

						<span className="text-lg truncate">{sound.name}</span>
					</button>

					<div className="flex items-center">
						<SoundButtons
							playing={listening}
							setPlaying={setPlaying}
							sound={sound}
							bpm={bpm}
							studio={studio}
							failed={failed}
						/>
					</div>
				</div>
			))}

			{loops.map((loop) => (
				<div
					key={loop.id}
					className={row(item?.type === "loop" && item.id === loop.id, busy)}
				>
					<button
						type="button"
						className={pick(busy)}
						aria-pressed={item?.type === "loop" && item.id === loop.id}
						onClick={() => placing.pickItem(loop)}
					>
						<Kind label="Loop from the library" icon={LibraryIcon} />

						<span className="text-lg truncate">{loop.name}</span>
					</button>

					<div className="flex items-center">
						<PlayLoop id={loop.id} name={loop.name} bpm={bpm} disabled={busy} />

						<IconButton
							label={`Remove ${loop.name} from this studio`}
							icon={DeleteIcon}
							disabled={busy}
							onClick={() => remove(loop)}
						/>
					</div>
				</div>
			))}

			{loaded && sounds.length === 0 && loops.length === 0 && (
				<p>
					Nothing here yet. Record a sound with an instrument, or add a loop
					from the Library.
				</p>
			)}

			<AddSound studio={studio} />
		</div>
	);
};

export default Sounds;
