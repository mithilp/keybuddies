import { useEffect, useState } from "react";
import Piano from "../instruments/Piano/Piano";
import SoundButtons from "./SoundButtons";
import Drum from "../instruments/Drum";
import { MdPiano } from "react-icons/md";
import { FaDrum } from "react-icons/fa";
import { SelectedCell, Sound, Track } from "@/utils/types";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/utils/firebase";
import AddSound from "./AddSound";
import { setCell } from "@/utils/cells";
import Notice from "../Notice";

const Instruments = ({
	setSelectedCell,
	selectedCell,
	tracks,
	bpm,
	studio,
}: {
	setSelectedCell: (cell: SelectedCell) => void;
	selectedCell: SelectedCell;
	tracks: Track[];
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

	const addToTrack = (sound: Sound) => {
		if (!selectedCell) return;

		const track = tracks.find((track) => track.id === selectedCell.track);
		if (track) {
			setCell(studio, track.id, selectedCell.index, {
				name: sound.name,
				id: sound.id,
				type: "sound",
			}).catch((error) => {
				console.error(error);
				setNotice("Couldn't put the sound in. Try again.");
			});
		}
		setSelectedCell(null);
	};

	return (
		<div className="p-4 space-y-2">
			<h3 className="text-lg font-medium">Record a New Sound</h3>
			<Piano studio={studio} bpm={Number(bpm)} />
			<Drum bpm={Number(bpm)} studio={studio} />
			<h3 className="text-lg font-medium">Recorded Sounds</h3>
			{sounds.map((sound, index) => (
				<div
					key={index}
					onClick={() => addToTrack(sound)}
					className={`bg-yellow flex justify-between p-4 rounded-xl border-8 ${
						selectedCell ? "border-pink" : "border-black"
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

export default Instruments;
