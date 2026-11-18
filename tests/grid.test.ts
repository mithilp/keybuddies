import assert from "node:assert/strict";
import { test } from "node:test";
import {
	BAR_WIDTH,
	CLIP_GAP,
	CLIP_LEFT,
	PLAYHEAD_LEFT,
	PLAYHEAD_WIDTH,
} from "../src/utils/grid.ts";

test("the playhead on a bar line sits between the clips, not on them", () => {
	for (const bar of [0, 1, 7]) {
		const line = bar * BAR_WIDTH + PLAYHEAD_LEFT;
		const lineEnd = line + PLAYHEAD_WIDTH;

		// the clip of the bar before ends before the line
		if (bar > 0) {
			const before = (bar - 1) * BAR_WIDTH + CLIP_LEFT;
			assert.ok(before + BAR_WIDTH - CLIP_GAP <= line);
		}

		// and the clip of this bar starts after it
		assert.ok(bar * BAR_WIDTH + CLIP_LEFT >= lineEnd);
	}
});
