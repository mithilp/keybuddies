import { useEffect, useRef, useState } from "react";
import { FaCheck } from "react-icons/fa";
import { MdLibraryMusic } from "react-icons/md";
import { addLoop } from "@/utils/library";
import { library, LibraryLoop } from "@/utils/loops";
import { Cell } from "@/utils/types";
import { Dialog, quietButton } from "../Dialog";
import PlayLoop from "../PlayLoop";

// The loops that come with the app, a set at a time. A loop can be listened
// to here, and Add puts it in the studio's sounds for everyone. Closing the
// dialog takes the play buttons with it, and whatever was playing stops.
const LibraryDialog = ({
	studio,
	bpm,
	loops,
	close,
}: {
	studio: string;
	bpm: string;
	loops: Cell[];
	close: () => void;
}) => {
	const [problem, setProblem] = useState("");

	const done = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		done.current?.focus();
	}, []);

	// the list updates as soon as it's written here, so there's no waiting
	// to show
	const add = (loop: LibraryLoop) => {
		setProblem("");

		addLoop(studio, loop.id).catch((error) => {
			console.error(error);
			setProblem(`Couldn't add ${loop.name}. Try again.`);
		});
	};

	return (
		<Dialog title="Library" close={close} wide>
			<p>
				Loops that are ready to use. Add one and it shows up in this
				studio&apos;s sounds.
			</p>

			<div className="min-h-0 overflow-y-auto space-y-4 pr-2">
				{library.map((set) => (
					<section key={set.name} aria-label={set.name} className="space-y-2">
						<div>
							<h4 className="text-xl font-bold">{set.name}</h4>
							<p className="text-sm">{set.description}</p>
						</div>

						<ul className="space-y-2">
							{set.loops.map((loop) => {
								const added = loops.some((has) => has.id == loop.id);

								return (
									<li
										key={loop.id}
										className="bg-yellow border-8 border-black rounded-xl p-3 flex items-center gap-3"
									>
										<PlayLoop id={loop.id} name={loop.name} bpm={bpm} />

										<div className="flex-1 min-w-0">
											<div className="text-xl">{loop.name}</div>
											<div className="text-sm">{loop.description}</div>
										</div>

										{/* Added is aria-disabled and not disabled. A button that's
										    disabled under the focus drops it, and Tab would walk
										    out of the dialog from there. */}
										<button
											type="button"
											aria-disabled={added}
											onClick={() => {
												if (!added) add(loop);
											}}
											aria-label={
												added
													? `${loop.name} is in this studio`
													: `Add ${loop.name} to this studio`
											}
											className="shrink-0 w-28 flex items-center justify-center gap-2 bg-pink border-4 border-black rounded-xl px-3 py-1 font-bold aria-disabled:bg-transparent aria-disabled:opacity-60 aria-disabled:cursor-default"
										>
											{added && <FaCheck aria-hidden />}
											{added ? "Added" : "Add"}
										</button>
									</li>
								);
							})}
						</ul>
					</section>
				))}
			</div>

			{problem && (
				<p role="alert" className="font-bold">
					{problem}
				</p>
			)}

			<div className="flex justify-end">
				<button ref={done} type="button" onClick={close} className={quietButton}>
					Done
				</button>
			</div>
		</Dialog>
	);
};

// the button under the studio's sounds that opens the library
const Library = ({
	studio,
	bpm,
	loops,
}: {
	studio: string;
	bpm: string;
	// the library loops this studio already has
	loops: Cell[];
}) => {
	const [open, setOpen] = useState(false);

	return (
		<>
			<button
				onClick={() => setOpen(true)}
				className="bg-yellow p-4 w-full rounded-xl border-8 border-black cursor-pointer"
			>
				<div className="flex items-center space-x-2">
					<MdLibraryMusic size={32} />
					<div className="text-xl">Library</div>
				</div>
			</button>

			{open && (
				<LibraryDialog
					studio={studio}
					bpm={bpm}
					loops={loops}
					close={() => setOpen(false)}
				/>
			)}
		</>
	);
};

export default Library;
