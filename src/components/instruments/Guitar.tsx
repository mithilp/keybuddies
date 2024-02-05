"use client";

import { FaGuitar } from "react-icons/fa";

const Guitar = () => {
	return (
		<button className="bg-yellow p-4 w-full rounded-xl border-8 border-black cursor-pointer">
			<div className="flex items-center space-x-2">
				<FaGuitar size={32} />
				<div className="text-xl">Guitar</div>
			</div>
		</button>
	);
};

export default Guitar;
