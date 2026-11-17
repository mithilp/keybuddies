"use client";

import Image from "next/image";
import logo from "../../../public/images/keybuddies-logo.png";
import { useState } from "react";
import { Placing } from "@/utils/placing";
import Instruments from "./Instruments";
import Loops from "./Loops";

const Sidebar = ({
	placing,
	bpm,
	studio,
}: {
	placing: Placing;
	bpm: string;
	studio: string;
}) => {
	const [tab, setTab] = useState("loops");

	// a loop or a sound that's picked stays on its own tab, and one that
	// can't be seen shouldn't still be waiting for a cell
	const show = (tab: string) => {
		setTab(tab);
		placing.dropItem();
	};

	return (
		<div className="col-span-1 bg-blue text-black overflow-y-scroll h-screen border-r-8 border-black">
			<div className="pt-[10px] px-4 pb-[7px]">
				<div className="flex items-center justify-between">
					<Image alt="KeyBuddies Logo" src={logo} width={200} height={45} />
				</div>
				<div className="mt-[10px] w-[100%]">
					<button
						className={`w-[50%] px-4  py-2 rounded-xl font-medium focus:outline-none ${
							tab === "loops" && "bg-yellow border-black border-[8px]"
						}`}
						onClick={() => show("loops")}
					>
						Loops
					</button>
					<button
						className={`w-[50%] px-4 py-2 rounded-xl font-medium focus:outline-none ${
							tab === "instruments" && "bg-yellow border-black border-[8px]"
						}`}
						onClick={() => show("instruments")}
					>
						Instruments
					</button>
				</div>
			</div>

			{/* Content for the selected option will go here */}
			{tab === "loops" && (
				<Loops placing={placing} bpm={bpm} />
			)}

			{/* Content for instruments tab */}
			{tab === "instruments" && (
				<Instruments placing={placing} bpm={bpm} studio={studio} />
			)}
		</div>
	);
};

export default Sidebar;
