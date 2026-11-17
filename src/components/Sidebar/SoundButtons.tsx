import { freeSoundCode, shareCode } from "@/utils/codes";
import { db } from "@/utils/firebase";
import { playDrum, playPiano } from "@/utils/instruments";
import { Sound } from "@/utils/types";
import {
	addDoc,
	arrayRemove,
	collection,
	doc,
	updateDoc,
} from "firebase/firestore";
import React, { useState } from "react";
import { FaCopy, FaEdit, FaShare, FaTrash, FaVolumeUp } from "react-icons/fa";

import { Tip } from "@/components/ui/tooltip";
import EditPianoSound from "./EditPianoSound";
import { ConfirmDialog, PromptDialog, ShareDialog } from "../Dialog";
import Notice from "../Notice";

const SoundThumbnail = ({
	playing,
	index,
	sound,
	setPlaying,
	bpm,
	studio,
}: {
	playing: number;
	index: number;
	sound: Sound;
	setPlaying: (index: number) => void;
	bpm: string;
	studio: string;
}) => {
	const [open, setOpen] = useState(false);

	function playSound(sound: Sound) {
		if (sound.type == "piano") {
			playPiano(sound.sequence, Number(bpm));
		} else if (sound.type == "drum") {
			playDrum(sound.sequence, Number(bpm));
		}
	}

	const edit = () => {
		setOpen(true);
	};

	// which dialog is open, if one is
	const [asking, setAsking] = useState<"share" | "copy" | "delete" | null>(
		null
	);
	const [notice, setNotice] = useState("");

	// the code that's being shared, once it's known to be this sound's alone
	const [code, setCode] = useState("");

	const share = async () => {
		try {
			setCode(await shareCode(sound.id, sound.code));
			setAsking("share");
		} catch (error) {
			console.error(error);
			setNotice("Couldn't get the code for this sound. Try again.");
		}
	};

	const duplicate = async (name: string) => {
		await addDoc(collection(db, "sounds"), {
			name: name || sound.name + " copy",
			type: sound.type,
			sequence: sound.sequence,
			in: [studio],
			code: await freeSoundCode(),
		});

		setAsking(null);
	};

	// the sound leaves this studio. it stays in any other studio it was
	// shared to.
	const remove = async () => {
		setAsking(null);

		try {
			await updateDoc(doc(db, `sounds`, sound.id), {
				in: arrayRemove(studio),
			});
		} catch (error) {
			console.error(error);
			setNotice("Couldn't delete the sound. Try again.");
		}
	};

	return (
		<>
			{/* buttons */}
			<Tip label="Play">
				<button
					disabled={playing != index && playing != -1}
					className="h-5 w-5"
					aria-label={`Play ${sound.name}`}
					onClick={() => {
						if (playing == -1) {
							setPlaying(index);
							playSound(sound);
							setTimeout(() => {
								setPlaying(-1);
							}, 480000 / Number(bpm));
						}
					}}
				>
					{playing == index ? (
						<div className="animate-spin w-full h-full border-4 border-black border-b-transparent rounded-full"></div>
					) : (
						<FaVolumeUp className="w-full h-full" />
					)}
				</button>
			</Tip>

			{/* only piano has an editor so far */}
			{sound.type == "piano" && (
				<Tip label="Edit">
					<button
						className="h-5 w-5"
						disabled={playing != index && playing != -1}
						aria-label={`Edit ${sound.name}`}
						onClick={edit}
					>
						<FaEdit className="w-full h-full" />
					</button>
				</Tip>
			)}

			<Tip label="Duplicate">
				<button
					className="h-5 w-5"
					disabled={playing != index && playing != -1}
					aria-label={`Duplicate ${sound.name}`}
					onClick={() => setAsking("copy")}
				>
					<FaCopy className="w-full h-full" />
				</button>
			</Tip>

			<Tip label="Share">
				<button
					className="h-5 w-5"
					disabled={playing != index && playing != -1}
					aria-label={`Share ${sound.name}`}
					onClick={share}
				>
					<FaShare className="w-full h-full" />
				</button>
			</Tip>

			<Tip label="Delete">
				<button
					className="h-5 w-5"
					disabled={playing != index && playing != -1}
					aria-label={`Delete ${sound.name}`}
					onClick={() => setAsking("delete")}
				>
					<FaTrash className="w-full h-full" />
				</button>
			</Tip>

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
					initial={`${sound.name} copy`}
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
					onConfirm={remove}
					onCancel={() => setAsking(null)}
				/>
			)}

			{notice && <Notice message={notice} close={() => setNotice("")} />}

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
