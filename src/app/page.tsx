import PendingButton from "@/components/PendingButton";
import { db } from "@/utils/firebase";
import { claimStudio } from "@/utils/codes";
import { isStudioCode } from "@/utils/studio-code";
import {
	Timestamp,
	addDoc,
	collection,
	doc,
	getDoc,
} from "firebase/firestore";
import Image from "next/image";
import { redirect } from "next/navigation";
import logo from "../../public/images/keybuddies-logo.png";

export default async function Home({
	searchParams,
}: {
	searchParams: Promise<{ error?: string }>;
}) {
	const { error } = await searchParams;
	async function joinStudio(formData: FormData) {
		"use server";
		const pin = String(formData.get("pin") ?? "").trim();

		// firestore isn't asked about something that can't be a code
		if (!isStudioCode(pin)) redirect(`/?error=not-found`);

		const snapshot = await getDoc(doc(db, "studios", pin));
		if (snapshot.exists()) {
			redirect(`/${pin}`);
		} else {
			redirect(`/?error=not-found`);
		}
	}

	async function createStudio() {
		"use server";
		const pin = await claimStudio();
		if (!pin) redirect(`/?error=no-code`);

		for (let i = 0; i < 4; i++) {
			await addDoc(collection(db, `studios/${pin}/tracks`), {
				createdAt: Timestamp.now(),
				name: `Track ${i + 1}`,
				order: i,
				// `notes` is only there so a tab still on the old app can show it
				notes: [],
				clips: [],
				bars: 8,
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
					{error === "not-found" && (
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
				<form action={createStudio} className="w-full space-y-2">
					{error === "no-code" && (
						<div>
							<p className="text-red-500 text-center">
								Couldn&apos;t make a studio. Try again!
							</p>
						</div>
					)}
					<PendingButton text="Create a Studio!" />
				</form>
			</div>
		</main>
	);
}
