import { useState } from "react";
import instruments from "../instruments/list";
import { stopPreview } from "@/utils/preview";
import { Tip } from "../ui/tooltip";
import { buttonStyles } from "../ui/button";
import { BIG_ICON } from "../ui/icons";

// A square for every instrument. As many go on a row as fit, about four,
// and the rest wrap to the next row.
const Instruments = ({ bpm, studio }: { bpm: string; studio: string }) => {
	// the id of the instrument whose recorder is open, if one is
	const [open, setOpen] = useState<string | null>(null);

	return (
		<div className="px-4 pt-4 space-y-2">
			<div>
				<h3 className="text-lg font-bold">Instruments</h3>
				<p className="text-sm">Record a new sound</p>
			</div>

			<div className="grid grid-cols-[repeat(auto-fill,minmax(5rem,1fr))] gap-2">
				{instruments.map(({ id, name, hint, icon: Icon }) => (
					<Tip key={id} label={hint}>
						<button
							// a loop that's being listened to would go on playing
							// under the recorder, with its stop button covered
							onClick={() => {
								stopPreview();
								setOpen(id);
							}}
							aria-label={hint}
							className={buttonStyles({
								className: "aspect-square min-w-0 p-0 flex-col gap-1",
							})}
						>
							<Icon size={BIG_ICON} aria-hidden />
							<span className="text-sm font-bold leading-none">{name}</span>
						</button>
					</Tip>
				))}
			</div>

			{instruments.map(({ id, Recorder }) => (
				<Recorder
					key={id}
					studio={studio}
					bpm={Number(bpm)}
					open={open === id}
					close={() => setOpen(null)}
				/>
			))}
		</div>
	);
};

export default Instruments;
