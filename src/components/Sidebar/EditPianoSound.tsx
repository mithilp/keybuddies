import { Key, Sound } from "@/utils/types";
import PianoEditor from "../instruments/Piano/PianoEditor";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/utils/firebase";
import Panel from "../Panel";
import { soundBars } from "@/utils/clips";

const EditPianoSound = ({
	close,
	sound,
	bpm,
}: {
	close: () => void;
	sound: Sound;
	bpm: number;
}) => {
	const update = async (sequence: Key[]) => {
		await updateDoc(doc(db, "sounds", sound.id), {
			sequence: sequence,
		});

		close();
	};

	return (
		<Panel title={`Edit ${sound.name}`} close={close}>
			<PianoEditor
				bpm={bpm}
				initial={sound.sequence}
				// a recording keeps the length it was made with
				bars={soundBars(sound.bars)}
				saveLabel="Update Recording"
				onSave={update}
			/>
		</Panel>
	);
};

export default EditPianoSound;
