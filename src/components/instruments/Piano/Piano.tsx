"use client";

import { db } from "@/utils/firebase";
import { addDoc, collection } from "firebase/firestore";
import { useState } from "react";
import OpenPiano from "./OpenPiano";
import PianoEditor from "./PianoEditor";
import PianoModalHeader from "./PianoModalHeader";
import { Key } from "@/utils/types";
import { PromptDialog } from "@/components/Dialog";

const Piano = ({ studio, bpm }: { studio: string; bpm: number }) => {
	const [open, setOpen] = useState(false);

	// the recording that's being named, once Save Recording has been pressed
	const [naming, setNaming] = useState<Key[] | null>(null);

	const save = async (name: string) => {
		if (!naming) return;

		await addDoc(collection(db, `sounds`), {
			name: name || "Piano sound",
			type: "piano",
			sequence: naming,
			in: [studio],
			code: Math.floor(100000 + Math.random() * 900000).toString(),
		});

		setNaming(null);
		setOpen(false);
	};

	return (
		<>
			<OpenPiano onClick={() => setOpen(!open)} />

			{open && (
				<div className="fixed top-0 left-0 z-20 w-screen h-screen p-12">
					<div className="bg-blue border-8 border-black h-full rounded-xl p-8 space-y-2">
						<PianoModalHeader close={() => setOpen(false)} />

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
