"use client";

import { exit } from "process";
import { useEffect, useState } from "react";

var prev_func = [];
const Piano = () => {
	const [selected, setSelected] = useState(false);
	const [octave, setOctave] = useState(2);
	const [listening, setListening] = useState(false);
	const [functions, setFunctions] = useState([console.log("bye bye")]);

	const handleKeyDown = (e: KeyboardEvent) => {
		// if (enter) {
		// 	if (functions.length > 0) {
		// 		functions.pop();
		// 		functions.pop();
		// 	}
		// 	setFunctions([...functions, handleKeyDown(e, false)]);
		// }
		// else if (selected) {
		if (selected) {
			console.log("entered");

			switch (e.key) {
				case "ArrowUp":
					setOctave((prev) => (prev === 3 ? 3 : prev + 1));
					break;

				case "ArrowDown":
					setOctave((prev) => (prev === 1 ? 1 : prev - 1));
					break;

				case "a":
					console.log("playing c" + octave);
					const a = new Audio(`/sounds/piano/piano_c${octave}.mp3`);
					a.play();
					break;

				case "w":
					const w = new Audio(`/sounds/piano/piano_cs${octave}.mp3`);
					w.play();
					break;

				case "s":
					const s = new Audio(`/sounds/piano/piano_d${octave}.mp3`);
					s.play();
					break;

				case "e":
					const e = new Audio(`/sounds/piano/piano_ds${octave}.mp3`);
					e.play();
					break;

				case "d":
					const d = new Audio(`/sounds/piano/piano_e${octave}.mp3`);
					d.play();
					break;

				case "f":
					const f = new Audio(`/sounds/piano/piano_f${octave}.mp3`);
					f.play();
					break;

				case "t":
					const t = new Audio(`/sounds/piano/piano_fs${octave}.mp3`);
					t.play();
					break;

				case "g":
					const g = new Audio(`/sounds/piano/piano_g${octave}.mp3`);
					g.play();
					break;

				case "y":
					const y = new Audio(`/sounds/piano/piano_gs${octave}.mp3`);
					y.play();
					break;

				case "h":
					const h = new Audio(`/sounds/piano/piano_a${octave}.mp3`);
					h.play();
					break;

				case "u":
					const u = new Audio(`/sounds/piano/piano_as${octave}.mp3`);
					u.play();
					break;

				case "j":
					const j = new Audio(`/sounds/piano/piano_b${octave}.mp3`);
					j.play();
					break;

				case "k":
					const k = new Audio(`/sounds/piano/piano_c${octave + 1}.mp3`);
					k.play();
					break;

				default:
					break;
			}
		}
	};

	useEffect(() => {
		if (selected) {
			// if (selected && !listening) {
			// 	console.log("starting listening");
			// 	document.addEventListener(
			// 		"keydown",
			// 		(e) => handleKeyDown(e, octave),
			// 		true
			// 	);

			// 	setListening(true);
			// } else if (selected && listening) {
			//console.log("stopping listening");
			// document.removeEventListener("keydown", (e) => handleKeyDown(e, 1), true);
			// document.removeEventListener("keydown", (e) => handleKeyDown(e, 2), true);
			// document.removeEventListener("keydown", (e) => handleKeyDown(e, 3), true);
			console.log("removed lsitenres");
			// if (functions.length > 0) {
			// 	functions.forEach((func) => {
			// 		document.removeEventListener("keydown", (event) => func, true);
			// 	});
			// }
			document.removeEventListener("keydown", (e) => handleKeyDown, true);
			document.addEventListener("keydown", handleKeyDown, true);
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
