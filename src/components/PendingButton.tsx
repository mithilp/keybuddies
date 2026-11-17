"use client";

import { useFormStatus } from "react-dom";
import { Button, ButtonVariant } from "./ui/button";
import { Spinner } from "./ui/spinner";

// The submit button of a form that runs a server action. It's disabled while
// the action runs, so the form can't be sent twice.
export default function PendingButton({
	text,
	variant = "secondary",
}: {
	text: string;
	variant?: ButtonVariant;
}) {
	const { pending } = useFormStatus();

	return (
		<Button
			type="submit"
			variant={variant}
			size="lg"
			className="w-full"
			disabled={pending}
		>
			{pending && <Spinner size="sm" label="Working" />}
			{text}
		</Button>
	);
}
