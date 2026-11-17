import { ComponentType } from "react";
import { IconType } from "react-icons";
import { FaDrum } from "react-icons/fa";
import { MdPiano } from "react-icons/md";
import Drum from "./Drum";
import Piano from "./Piano/Piano";

export type Instrument = {
	id: string;
	// what's written under the icon
	name: string;
	// what its square does, for the tooltip and for screen readers
	hint: string;
	icon: IconType;
	// What a sound is recorded in. It's on the page the whole time and draws
	// nothing until `open`. It saves the sound itself and then calls `close`.
	Recorder: ComponentType<{
		studio: string;
		bpm: number;
		open: boolean;
		close: () => void;
	}>;
};

// Every instrument a sound can be recorded with. The sidebar draws a square
// for each, in this order, so a new instrument is one more entry here.
const instruments: Instrument[] = [
	{
		id: "piano",
		name: "Piano",
		hint: "Record a piano sound",
		icon: MdPiano,
		Recorder: Piano,
	},
	{
		id: "drum",
		name: "Drums",
		hint: "Record a drum sound",
		icon: FaDrum,
		Recorder: Drum,
	},
];

export default instruments;
