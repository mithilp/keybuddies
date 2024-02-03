"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ text }: { text: string }) {
	const { pending } = useFormStatus();

	return (
		<button
			type="submit"
			className="w-full bg-blue-800 py-2 rounded-md"
			aria-disabled={pending}
		>
			{pending ? "Loading..." : text}
		</button>
	);
}
