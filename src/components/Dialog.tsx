"use client";

import {
	KeyboardEvent as ReactKeyboardEvent,
	ReactNode,
	useEffect,
	useId,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";
import { useEscape } from "@/utils/escape";
import { useFocusTrap } from "@/utils/focus";
import { cn } from "@/utils/cn";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Spinner } from "./ui/spinner";
import { ErrorMessage } from "./ui/feedback";
import { CheckIcon, CopyIcon, ICON } from "./ui/icons";

// The box every dialog sits in. It goes on top of everything, Escape or a
// click outside it closes it, Tab stays inside it, and the focus goes back
// to where it was once it's gone.
//
// It's never taller than the window. A dialog with a long list in it gives
// the list `min-h-0 overflow-y-auto`, and the list scrolls while the title
// and the buttons stay where they are.
const Dialog = ({
	title,
	close,
	wide = false,
	children,
}: {
	title: string;
	close: () => void;
	// for a dialog with rows in it instead of a question
	wide?: boolean;
	children: ReactNode;
}) => {
	const heading = useId();
	const box = useRef<HTMLDivElement>(null);
	const trap = useFocusTrap(box);

	useEscape(close);

	const onKeyDown = (event: ReactKeyboardEvent) => {
		// typing in a dialog shouldn't reach anything under it. the piano
		// listens to the whole keyboard.
		event.stopPropagation();

		trap(event);
	};

	return createPortal(
		<div
			className="fixed inset-0 z-dialog grid place-items-center bg-ink/50 p-4"
			onClick={(event) => {
				// a dialog is drawn on the page but belongs to whatever opened it,
				// which might be clickable itself
				event.stopPropagation();

				if (event.target === event.currentTarget) close();
			}}
			onKeyDown={onKeyDown}
		>
			<Card
				ref={box}
				role="dialog"
				aria-modal="true"
				aria-labelledby={heading}
				className={cn(
					"w-full max-h-[calc(100dvh-2rem)] flex flex-col space-y-4 text-left text-base font-normal cursor-auto",
					wide ? "max-w-xl" : "max-w-md"
				)}
			>
				<h3 id={heading} className="text-xl font-bold">
					{title}
				</h3>
				{children}
			</Card>
		</div>,
		document.body
	);
};

// Asks for one line of text. Enter sends it, Escape cancels. `onSubmit` can
// come back with a message when the answer is no good, and the dialog stays
// open with the message under the box.
export const PromptDialog = ({
	title,
	hint,
	label,
	initial = "",
	placeholder,
	maxLength,
	numeric = false,
	submit,
	onSubmit,
	onCancel,
}: {
	title: string;
	hint?: string;
	label: string;
	initial?: string;
	placeholder?: string;
	maxLength?: number;
	// a code: a phone brings up the number pad for it
	numeric?: boolean;
	submit: string;
	onSubmit: (value: string) => Promise<string | void> | string | void;
	onCancel: () => void;
}) => {
	const [value, setValue] = useState(initial);
	const [problem, setProblem] = useState("");
	const [busy, setBusy] = useState(false);

	const input = useRef<HTMLInputElement>(null);

	useEffect(() => {
		input.current?.focus();
		input.current?.select();
	}, []);

	const send = async () => {
		if (busy) return;

		setBusy(true);
		setProblem("");

		let wrong: string | void;
		try {
			wrong = await onSubmit(value.trim());
		} catch (error) {
			console.error(error);
			wrong = "That didn't work. Try again.";
		}

		// when nothing was wrong the dialog has been closed by now
		if (wrong) {
			setProblem(wrong);
			setBusy(false);
			input.current?.focus();
		}
	};

	// once it's been sent it's too late to cancel
	const cancel = () => {
		if (!busy) onCancel();
	};

	return (
		<Dialog title={title} close={cancel}>
			<form
				className="space-y-4"
				onSubmit={(event) => {
					event.preventDefault();
					send();
				}}
			>
				{hint && <p>{hint}</p>}

				<Input
					ref={input}
					type="text"
					aria-label={label}
					value={value}
					onChange={(event) => setValue(event.target.value)}
					placeholder={placeholder}
					maxLength={maxLength}
					autoComplete="off"
					inputMode={numeric ? "numeric" : undefined}
					pattern={numeric ? "[0-9]*" : undefined}
					className="w-full"
				/>

				{problem && <ErrorMessage>{problem}</ErrorMessage>}

				<div className="flex justify-end space-x-4">
					<Button onClick={cancel} disabled={busy}>
						Cancel
					</Button>
					<Button type="submit" variant="primary" disabled={busy}>
						{busy && <Spinner size="sm" label="Saving" />}
						{submit}
					</Button>
				</div>
			</form>
		</Dialog>
	);
};

// Asks yes or no. The yes button has the focus, so Enter says yes and
// Escape says no.
export const ConfirmDialog = ({
	title,
	message,
	confirm,
	danger = false,
	onConfirm,
	onCancel,
}: {
	title: string;
	message?: string;
	confirm: string;
	// for a yes that throws something away
	danger?: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}) => {
	const yes = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		yes.current?.focus();
	}, []);

	return (
		<Dialog title={title} close={onCancel}>
			{message && <p>{message}</p>}

			<div className="flex justify-end space-x-4">
				<Button onClick={onCancel}>Cancel</Button>
				<Button
					ref={yes}
					variant={danger ? "danger" : "primary"}
					onClick={onConfirm}
				>
					{confirm}
				</Button>
			</div>
		</Dialog>
	);
};

// Shows a code to pass on, with a button that copies it.
export const ShareDialog = ({
	title,
	hint,
	code,
	onClose,
}: {
	title: string;
	hint: string;
	code: string;
	onClose: () => void;
}) => {
	const [copied, setCopied] = useState<"no" | "yes" | "failed">("no");

	const copyButton = useRef<HTMLButtonElement>(null);
	const box = useRef<HTMLInputElement>(null);

	useEffect(() => {
		copyButton.current?.focus();
	}, []);

	const copy = async () => {
		try {
			await navigator.clipboard.writeText(code);
			setCopied("yes");
		} catch {
			// no clipboard here. leave the code selected so it can be copied by
			// hand.
			box.current?.focus();
			box.current?.select();
			setCopied("failed");
		}
	};

	return (
		<Dialog title={title} close={onClose}>
			<p>{hint}</p>

			<div className="flex space-x-4">
				<Input
					ref={box}
					readOnly
					aria-label="Code"
					value={code}
					onFocus={(event) => event.target.select()}
					className="w-full min-w-0 text-center text-xl font-bold tracking-widest"
				/>
				<Button ref={copyButton} variant="primary" onClick={copy}>
					{copied === "yes" ? (
						<CheckIcon size={ICON} aria-hidden />
					) : (
						<CopyIcon size={ICON} aria-hidden />
					)}
					<span>{copied === "yes" ? "Copied" : "Copy"}</span>
				</Button>
			</div>

			<p role="status" className="min-h-6">
				{copied === "failed" &&
					"Couldn't copy it. It's selected, copy it by hand."}
			</p>

			<div className="flex justify-end">
				<Button onClick={onClose}>Done</Button>
			</div>
		</Dialog>
	);
};

export { Dialog };
