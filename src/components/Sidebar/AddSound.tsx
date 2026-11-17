import { soundWithCode } from "@/utils/codes";
import { addSound } from "@/utils/sounds";
import { useState } from "react";
import { FaPlus } from "react-icons/fa";
import { PromptDialog } from "../Dialog";

const AddSound = ({ studio }: { studio: string }) => {
	const [asking, setAsking] = useState(false);

	// comes back with what's wrong with the code, or nothing when the sound
	// was added
	const add = async (code: string) => {
		if (!code) return "Enter the code of a sound.";

		const id = await soundWithCode(code);

		if (!id) return "No sound has that code.";

		await addSound(studio, id);

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
