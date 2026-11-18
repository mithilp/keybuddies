// What a thing looks like in each state, the same everywhere. Buttons get
// these from Button through aria-pressed and aria-checked. Anything else that
// can be picked (a clip, a row in the sidebar) uses them directly.

// picked, or on
export const selected = "bg-ink text-surface";

// can take what's being placed
export const dropTarget = "border-dashed border-ink";

// a bar with nothing in it. its border is quiet so dropTarget shows on it.
export const empty = "bg-paper/60 border-ink/30 text-ink/60";

// recording, counting down: something is happening right now
export const live = "bg-ink text-surface";

// Can't be used. It keeps its own colors, only the ink goes faint and a
// shadow goes, so a disabled pink button is still pink and not a pale one.
// Button, IconButton and the inputs have the same classes behind disabled:
// and aria-disabled:. A native disabled button doesn't respond on its own,
// anything else also needs pointer-events-none.
export const disabled = "text-ink/60 border-ink/40 shadow-none cursor-not-allowed";
