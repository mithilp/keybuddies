import { useEffect, useState } from "react";
import Piano from "../instruments/Piano/Piano";
import Guitar from "../instruments/Guitar";
import Drum from "../instruments/Drum";
import { MdPiano } from "react-icons/md";
import { FaGuitar, FaTrash } from "react-icons/fa";
import { Sound, Track } from "@/utils/types";
import { drum, piano } from "@/utils/instruments";
import {
	collection,
	deleteDoc,
	doc,
	onSnapshot,
	updateDoc,
} from "firebase/firestore";
import { db } from "@/utils/firebase";

const Instruments = ({
	setSelectedCell,
	selectedCell,
	tracks,
	bpm,
	studio,
}: {
	setSelectedCell: Function;
	selectedCell: any[];
	tracks: Track[];
	bpm: string;
	studio: string;
}) => {
	const [sounds, setSounds] = useState<Array<Sound>>([]);

	useEffect(() => {
		const soundsUnsub = onSnapshot(
			collection(db, `studios/${studio}/sounds`),
			(querySnapshot) => {
				const freshSounds: Array<Sound> = [];
				querySnapshot.forEach((doc) => {
					freshSounds.push({
						name: doc.data().name,
						type: doc.data().type,
						sequence: doc.data().sequence,
						id: doc.id,
					});
				});
				setSounds(freshSounds);
			}
		);
	}, []);

	return (
		<div className="p-4 space-y-2">
			<h3 className="text-lg font-medium">Record a New Sound</h3>
			<Piano piano={piano!} studio={studio} bpm={Number(bpm)} />
			<Guitar bpm={Number(bpm)} />
			<Drum bpm={Number(bpm)} studio={studio} drum={drum!} />
			<h3 className="text-lg font-medium">Recorded Sounds</h3>
			{sounds.map((sound, index) => (
				<div
					key={index}
					onClick={async () => {
						if (selectedCell[0] != -1) {
							const track = tracks.find(
								(track) => track.id === selectedCell[0]
							);
							if (track) {
								track.notes[selectedCell[1]] = {
									name: sound.name,
									id: sound.id,
									type: "sound",
								};
								await updateDoc(
									doc(db, "studios", studio, "tracks", selectedCell[0]),
									{
										notes: track.notes,
									}
								);
							}
							setSelectedCell([-1, -1]);
						}
					}}
					className={`bg-yellow cursor-pointer flex justify-between p-4 rounded-xl border-8 ${
						selectedCell[0] != -1 ? "border-pink" : "border-black"
					}`}
				>
					<div className="w-full flex items-center justify-between space-x-2">
						<div className="flex items-center space-x-2">
							{sound.type == "piano" ? (
								<MdPiano size={32} />
							) : (
								<FaGuitar size={32} />
							)}

							<div className="text-xl">{sound.name}</div>
						</div>

						<button
							className="text-2xl"
							onClick={() => {
								if (confirm("Are you sure you want to delete this sound?")) {
									deleteDoc(doc(db, `studios/${studio}/sounds`, sound.id));
								}
							}}
						>
							<FaTrash />
						</button>
					</div>
				</div>
			))}
		</div>
	);
};

export default Instruments;
