"use client";
import Piano from "@/components/instruments/Piano";
import { useState, useEffect } from "react";
import { FaCircle, FaPlay } from "react-icons/fa6";

export default function Page({ params }: { params: { studio: string } }) {
	const { studio } = params;
	const [room, setRoom] = useState();

	useEffect(() => {
		loadRoom();
	}, []);

	async function loadRoom() {
		const response = await fetch(`/api/get-page?studio=${studio}`);
		setRoom(await response.json());
	}

	const [selectedOption, setSelectedOption] = useState("loops");
	return (
		<div className="grid grid-cols-3">
			{/* Left column */}
			<div className="col-span-1 bg-blue text-black h-screen border-r-8 border-black">
				<div className="p-4  border-b-8 border-black">
					<div className="flex items-center justify-between">
						<h3 className="text-lg font-medium">Options</h3>
					</div>
					<div className="mt-4">
						<button
							className={`px-4 py-2 font-medium text-gray-700 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
								selectedOption === "loops" && "bg-blue-100"
							}`}
							onClick={() => setSelectedOption("loops")}
						>
							Loops
						</button>
						<button
							className={`px-4 py-2 font-medium text-gray-700 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
								selectedOption === "sounds" ? "bg-blue-100" : ""
							}`}
							onClick={() => setSelectedOption("sounds")}
						>
							Sounds
						</button>
					</div>
				</div>
				{/* Content for the selected option will go here */}
				{selectedOption === "loops" && (
					<div className="p-4">
						<h3 className="text-lg font-medium">Loops content</h3>
						{/* Loops content goes here */}
					</div>
				)}
				{selectedOption === "sounds" && (
					<div className="p-4">
						<h3 className="text-lg font-medium">Sounds content</h3>
						<Piano />
					</div>
				)}
			</div>

			{/* Right column (two-thirds of the screen) */}
			<main className="col-span-2">
				{/* Main content will go here */}

				<div className="flex justify-between border-black border-b-8 py-6 px-4">
					<div>
						<span className="leading-7 uppercase font-black">Studio Code</span>
						<br />
						<span className="leading-8 text-5xl font-black">{studio}</span>
					</div>

					<div className="flex space-x-2">
						<button className="bg-yellow border-8 border-black grid place-items-center h-18 w-16 rounded-xl text-3xl font-black">
							<FaCircle color="#ff6767" />
						</button>
						<button className="bg-yellow border-8 border-black grid place-items-center h-18 w-16 rounded-xl text-3xl font-black">
							<FaPlay color="#317b00" />
						</button>
					</div>
				</div>
			</main>
		</div>
	);
}
