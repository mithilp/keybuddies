// What a thing looks like in each state, the same everywhere. Buttons get
// these from Button through aria-pressed and aria-checked. Anything else that
// can be picked (a clip, a row in the sidebar) uses them directly.

// picked, or on
export const selected = "bg-ink text-surface";

// can take what's being placed
export const dropTarget = "border-dashed border-ink";

// a bar with nothing in it
export const empty = "bg-paper/60 border-dashed border-ink text-ink/60";

// recording, counting down: something is happening right now
export const live = "bg-ink text-surface";

// can't be used. a native disabled button doesn't respond on its own, anything
// else also needs pointer-events-none.
export const disabled = "opacity-50 cursor-not-allowed";
