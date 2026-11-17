import Image from "next/image";
import Link from "next/link";
import logo from "../../public/images/keybuddies-logo.png";

// The studio might well be there, it just couldn't be read: no connection,
// the read was refused, the quota ran out.
const StudioFailed = ({
	studio,
	retry,
}: {
	studio: string;
	retry: () => void;
}) => {
	return (
		<main className="p-24 h-screen w-screen grid place-items-center">
			<div
				role="alert"
				className="w-96 space-y-4 flex items-center flex-col bg-blue border-8 border-black p-10 rounded-xl text-center"
			>
				<Image alt="KeyBuddies Logo" src={logo} width={200} height={45} />
				<h1 className="text-3xl font-black">Couldn&apos;t load the studio</h1>
				<p>
					Something went wrong getting studio{" "}
					<span className="font-black">{studio}</span>. Check your connection
					and try again.
				</p>
				<button
					onClick={retry}
					className="w-full bg-pink border-black border-8 py-2 rounded-xl"
				>
					Try again
				</button>
				<Link
					href="/"
					className="w-full bg-yellow border-black border-8 py-2 rounded-xl"
				>
					Back to home
				</Link>
			</div>
		</main>
	);
};

export default StudioFailed;
