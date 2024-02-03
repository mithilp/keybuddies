import { SubmitButton } from "@/components/SubmitButton";
import { db } from "@/utils/firebase";
import { doc, getDoc } from "firebase/firestore";
import { redirect } from "next/navigation";

export default function Join({
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

	return (
		<main className="p-24 h-screen w-screen grid place-items-center">
			<form action={joinStudio} className="w-72 space-y-2">
				<h1 className="text-3xl font-bold text-center">Join a Studio</h1>
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
				<SubmitButton text="Join!" />
			</form>
		</main>
	);
}
