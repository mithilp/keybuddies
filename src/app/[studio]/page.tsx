"use client";
import { useState, useEffect } from "react";

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
		<div className="grid grid-cols-3 gap-4">
			{/* Left column */}
			<div className="col-span-1 bg-gray-200 h-screen">
				<div className="p-4 bg-white border-b border-gray-200">
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
					<div className="p-4 bg-white">
						<h3 className="text-lg font-medium">Loops content</h3>
						{/* Loops content goes here */}
					</div>
				)}
				{selectedOption === "sounds" && (
					<div className="p-4 bg-white">
						<h3 className="text-lg font-medium">Sounds content</h3>
						{/* Sounds content goes here */}
					</div>
				)}
			</div>

			{/* Right column (two-thirds of the screen) */}
			<div className="col-span-2">{/* Main content will go here */}</div>
		</div>
	);
}
