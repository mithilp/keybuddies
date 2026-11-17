// the piano samples go from A0 to C8, the 88 keys of a real piano
export const LOWEST_NOTE = 21;
export const HIGHEST_NOTE = 108;

const NAMES = ["C", "CS", "D", "DS", "E", "F", "FS", "G", "GS", "A", "AS", "B"];

// Every note there is a sample for, highest first. `value` is the MIDI
// number, `text` is what the sample file is called (DS5) and `label` is what
// goes on screen (D♯5).
const MIDI = Array.from({ length: HIGHEST_NOTE - LOWEST_NOTE + 1 }, (_, i) => {
	const value = HIGHEST_NOTE - i;
	const name = NAMES[value % 12];
	const octave = Math.floor(value / 12) - 1;

	return {
		value: value,
		text: `${name}${octave}`,
		label: `${name.replace("S", "♯")}${octave}`,
	};
});

export default MIDI;
