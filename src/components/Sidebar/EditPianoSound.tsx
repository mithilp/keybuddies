import { Key, Sound } from "@/utils/types";
import { FaCircleXmark } from "react-icons/fa6";
import { Tip } from "@/components/ui/tooltip";
import PianoEditor from "../instruments/Piano/PianoEditor";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/utils/firebase";

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
		<div className="fixed top-0 left-0 z-20 w-screen h-screen p-12">
			<div className="bg-blue border-8 border-black h-full rounded-xl p-8 space-y-2">
				<div className="flex justify-between items-center">
					<h3 className="text-2xl font-bold">Edit {sound.name}</h3>
					<Tip label="Close" side="left">
						<button onClick={close} aria-label="Close">
							<FaCircleXmark size={32} />
						</button>
					</Tip>
				</div>

				<PianoEditor
					bpm={bpm}
					initial={sound.sequence}
					saveLabel="Update Recording"
					onSave={update}
				/>
			</div>
		</div>
	);
};

export default EditPianoSound;
