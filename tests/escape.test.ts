import assert from "node:assert/strict";
import { test } from "node:test";
import { escapeKey, onEscape } from "../src/utils/escape.ts";

// a key press, and whether something stopped it going any further
const press = (key = "Escape") => {
	const event = { key: key, stopped: false, stopPropagation: () => {} };
	event.stopPropagation = () => {
		event.stopped = true;
	};
	escapeKey(event);
	return event;
};

test("Escape closes what opened last and nothing under it", () => {
	const closed: string[] = [];

	const recorder = onEscape({ current: () => closed.push("recorder") });
	const popup = onEscape({ current: () => closed.push("popup") });
	const dialog = onEscape({ current: () => closed.push("dialog") });

	assert.ok(press().stopped);
	assert.deepEqual(closed, ["dialog"]);

	dialog();
	press();
	assert.deepEqual(closed, ["dialog", "popup"]);

	popup();
	press();
	assert.deepEqual(closed, ["dialog", "popup", "recorder"]);

	recorder();
});

test("something closing under the top one leaves the top one on top", () => {
	const closed: string[] = [];

	const recorder = onEscape({ current: () => closed.push("recorder") });
	const dialog = onEscape({ current: () => closed.push("dialog") });

	recorder();
	press();
	assert.deepEqual(closed, ["dialog"]);

	dialog();
});

test("with nothing open Escape goes on to the rest of the page", () => {
	assert.equal(press().stopped, false);
});

test("other keys aren't touched", () => {
	const closed: string[] = [];
	const recorder = onEscape({ current: () => closed.push("recorder") });

	assert.equal(press("a").stopped, false);
	assert.deepEqual(closed, []);

	recorder();
});
