import { useEffect, useRef, useState } from "react";
import { renameTrack, TRACK_NAME_MAX } from "@/utils/studio";
import { useEscape } from "@/utils/escape";
import { Tip } from "./ui/tooltip";
import { Input } from "./ui/input";

const look = "text-lg uppercase font-bold";

// A track's name, which turns into a box to type a new one when it's
// clicked. Enter or clicking away saves it, Escape leaves it as it was. An
// empty name, or the same one, saves nothing.
const TrackName = ({
	studio,
	id,
	name,
	failed,
}: {
	studio: string;
	id: string;
	name: string;
	failed: (error: unknown) => void;
}) => {
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(name);

	// Enter saves and then the box goes, and going can blur it too. this
	// keeps that from saving twice.
	const done = useRef(false);

	// the name goes back to being a button, and keeps the focus there
	const button = useRef<HTMLButtonElement>(null);
	const refocus = useRef(false);
	useEffect(() => {
		if (!editing && refocus.current) {
			refocus.current = false;
			button.current?.focus();
		}
	}, [editing]);

	// the name when the box opened. a friend can rename it while it's open,
	// and saving it untouched would put the old name back over theirs.
	const original = useRef(name);

	const start = () => {
		done.current = false;
		original.current = name;
		setDraft(name);
		setEditing(true);
	};

	const finish = (save: boolean, focus: boolean) => {
		if (done.current) return;
		done.current = true;

		const next = draft.trim();
		if (save && next && next !== original.current) {
			renameTrack(studio, id, next).catch(failed);
		}
		refocus.current = focus;
		setEditing(false);
	};

	useEscape(() => finish(false, true), editing);

	if (editing) {
		return (
			<Input
				autoFocus
				className={`${look} px-1 py-0 w-56 min-w-0`}
				aria-label={`New name for ${name}`}
				value={draft}
				maxLength={TRACK_NAME_MAX}
				onFocus={(event) => event.target.select()}
				onChange={(event) => setDraft(event.target.value)}
				onKeyDown={(event) => {
					// the press ends here. the focus goes back to the name,
					// and Enter going on to it would click it open again. Enter
					// while picking a character in a Japanese or Chinese
					// keyboard is for that, not for saving.
					if (event.key === "Enter" && !event.nativeEvent.isComposing) {
						event.preventDefault();
						finish(true, true);
					}
				}}
				onBlur={() => finish(true, false)}
			/>
		);
	}

	return (
		<h3 className="min-w-0">
			<Tip label="Click to rename">
				<button
					ref={button}
					type="button"
					className={`${look} block max-w-56 truncate rounded px-1 cursor-text hover:bg-ink/10 pointer-coarse:min-h-11`}
					aria-label={`Rename ${name}`}
					onClick={start}
				>
					{name}
				</button>
			</Tip>
		</h3>
	);
};

export default TrackName;
