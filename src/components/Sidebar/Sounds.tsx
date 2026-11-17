import { useEffect, useState } from "react";
import SoundButtons from "./SoundButtons";
import { IconType } from "react-icons";
import { MdLibraryMusic, MdPiano } from "react-icons/md";
import { FaDrum, FaTrash } from "react-icons/fa";
import { Cell, Sound } from "@/utils/types";
import { Placing } from "@/utils/placing";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/utils/firebase";
import { soundList } from "@/utils/sounds";
import { removeLoop } from "@/utils/library";
import AddSound from "./AddSound";
import Notice from "../Notice";
import PlayLoop from "../PlayLoop";
import { Tip } from "../ui/tooltip";

// What a row is, as an icon: a piano sound, a drum sound or a loop. The
// label is its tooltip, and what a screen reader says for it.
const Kind = ({ label, icon: Icon }: { label: string; icon: IconType }) => (
	<Tip label={label}>
		<span role="img" aria-label={label} className="shrink-0">
			<Icon size={32} aria-hidden />
		</span>
	</Tip>
);

// Everything in this studio that can go in a cell, in one list: the sounds
// that were recorded here or added by code, and then the loops that were
// added from the library. A row is picked and put in a cell the same way
// whichever it is.
const Sounds = ({
	placing,
	bpm,
	studio,
	loops,
}: {
	placing: Placing;
	bpm: string;
	studio: string;
	// the library loops this studio has
	loops: Cell[];
}) => {
	const [sounds, setSounds] = useState<Array<Sound>>([]);

	// the recorded sounds come from their own listeners. until they've
	// answered there's no telling whether the list is empty.
	const [loaded, setLoaded] = useState(false);

	const [playing, setPlaying] = useState<number>(-1);

	const [notice, setNotice] = useState("");

	useEffect(() => {
		const failed = (error: unknown) => {
			console.error(error);
			setNotice(
				"Couldn't load the sounds in this studio. Reload to try again."
			);
		};

		// The studio's list says which sounds it has, and each sound is
		// listened to by its id so an edit to one shows up here. The rows
		// wait until the list and every sound in it have answered, so they
		// don't come in one at a time.
		let ids: string[] | null = null;
		const listening = new Map<string, () => void>();
		const answered = new Map<string, Sound | null>();

		const show = () => {
			if (!ids || ids.some((id) => !answered.has(id))) return;

			setSounds(
				ids.flatMap((id) => {
					const sound = answered.get(id);
					return sound ? [sound] : [];
				})
			);
			setLoaded(true);
		};

		const listUnsub = onSnapshot(
			soundList(studio),
			(list) => {
				const listed = list.docs.map((entry) => entry.id);
				ids = listed;

				for (const id of listed) {
					if (listening.has(id)) continue;

					listening.set(
						id,
						onSnapshot(
							doc(db, "sounds", id),
							(sound) => {
								answered.set(
									id,
									sound.exists()
										? {
												name: sound.data().name,
												type: sound.data().type,
												sequence: sound.data().sequence,
												id: sound.id,
												code: sound.data().code,
												steps: sound.data().steps,
											}
										: null
								);
								show();
							},
							failed
						)
					);
				}

				// sounds that were taken out of the studio
				for (const [id, unsub] of listening) {
					if (listed.includes(id)) continue;

					unsub();
					listening.delete(id);
					answered.delete(id);
				}

				show();
			},
			failed
		);

		return () => {
			listUnsub();
			listening.forEach((unsub) => unsub());
		};
	}, [studio]);

	const { item, dropItem } = placing;

	// a picked sound or loop that's taken out of the studio isn't picked any
	// more
	useEffect(() => {
		if (item?.type == "sound" && !sounds.some((sound) => sound.id == item.id)) {
			dropItem();
		}

		if (item?.type == "loop" && !loops.some((loop) => loop.id == item.id)) {
			dropItem();
		}
	}, [item, sounds, loops, dropItem]);

	// The loop leaves the list. The cells that hold it keep it.
	const remove = (loop: Cell) => {
		removeLoop(studio, loop.id).catch((error) => {
			console.error(error);
			setNotice(`Couldn't remove ${loop.name}. Try again.`);
		});
	};

	// a recorded sound is being listened to. the other rows wait for it.
	const busy = playing != -1;

	return (
		<div className="px-4 pt-4 space-y-2">
			<h3 className="text-lg font-medium">Sounds in this studio</h3>
			{sounds.map((sound, index) => (
				<div
					key={index}
					onClick={() => {
						placing.pickItem({ type: "sound", name: sound.name, id: sound.id });
					}}
					// Pink is what a click does something to. While a cell is
					// picked that's every sound, otherwise it's the picked one.
					className={`bg-yellow flex justify-between p-4 rounded-xl border-8 ${
						placing.cell || (item?.type == "sound" && item.id == sound.id)
							? "border-pink"
							: "border-black"
					} ${
						playing != index && playing != -1 ? "opacity-50" : "cursor-pointer"
					}`}
				>
					<div className="w-full flex items-center justify-between space-x-2">
						<div className="flex items-center space-x-2">
							{sound.type == "drum" ? (
								<Kind label="Drum sound" icon={FaDrum} />
							) : (
								<Kind label="Piano sound" icon={MdPiano} />
							)}

							<div className="text-xl">{sound.name}</div>
						</div>

						{/* a click on a button isn't a click on the sound */}
						<div
							className="flex items-center space-x-2"
							onClick={(event) => event.stopPropagation()}
						>
							<SoundButtons
								index={index}
								playing={playing}
								setPlaying={setPlaying}
								sound={sound}
								bpm={bpm}
								studio={studio}
							/>
						</div>
					</div>
				</div>
			))}

			{loops.map((loop) => (
				<div
					key={loop.id}
					onClick={() => placing.pickItem(loop)}
					className={`bg-yellow flex items-center justify-between space-x-2 p-4 rounded-xl border-8 ${
						placing.cell || (item?.type == "loop" && item.id == loop.id)
							? "border-pink"
							: "border-black"
					} ${busy ? "opacity-50" : "cursor-pointer"}`}
				>
					<div className="flex items-center space-x-2">
						<Kind label="Loop from the library" icon={MdLibraryMusic} />

						<div className="text-xl">{loop.name}</div>
					</div>

					{/* a click on a button isn't a click on the loop */}
					<div
						className="flex items-center space-x-2"
						onClick={(event) => event.stopPropagation()}
					>
						<PlayLoop
							id={loop.id}
							name={loop.name}
							bpm={bpm}
							disabled={busy}
							className="h-5 w-5"
						/>

						<Tip label="Remove">
							<button
								className="h-5 w-5"
								disabled={busy}
								aria-label={`Remove ${loop.name} from this studio`}
								onClick={() => remove(loop)}
							>
								<FaTrash className="w-full h-full" />
							</button>
						</Tip>
					</div>
				</div>
			))}

			{loaded && sounds.length == 0 && loops.length == 0 && (
				<p>
					Nothing here yet. Record a sound with an instrument, or add a loop
					from the Library.
				</p>
			)}

			<AddSound studio={studio} />

			{notice && <Notice message={notice} close={() => setNotice("")} />}
		</div>
	);
};

export default Sounds;
