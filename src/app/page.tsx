import { SubmitButton } from "@/components/SubmitButton";
import { db } from "@/utils/firebase";
import { Timestamp, doc, getDoc, setDoc } from "firebase/firestore";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FaArrowRight } from "react-icons/fa";

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
			redirect(`/join?error=not-found`);
		}
	}
	async function createStudio(formData: FormData) {
		"use server";
		const name = formData.get("name") as string;
		const pin = Math.floor(100000 + Math.random() * 900000).toString();

		await setDoc(doc(db, "studios", pin), {
			createdAt: Timestamp.now(),
		});

		redirect(`/${pin}`);
	}

	return (
		<main className="p-24 h-screen w-screen grid place-items-center">
			<div className="w-72 space-y-2">
				<h1 className="text-3xl font-bold text-center">Keybuddies</h1>
				<form action={joinStudio} className="w-full space-y-2">
					{searchParams.error === "not-found" && (
						<div>
							<p className="text-red-300 text-center">Studio not found!</p>
						</div>
					)}
					<input
						type="text"
						maxLength={6}
						required
						minLength={6}
						name="pin"
						className="w-full p-2 rounded-md black text-black text-center"
						placeholder="Studio Code"
					/>
					<SubmitButton text="Join a Room!" />
				</form>
				<hr />
				<form action={createStudio} className="w-full space-y-2">
					<SubmitButton text="Create a Room!" />
				</form>
			</div>
		</main>
	);
}
