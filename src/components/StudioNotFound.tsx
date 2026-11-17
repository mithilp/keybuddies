import Image from "next/image";
import Link from "next/link";
import logo from "../../public/images/keybuddies-logo.png";
import { buttonStyles } from "./ui/button";
import { Card } from "./ui/card";

const StudioNotFound = ({ studio }: { studio: string }) => {
	return (
		<main className="min-h-dvh p-4 sm:p-24 grid place-items-center">
			<Card className="w-full max-w-96 space-y-4 flex items-center flex-col p-6 sm:p-10 text-center">
				<Image alt="KeyBuddies Logo" src={logo} width={200} height={45} />
				<h1 className="text-2xl font-bold">Studio not found</h1>
				<p>
					There&apos;s no studio with the code{" "}
					<span className="font-bold break-all">{studio}</span>. Check the code
					and try again.
				</p>
				<Link
					href="/"
					className={buttonStyles({
						variant: "primary",
						size: "lg",
						className: "w-full",
					})}
				>
					Back to home
				</Link>
			</Card>
		</main>
	);
};

export default StudioNotFound;
