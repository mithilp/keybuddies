import Image from "next/image";
import Link from "next/link";
import logo from "../../public/images/keybuddies-logo.png";

const StudioNotFound = ({ studio }: { studio: string }) => {
	return (
		<main className="p-24 h-screen w-screen grid place-items-center">
			<div className="w-96 space-y-4 flex items-center flex-col bg-blue border-8 border-black p-10 rounded-xl text-center">
				<Image alt="KeyBuddies Logo" src={logo} width={200} height={45} />
				<h1 className="text-3xl font-black">Studio not found</h1>
				<p>
					There&apos;s no studio with the code{" "}
					<span className="font-black break-all">{studio}</span>. Check the
					code and try again.
				</p>
				<Link
					href="/"
					className="w-full bg-pink border-black border-8 py-2 rounded-xl"
				>
					Back to home
				</Link>
			</div>
		</main>
	);
};

export default StudioNotFound;
