import { db } from "@/utils/firebase";
import { playDrum, playPiano } from "@/utils/instruments";
import { Sound } from "@/utils/types";
import {
	addDoc,
	arrayRemove,
	collection,
	doc,
	getDoc,
	updateDoc,
} from "firebase/firestore";
import React, { useState } from "react";
import { FaCopy, FaEdit, FaShare, FaTrash, FaVolumeUp } from "react-icons/fa";

import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import EditPianoSound from "./EditPianoSound";

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
	setPlaying: Function;
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

	const share = async () => {
		const soundData = await getDoc(doc(db, `sounds`, sound.id));

		const code = soundData.data()!.code;

		alert(
			`Share this code with your friends to let them use this sound: ${code}`
		);
	};

	const duplicate = () => {
		addDoc(collection(db, "sounds"), {
			name: prompt("Name this duplicated sound:") || sound.name + " copy",
			type: sound.type,
			sequence: sound.sequence,
			in: [studio],
			code: Math.floor(100000 + Math.random() * 900000).toString(),
		});
	};

	return (
		<>
			{/* buttons */}
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger>
						<button
							disabled={playing != index && playing != -1}
							className="h-5 w-5"
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
					</TooltipTrigger>
					<TooltipContent>
						<p>Play Audio</p>
					</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger>
						<button
							className="h-5 w-5"
							disabled={playing != index && playing != -1}
							onClick={edit}
						>
							<FaEdit className="w-full h-full" />
						</button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Edit Audio</p>
					</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger>
						<button
							className="h-5 w-5"
							disabled={playing != index && playing != -1}
							onClick={duplicate}
						>
							<FaCopy className="w-full h-full" />
						</button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Duplicate Audio</p>
					</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger>
						<button
							className="h-5 w-5"
							disabled={playing != index && playing != -1}
							onClick={share}
						>
							<FaShare className="w-full h-full" />
						</button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Share Audio</p>
					</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger>
						<button
							className="h-5 w-5"
							disabled={playing != index && playing != -1}
							onClick={() => {
								if (confirm("Are you sure you want to delete this sound?")) {
									updateDoc(doc(db, `sounds`, sound.id), {
										in: arrayRemove(studio),
									});
								}
							}}
						>
							<FaTrash className="w-full h-full" />
						</button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Delete Audio</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>

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
