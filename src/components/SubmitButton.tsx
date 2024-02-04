"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ text }: { text: string }) {
	const { pending } = useFormStatus();

	return (
		<button
			type="submit"
			className="w-full bg-pink border-black border-8 py-2 rounded-xl"
			aria-disabled={pending}
		>
			{pending ? "Loading..." : text}
		</button>
	);
}
