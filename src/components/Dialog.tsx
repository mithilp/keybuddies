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
import { FaCheck, FaCopy } from "react-icons/fa";
import { useEscape } from "@/utils/escape";

// Tab and Shift Tab go round the buttons and boxes in `box` and never leave
// it. Focus that's on `box` itself goes to the first or the last one.
export const keepTabInside = (
	event: ReactKeyboardEvent,
	box: HTMLElement | null
) => {
	if (event.key !== "Tab" || !box) return;

	const stops = box.querySelectorAll<HTMLElement>(
		"button:not(:disabled), input:not(:disabled), select:not(:disabled)"
	);
	if (stops.length === 0) return;

	const first = stops[0];
	const last = stops[stops.length - 1];
	const at = document.activeElement;

	if (event.shiftKey && (at === first || at === box)) {
		event.preventDefault();
		last.focus();
	} else if (!event.shiftKey && at === last) {
		event.preventDefault();
		first.focus();
	}
};

const quiet =
	"bg-yellow border-8 border-black rounded-xl px-4 py-2 disabled:opacity-50";
const loud =
	"bg-pink border-8 border-black rounded-xl px-4 py-2 font-bold disabled:opacity-50";

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
	const card = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const before = document.activeElement;

		return () => {
			if (before instanceof HTMLElement) before.focus();
		};
	}, []);

	useEscape(close);

	const onKeyDown = (event: ReactKeyboardEvent) => {
		// typing in a dialog shouldn't reach anything under it. the piano
		// listens to the whole keyboard.
		event.stopPropagation();

		keepTabInside(event, card.current);
	};

	return createPortal(
		<div
			className="fixed inset-0 z-40 grid place-items-center bg-black/50 p-4"
			onClick={(event) => {
				// a dialog is drawn on the page but belongs to whatever opened it,
				// which might be clickable itself
				event.stopPropagation();

				if (event.target === event.currentTarget) close();
			}}
			onKeyDown={onKeyDown}
		>
			<div
				ref={card}
				role="dialog"
				aria-modal="true"
				aria-labelledby={heading}
				className={`w-full ${
					wide ? "max-w-xl" : "max-w-md"
				} max-h-[calc(100dvh-2rem)] flex flex-col bg-blue border-8 border-black rounded-xl p-6 space-y-4 text-left text-base font-normal cursor-auto`}
			>
				<h3 id={heading} className="text-2xl font-bold">
					{title}
				</h3>
				{children}
			</div>
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

				<input
					ref={input}
					type="text"
					aria-label={label}
					value={value}
					onChange={(event) => setValue(event.target.value)}
					placeholder={placeholder}
					maxLength={maxLength}
					autoComplete="off"
					className="w-full bg-yellow border-8 border-black p-2 rounded-xl text-black"
				/>

				{problem && (
					<p role="alert" className="font-bold">
						{problem}
					</p>
				)}

				<div className="flex justify-end space-x-4">
					<button
						type="button"
						onClick={cancel}
						disabled={busy}
						className={quiet}
					>
						Cancel
					</button>
					<button type="submit" disabled={busy} className={loud}>
						{submit}
					</button>
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
	onConfirm,
	onCancel,
}: {
	title: string;
	message?: string;
	confirm: string;
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
				<button type="button" onClick={onCancel} className={quiet}>
					Cancel
				</button>
				<button ref={yes} type="button" onClick={onConfirm} className={loud}>
					{confirm}
				</button>
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
				<input
					ref={box}
					readOnly
					aria-label="Code"
					value={code}
					onFocus={(event) => event.target.select()}
					className="w-full min-w-0 bg-yellow border-8 border-black p-2 rounded-xl text-black text-center text-2xl font-bold tracking-widest"
				/>
				<button
					ref={copyButton}
					type="button"
					onClick={copy}
					className={`${loud} flex items-center space-x-2 whitespace-nowrap`}
				>
					{copied === "yes" ? <FaCheck size={20} /> : <FaCopy size={20} />}
					<div>{copied === "yes" ? "Copied" : "Copy"}</div>
				</button>
			</div>

			<p role="status" className="min-h-6">
				{copied === "failed" &&
					"Couldn't copy it. It's selected, copy it by hand."}
			</p>

			<div className="flex justify-end">
				<button type="button" onClick={onClose} className={quiet}>
					Done
				</button>
			</div>
		</Dialog>
	);
};

export { Dialog, quiet as quietButton };
