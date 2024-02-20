import { SubmitButton } from "@/components/SubmitButton";
import { db } from "@/utils/firebase";
import {
	Timestamp,
	addDoc,
	collection,
	doc,
	getDoc,
	setDoc,
} from "firebase/firestore";
import Image from "next/image";
import { redirect } from "next/navigation";
import logo from "../../public/images/keybuddies-logo.png";

export default function Home({
	searchParams,
}: {
	searchParams: { error?: string };
}) {
	async function joinStudio(formData: FormData) {
		"use server";
		const pin = formData.get("pin") as string;

		const snapshot = await getDoc(doc(db, "studios", pin));
		if (snapshot.exists()) {
			redirect(`/${pin}`);
		} else {
			redirect(`/?error=not-found`);
		}
	}

	async function createStudio(formData: FormData) {
		"use server";
		const pin = Math.floor(100000 + Math.random() * 900000).toString();

		await setDoc(doc(db, "studios", pin), {
			createdAt: Timestamp.now(),
			bpm: "120",
		});

		await addDoc(collection(db, `studios/${pin}/tracks`), {
			createdAt: Timestamp.now(),
			name: "Track 1",
			order: 0,
			notes: [-1, -1, -1, -1],
		});

		await addDoc(collection(db, `studios/${pin}/tracks`), {
			createdAt: Timestamp.now(),
			name: "Track 2",
			order: 1,
			notes: [-1, -1, -1, -1],
		});

		await addDoc(collection(db, `studios/${pin}/tracks`), {
			createdAt: Timestamp.now(),
			name: "Track 3",
			order: 2,
			notes: [-1, -1, -1, -1],
		});

		await addDoc(collection(db, `studios/${pin}/tracks`), {
			createdAt: Timestamp.now(),
			name: "Track 4",
			order: 3,
			notes: [-1, -1, -1, -1],
		});

		redirect(`/${pin}`);
	}

	return (
		<main className="p-24 h-screen w-screen grid place-items-center">
			<div className="w-96 space-y-2 flex items-center flex-col bg-blue border-8 border-black p-10 rounded-xl">
				<Image alt={"Keybuddies"} src={logo} width={200} height={0} />
				<form
					action={joinStudio}
					className="w-full space-y-2 border-b-8 border-black pb-2"
				>
					{searchParams.error === "not-found" && (
						<div>
							<p className="text-red-500 text-center">Studio not found!</p>
						</div>
					)}
					<input
						type="text"
						maxLength={6}
						required
						minLength={6}
						name="pin"
						className="w-full bg-yellow border-8 border-black p-2 rounded-xl black text-black text-center"
						placeholder="Studio Code"
					/>
					<SubmitButton text="Join a Room!" />
				</form>
				<form action={createStudio} className="w-full">
					<SubmitButton text="Create a Room!" />
				</form>
			</div>
		</main>
	);
}
