import { shareCode } from "@/utils/codes";
import { playDrum, playPiano } from "@/utils/instruments";
import { soundBars } from "@/utils/clips";
import { NAME_LENGTH, copyName, removeSound, saveSound } from "@/utils/sounds";
import { Sound } from "@/utils/types";
import React, { useState } from "react";
import { IconButton } from "../ui/button";
import {
	CopyIcon,
	DeleteIcon,
	EditIcon,
	ShareIcon,
	SoundIcon,
} from "../ui/icons";
import EditPianoSound from "./EditPianoSound";
import { ConfirmDialog, PromptDialog, ShareDialog } from "../Dialog";

const SoundThumbnail = ({
	playing,
	index,
	sound,
	setPlaying,
	bpm,
	studio,
	failed,
}: {
	playing: number;
	index: number;
	sound: Sound;
	setPlaying: (index: number) => void;
	bpm: string;
	studio: string;
	// gets a message when something couldn't be done
	failed: (message: string) => void;
}) => {
	const [open, setOpen] = useState(false);

	function playSound(sound: Sound) {
		if (sound.type == "piano") {
			playPiano(sound.sequence, Number(bpm), sound.bars);
		} else if (sound.type == "drum") {
			playDrum(sound.sequence, Number(bpm), sound.steps, sound.bars);
		}
	}

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
				busy={playing == index}
				disabled={playing != index && playing != -1}
				onClick={() => {
					if (playing == -1) {
						setPlaying(index);
						playSound(sound);
						setTimeout(
							() => {
								setPlaying(-1);
							},
							(soundBars(sound.bars) * 240000) / Number(bpm)
						);
					}
				}}
			/>

			{/* only piano has an editor so far */}
			{sound.type == "piano" && (
				<IconButton
					label={`Edit ${sound.name}`}
					icon={EditIcon}
					disabled={playing != index && playing != -1}
					onClick={edit}
				/>
			)}

			<IconButton
				label={`Duplicate ${sound.name}`}
				icon={CopyIcon}
				disabled={playing != index && playing != -1}
				onClick={() => setAsking("copy")}
			/>

			<IconButton
				label={`Share ${sound.name}`}
				icon={ShareIcon}
				disabled={playing != index && playing != -1}
				onClick={share}
			/>

			<IconButton
				label={`Delete ${sound.name}`}
				icon={DeleteIcon}
				disabled={playing != index && playing != -1}
				onClick={() => setAsking("delete")}
			/>

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

			{/* edit sound modal */}
			{/* if piano */}
			{open && sound.type == "piano" && (
				<EditPianoSound
					bpm={Number(bpm)}
					sound={sound}
					close={() => setOpen(false)}
				/>
			)}
		</>
	);
};

export default SoundThumbnail;
