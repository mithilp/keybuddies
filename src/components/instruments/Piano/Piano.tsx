"use client";

import { db } from "@/utils/firebase";
import { addDoc, collection } from "firebase/firestore";
import { useState } from "react";
import OpenPiano from "./OpenPiano";
import PianoEditor from "./PianoEditor";
import PianoModalHeader from "./PianoModalHeader";
import { Key } from "@/utils/types";

const Piano = ({ studio, bpm }: { studio: string; bpm: number }) => {
	const [open, setOpen] = useState(false);

	const save = async (sequence: Key[]) => {
		const name = prompt("Name your recording");

		await addDoc(collection(db, `sounds`), {
			name: name,
			type: "piano",
			sequence: sequence,
			in: [studio],
			code: Math.floor(100000 + Math.random() * 900000).toString(),
		});

		setOpen(false);
	};

	return (
		<>
			<OpenPiano onClick={() => setOpen(!open)} />

			{open && (
				<div className="fixed top-0 left-0 z-20 w-screen h-screen p-12">
					<div className="bg-blue border-8 border-black h-full rounded-xl p-8 space-y-2">
						<PianoModalHeader close={() => setOpen(false)} />

						<PianoEditor bpm={bpm} saveLabel="Save Recording" onSave={save} />
					</div>
				</div>
			)}
		</>
	);
};

export default Piano;
