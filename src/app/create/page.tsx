import { SubmitButton } from "@/components/SubmitButton";
import { db } from "@/utils/firebase";
import { Timestamp, doc, setDoc } from "firebase/firestore";
import { redirect } from "next/navigation";

export default function Join({
	searchParams,
}: {
	searchParams: { error?: string };
}) {
	async function joinStudio(formData: FormData) {
		"use server";
		const name = formData.get("name") as string;
		const pin = Math.floor(100000 + Math.random() * 900000).toString();

		await setDoc(doc(db, "studios", pin), {
			users: [name],
			createdAt: Timestamp.now(),
		});

		redirect(`/${pin}`);
	}

	return (
		<main className="p-24 h-screen w-screen grid place-items-center">
			<form action={joinStudio} className="w-72 space-y-2">
				<h1 className="text-3xl font-bold text-center">Create a Studio</h1>
				{searchParams.error === "not-found" && (
					<div>
						<p className="text-red-300 text-center">Studio not found!</p>
					</div>
				)}
				<input
					type="text"
					required
					name="name"
					className="w-full p-2 rounded-md black text-black text-center"
					placeholder="What's your name?"
				/>
				<SubmitButton text="Let's Go!" />
			</form>
		</main>
	);
}
