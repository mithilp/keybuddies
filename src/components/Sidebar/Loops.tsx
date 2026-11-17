import loops from "@/utils/loops";
import { Placing } from "@/utils/placing";
import PlayLoop from "../PlayLoop";

const Loops = ({ placing, bpm }: { placing: Placing; bpm: string }) => {
	return (
		<div className="px-4 pb-4 space-y-2">
			<h3 className="text-lg font-medium">Loops</h3>
			{loops.map((loop, index) => {
				const picked =
					placing.item?.type == "loop" && placing.item.id == loop.id;

				// Pink is what a click does something to. While a cell is
				// picked that's every loop, otherwise it's the picked one.
				const lit = placing.cell !== null || picked;

				return (
					<div
						key={index}
						onClick={() => {
							placing.pickItem({ type: "loop", name: loop.name, id: loop.id });
						}}
						className={`bg-yellow cursor-pointer flex justify-between items-center p-4 rounded-xl border-8 ${
							lit ? "border-pink" : "border-black"
						}`}
					>
						<div>{loop.name}</div>
						<PlayLoop bpm={bpm} selected={lit} id={loop.id} name={loop.name} />
					</div>
				);
			})}
		</div>
	);
};

export default Loops;
