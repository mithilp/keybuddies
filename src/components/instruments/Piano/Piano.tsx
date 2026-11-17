"use client";

import { freeSoundCode } from "@/utils/codes";
import { db } from "@/utils/firebase";
import { addDoc, collection } from "firebase/firestore";
import { useState } from "react";
import PianoEditor from "./PianoEditor";
import PianoModalHeader from "./PianoModalHeader";
import { Key } from "@/utils/types";
import { PromptDialog } from "@/components/Dialog";

// The piano recorder. It's always on the page and draws nothing until it's
// opened.
const Piano = ({
	studio,
	bpm,
	open,
	close,
}: {
	studio: string;
	bpm: number;
	open: boolean;
	close: () => void;
}) => {
	// the recording that's being named, once Save Recording has been pressed
	const [naming, setNaming] = useState<Key[] | null>(null);

	const save = async (name: string) => {
		if (!naming) return;

		await addDoc(collection(db, `sounds`), {
			name: name || "Piano sound",
			type: "piano",
			sequence: naming,
			in: [studio],
			code: await freeSoundCode(),
		});

		setNaming(null);
		close();
	};

	return (
		<>
			{open && (
				<div className="fixed top-0 left-0 z-20 w-screen h-screen p-12">
					<div className="bg-blue border-8 border-black h-full rounded-xl p-8 space-y-2">
						<PianoModalHeader close={close} />

						<PianoEditor
							bpm={bpm}
							saveLabel="Save Recording"
							onSave={setNaming}
							paused={naming !== null}
						/>
					</div>
				</div>
			)}

			{naming && (
				<PromptDialog
					title="Name your recording"
					label="Recording name"
					placeholder="Piano sound"
					submit="Save"
					onSubmit={save}
					onCancel={() => setNaming(null)}
				/>
			)}
		</>
	);
};

export default Piano;
