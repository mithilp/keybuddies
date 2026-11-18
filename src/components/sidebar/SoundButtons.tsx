import { shareCode } from "@/utils/codes";
import { playDrum, playPiano } from "@/utils/instruments";
import { soundBars } from "@/utils/clips";
import { NAME_LENGTH, copyName, removeSound, saveSound } from "@/utils/sounds";
import { Sound } from "@/utils/types";
import { useEffect, useRef, useState } from "react";
import { IconButton } from "../ui/button";
import {
	CopyIcon,
	DeleteIcon,
	EditIcon,
	ICON,
	MoreIcon,
	ShareIcon,
	SoundIcon,
} from "../ui/icons";
import { Menu, MenuItem } from "../ui/menu";
import EditPianoSound from "./EditPianoSound";
import { ConfirmDialog, PromptDialog, ShareDialog } from "../Dialog";

// The buttons on a recorded sound's row in the sidebar: Play, and a menu
// with the rest. `playing` is the id
// of the sound being listened to, if one is. The other rows wait for it.
const SoundButtons = ({
	playing,
	sound,
	setPlaying,
	bpm,
	studio,
	failed,
}: {
	playing: string | null;
	sound: Sound;
	setPlaying: (id: string | null) => void;
	bpm: string;
	studio: string;
	// gets a message when something couldn't be done
	failed: (message: string) => void;
}) => {
	const [open, setOpen] = useState(false);

	// another sound is being listened to
	const waiting = playing !== null && playing !== sound.id;

	// ends the listen once the sound is over
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	// a row that goes away mid-listen ends the listen now, so the other rows
	// don't wait on it and it doesn't spin if the sound comes back
	useEffect(
		() => () => {
			if (timer.current) {
				clearTimeout(timer.current);
				setPlaying(null);
			}
		},
		[setPlaying]
	);

	const listen = () => {
		if (playing !== null) return;

		setPlaying(sound.id);

		if (sound.type === "piano") {
			playPiano(sound.sequence, Number(bpm), sound.bars);
		} else if (sound.type === "drum") {
			playDrum(sound.sequence, Number(bpm), sound.steps, sound.bars);
		}

		timer.current = setTimeout(
			() => {
				timer.current = null;
				setPlaying(null);
			},
			(soundBars(sound.bars) * 240000) / Number(bpm)
		);
	};

	const edit = () => {
		setOpen(true);
	};

	// which dialog is open, if one is
	const [asking, setAsking] = useState<"share" | "copy" | "delete" | null>(
		null
	);

	// the code that's being shared, once it's known to be this sound's alone
	const [code, setCode] = useState("");

	const share = async () => {
		try {
			setCode(await shareCode(sound.id, sound.code));
			setAsking("share");
		} catch (error) {
			console.error(error);
			failed("Couldn't get the code for this sound. Try again.");
		}
	};

	const duplicate = async (name: string) => {
		await saveSound(studio, {
			name: name || copyName(sound.name),
			type: sound.type,
			sequence: sound.sequence,
			// a copy of a beat is on the same grid and as long as the beat. an
			// old one has no steps or length and its copy has none either.
			steps: sound.steps,
			bars: sound.bars,
		});

		setAsking(null);
	};

	// the sound leaves this studio. it stays in any other studio it was
	// shared to.
	const remove = async () => {
		setAsking(null);

		try {
			await removeSound(studio, sound.id);
		} catch (error) {
			console.error(error);
			failed("Couldn't delete the sound. Try again.");
		}
	};

	return (
		<>
			<IconButton
				label={`Play ${sound.name}`}
				icon={SoundIcon}
				busy={playing === sound.id}
				disabled={waiting}
				onClick={listen}
			/>

			{/* the rest are in a menu, with their names written out */}
			<Menu
				label={`More for ${sound.name}`}
				buttonClassName="min-w-10 min-h-10 pointer-coarse:min-w-11 pointer-coarse:min-h-11 p-0"
				button={<MoreIcon size={ICON} aria-hidden />}
			>
				{(close) => {
					const item = (run: () => void) => () => {
						close();
						run();
					};

					return (
						<>
							{/* only piano has an editor so far */}
							{sound.type === "piano" && (
								<MenuItem disabled={waiting} onClick={item(edit)}>
									<EditIcon size={ICON} aria-hidden />
									Edit
								</MenuItem>
							)}
							<MenuItem
								disabled={waiting}
								onClick={item(() => setAsking("copy"))}
							>
								<CopyIcon size={ICON} aria-hidden />
								Duplicate
							</MenuItem>
							<MenuItem disabled={waiting} onClick={item(share)}>
								<ShareIcon size={ICON} aria-hidden />
								Share
							</MenuItem>
							<MenuItem
								disabled={waiting}
								onClick={item(() => setAsking("delete"))}
							>
								<DeleteIcon size={ICON} aria-hidden />
								Delete
							</MenuItem>
						</>
					);
				}}
			</Menu>

			{asking === "share" && (
				<ShareDialog
					title="Share this sound"
					hint="A friend can add it to their studio with this code."
					code={code}
					onClose={() => setAsking(null)}
				/>
			)}

			{asking === "copy" && (
				<PromptDialog
					title="Duplicate this sound"
					label="Name of the copy"
					initial={copyName(sound.name)}
					maxLength={NAME_LENGTH}
					submit="Duplicate"
					onSubmit={duplicate}
					onCancel={() => setAsking(null)}
				/>
			)}

			{asking === "delete" && (
				<ConfirmDialog
					title="Delete this sound?"
					message={`${sound.name} will be taken out of this studio.`}
					confirm="Delete"
					danger
					onConfirm={remove}
					onCancel={() => setAsking(null)}
				/>
			)}

			{open && sound.type === "piano" && (
				<EditPianoSound
					bpm={Number(bpm)}
					sound={sound}
					close={() => setOpen(false)}
				/>
			)}
		</>
	);
};

export default SoundButtons;
