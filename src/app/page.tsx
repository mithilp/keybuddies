import PendingButton from "@/components/PendingButton";
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

		for (let i = 0; i < 4; i++) {
			await addDoc(collection(db, `studios/${pin}/tracks`), {
				createdAt: Timestamp.now(),
				name: `Track ${i + 1}`,
				order: i,
				notes: [
					{ type: "empty", name: "", id: "" },
					{ type: "empty", name: "", id: "" },
					{ type: "empty", name: "", id: "" },
					{ type: "empty", name: "", id: "" },
				],
			});
		}

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
					<PendingButton text="Join a Studio!" />
				</form>
				<form action={createStudio} className="w-full">
					<PendingButton text="Create a Studio!" />
				</form>
			</div>
		</main>
	);
}
