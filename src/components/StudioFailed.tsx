import Image from "next/image";
import Link from "next/link";
import logo from "../../public/images/keybuddies-logo.png";
import { Button, buttonStyles } from "./ui/button";
import { Card } from "./ui/card";

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
			<Card
				role="alert"
				className="w-96 space-y-4 flex items-center flex-col p-10 text-center"
			>
				<Image alt="KeyBuddies Logo" src={logo} width={200} height={45} />
				<h1 className="text-2xl font-bold">Couldn&apos;t load the studio</h1>
				<p>
					Something went wrong getting studio{" "}
					<span className="font-bold">{studio}</span>. Check your connection and
					try again.
				</p>
				<Button variant="primary" size="lg" onClick={retry} className="w-full">
					Try again
				</Button>
				<Link
					href="/"
					className={buttonStyles({ size: "lg", className: "w-full" })}
				>
					Back to home
				</Link>
			</Card>
		</main>
	);
};

export default StudioFailed;
