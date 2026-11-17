import { useEffect, useState } from "react";
import SoundButtons from "./SoundButtons";
import { MdPiano } from "react-icons/md";
import { FaDrum } from "react-icons/fa";
import { Sound } from "@/utils/types";
import { Placing } from "@/utils/placing";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/utils/firebase";
import AddSound from "./AddSound";
import Notice from "../Notice";

// the sounds that were recorded in this studio, or added to it by code
const Sounds = ({
	placing,
	bpm,
	studio,
}: {
	placing: Placing;
	bpm: string;
	studio: string;
}) => {
	const [sounds, setSounds] = useState<Array<Sound>>([]);

	const [playing, setPlaying] = useState<number>(-1);

	const [notice, setNotice] = useState("");

	useEffect(() => {
		const soundsUnsub = onSnapshot(
			query(collection(db, `sounds`), where("in", "array-contains", studio)),
			(querySnapshot) => {
				const freshSounds: Array<Sound> = [];
				querySnapshot.forEach((doc) => {
					freshSounds.push({
						name: doc.data().name,
						type: doc.data().type,
						sequence: doc.data().sequence,
						id: doc.id,
						code: doc.data().code,
					});
				});
				setSounds(freshSounds);
			},
			(error) => {
				console.error(error);
				setNotice("Couldn't load the recorded sounds. Reload to try again.");
			}
		);

		return soundsUnsub;
	}, [studio]);

	const { item, dropItem } = placing;

	// a picked sound that's taken out of the studio isn't picked any more
	useEffect(() => {
		if (item?.type == "sound" && !sounds.some((sound) => sound.id == item.id)) {
			dropItem();
		}
	}, [item, sounds, dropItem]);

	return (
		<div className="px-4 pt-4 space-y-2">
			<h3 className="text-lg font-medium">Recorded Sounds</h3>
			{sounds.map((sound, index) => (
				<div
					key={index}
					onClick={() => {
						placing.pickItem({ type: "sound", name: sound.name, id: sound.id });
					}}
					// Pink is what a click does something to. While a cell is
					// picked that's every sound, otherwise it's the picked one.
					className={`bg-yellow flex justify-between p-4 rounded-xl border-8 ${
						placing.cell || (item?.type == "sound" && item.id == sound.id)
							? "border-pink"
							: "border-black"
					} ${
						playing != index && playing != -1 ? "opacity-50" : "cursor-pointer"
					}`}
				>
					<div className="w-full flex items-center justify-between space-x-2">
						<div className="flex items-center space-x-2">
							{sound.type == "drum" ? (
								<FaDrum size={32} />
							) : (
								<MdPiano size={32} />
							)}

							<div className="text-xl">{sound.name}</div>
						</div>

						{/* a click on a button isn't a click on the sound */}
						<div
							className="flex items-center space-x-2"
							onClick={(event) => event.stopPropagation()}
						>
							<SoundButtons
								index={index}
								playing={playing}
								setPlaying={setPlaying}
								sound={sound}
								bpm={bpm}
								studio={studio}
							/>
						</div>
					</div>
				</div>
			))}

			<AddSound studio={studio} />

			{notice && <Notice message={notice} close={() => setNotice("")} />}
		</div>
	);
};

export default Sounds;
