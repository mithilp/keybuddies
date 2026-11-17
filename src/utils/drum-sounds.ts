import { drumVoices } from "./drum-synth";

// `value` is what a drum Key stores in `note`
const sounds = drumVoices.map((note, value) => ({ value, note }));

export default sounds;
