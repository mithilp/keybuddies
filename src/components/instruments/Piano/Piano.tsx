"use client";

import { freeSoundCode } from "@/utils/codes";
import { db } from "@/utils/firebase";
import { addDoc, collection } from "firebase/firestore";
import { useState } from "react";
import PianoEditor from "./PianoEditor";
import { Key } from "@/utils/types";
import { PromptDialog } from "@/components/Dialog";
import Panel from "@/components/Panel";

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
				<Panel title="Record a Piano Sound" close={close}>
					<PianoEditor
						bpm={bpm}
						saveLabel="Save Recording"
						onSave={setNaming}
						paused={naming !== null}
					/>
				</Panel>
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
