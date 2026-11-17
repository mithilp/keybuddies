import { CLIP_BARS } from "@/utils/clips";
import { ClipBars } from "@/utils/types";

// How long a new recording is, 1, 2 or 4 bars. A recording keeps its length,
// so this is only shown while making one.
const LengthPicker = ({
	id,
	bars,
	setBars,
	disabled,
}: {
	id: string;
	bars: ClipBars;
	setBars: (bars: ClipBars) => void;
	disabled?: boolean;
}) => (
	<div className="flex items-center space-x-2">
		<label className="text-lg whitespace-nowrap" htmlFor={id}>
			Length:
		</label>
		<select
			id={id}
			className="w-32 bg-yellow border-8 border-black p-2 rounded-xl disabled:opacity-70"
			value={bars}
			disabled={disabled}
			onChange={(event) => setBars(Number(event.target.value) as ClipBars)}
		>
			{CLIP_BARS.map((bars) => (
				<option key={bars} value={bars}>
					{bars == 1 ? "1 bar" : `${bars} bars`}
				</option>
			))}
		</select>
	</div>
);

export default LengthPicker;
