import { soundsWithCode } from "@/utils/codes";
import { db } from "@/utils/firebase";
import { arrayUnion, doc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import { FaPlus } from "react-icons/fa";
import { PromptDialog } from "../Dialog";

const AddSound = ({ studio }: { studio: string }) => {
	const [asking, setAsking] = useState(false);

	// comes back with what's wrong with the code, or nothing when the sound
	// was added
	const add = async (code: string) => {
		if (!code) return "Enter the code of a sound.";

		const sounds = await soundsWithCode(code);

		if (sounds.length === 0) return "No sound has that code.";

		// two old sounds can still have the same code. sharing one of them
		// again gives it a code of its own.
		if (sounds.length > 1) {
			return "More than one sound has that code. Ask your friend to share it again for a new one.";
		}

		await updateDoc(doc(db, "sounds", sounds[0].id), {
			in: arrayUnion(studio),
		});

		setAsking(false);
	};

	return (
		<>
			<button
				onClick={() => setAsking(true)}
				className="bg-yellow p-4 w-full rounded-xl border-8 border-black cursor-pointer"
			>
				<div className="flex items-center space-x-2">
					<FaPlus size={32} />
					<div className="text-xl">Add Sound</div>
				</div>
			</button>

			{asking && (
				<PromptDialog
					title="Add a friend's sound"
					hint="Ask your friend for the code to their sound and enter it here."
					label="Sound code"
					placeholder="6 digit code"
					maxLength={6}
					submit="Add Sound"
					onSubmit={add}
					onCancel={() => setAsking(false)}
				/>
			)}
		</>
	);
};

export default AddSound;
