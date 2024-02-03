import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";

export default function Home() {
	return (
		<main className="p-24 h-screen w-screen grid place-items-center">
			<div className="w-72 space-y-2">
				<h1 className="text-3xl font-bold text-center">Keybuddies</h1>
				<div className="w-full">
					<Link href={"/join"}>
						<button className="w-full bg-blue-800 py-2 rounded-md relative">
							Join a Studio
							<FaArrowRight className="ml-2 inline" />
						</button>
					</Link>
				</div>
				<div className="w-full">
					<Link href={"/create"}>
						<button className="w-full bg-blue-800 py-2 rounded-md">
							Create a Studio
							<FaArrowRight className="ml-2 inline" />
						</button>
					</Link>
				</div>
			</div>
		</main>
	);
}
