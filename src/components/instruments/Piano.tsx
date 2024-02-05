"use client";

import { useState } from "react";
import { FaCircleXmark } from "react-icons/fa6";
import { MdPiano } from "react-icons/md";

const Piano = () => {
	const [open, setOpen] = useState(false);

	return (
		<>
			<button
				onClick={() => setOpen(!open)}
				className="bg-yellow p-4 w-full rounded-xl border-8 border-black cursor-pointer"
			>
				<div className="flex items-center space-x-2">
					<MdPiano size={32} />
					<div className="text-xl">Piano</div>
				</div>
			</button>

			{open && (
				<div className="fixed top-0 left-0 z-20 w-screen h-screen p-24">
					<div className="bg-blue border-8 border-black h-full rounded-xl p-8">
						<div className="flex justify-between items-center">
							<h3 className="text-2xl font-bold">Record a Piano Sound</h3>
							<button onClick={() => setOpen(false)}>
								<FaCircleXmark size={32} />
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default Piano;
