"use client";

import { useEffect, useState } from "react";

const Piano = () => {
	const [selected, setSelected] = useState(false);
	const [octave, setOctave] = useState(2);
	const [listening, setListening] = useState(false);

	const handleKeyDown = (e: KeyboardEvent) => {
		if (selected) {
			switch (e.key) {
				case "ArrowUp":
					setOctave((prev) => (prev === 3 ? 3 : prev + 1));
					break;

				case "ArrowDown":
					setOctave((prev) => (prev === 1 ? 1 : prev - 1));
					break;

				case "a":
					const a = new Audio(`/piano_c${octave}.mp3`);
					a.play();
					break;

				case "w":
					const w = new Audio(`/piano_cs${octave}.mp3`);
					w.play();
					break;

				case "s":
					const s = new Audio(`/piano_d${octave}.mp3`);
					s.play();
					break;

				case "e":
					const e = new Audio(`/piano_ds${octave}.mp3`);
					e.play();
					break;

				case "d":
					const d = new Audio(`/piano_e${octave}.mp3`);
					d.play();
					break;

				case "f":
					const f = new Audio(`/piano_f${octave}.mp3`);
					f.play();
					break;

				case "t":
					const t = new Audio(`/piano_fs${octave}.mp3`);
					t.play();
					break;

				case "g":
					const g = new Audio(`/piano_g${octave}.mp3`);
					g.play();
					break;

				case "y":
					const y = new Audio(`/piano_gs${octave}.mp3`);
					y.play();
					break;

				case "h":
					const h = new Audio(`/piano_a${octave}.mp3`);
					h.play();
					break;

				case "u":
					const u = new Audio(`/piano_as${octave}.mp3`);
					u.play();
					break;

				case "j":
					const j = new Audio(`/piano_b${octave}.mp3`);
					j.play();
					break;

				case "k":
					const k = new Audio(`/piano_c${octave + 1}.mp3`);
					k.play();
					break;

				default:
					break;
			}
		}
	};

	useEffect(() => {
		if (selected && !listening) {
			console.log("starting listening ");
			document.addEventListener("keydown", handleKeyDown, true);
			setListening(true);
		}
	});

	return (
		<>
			<button onClick={() => setSelected(!selected)}>
				Piano {selected ? "✓" : "X"}
			</button>
			<br />
			<div>{selected ? `Octave ${octave}` : ""}</div>
		</>
	);
};

export default Piano;
