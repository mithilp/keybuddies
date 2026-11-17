import PendingButton from "@/components/PendingButton";
import { claimStudio } from "@/utils/codes";
import { isStudioCode } from "@/utils/studio-code";
import { addTrack, studioExists } from "@/utils/studio";
import Image from "next/image";
import { redirect } from "next/navigation";
import logo from "../../public/images/keybuddies-logo.png";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ErrorMessage } from "@/components/ui/feedback";

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

		if (await studioExists(pin)) {
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
			await addTrack(pin, i);
		}

		redirect(`/${pin}`);
	}

	return (
		<main className="min-h-dvh p-4 sm:p-24 grid place-items-center">
			<Card className="w-full max-w-96 space-y-4 flex items-center flex-col p-6 sm:p-10">
				<Image alt={"Keybuddies"} src={logo} width={200} height={0} />
				<form
					action={joinStudio}
					className="w-full space-y-2 border-b-hair border-ink pb-4"
				>
					{error === "not-found" && (
						<ErrorMessage className="justify-center">
							Studio not found!
						</ErrorMessage>
					)}
					<Input
						type="text"
						maxLength={6}
						required
						minLength={6}
						name="pin"
						inputMode="numeric"
						pattern="[0-9]*"
						autoComplete="off"
						aria-label="Studio code"
						className="w-full text-center"
						placeholder="Studio Code"
					/>
					<PendingButton text="Join a Studio!" />
				</form>
				<form action={createStudio} className="w-full space-y-2">
					{error === "no-code" && (
						<ErrorMessage className="justify-center">
							Couldn&apos;t make a studio. Try again!
						</ErrorMessage>
					)}
					<PendingButton text="Create a Studio!" variant="primary" />
				</form>
			</Card>
		</main>
	);
}
