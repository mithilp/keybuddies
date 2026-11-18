import assert from "node:assert/strict";
import { test } from "node:test";
import { CEILING, HEADER, encodeWav } from "../src/utils/wav.ts";

const track = (left: number[], right: number[]) =>
	[new Float32Array(left), new Float32Array(right)] as const;

const samples = (file: ArrayBuffer) => {
	const view = new DataView(file);
	const out: number[] = [];
	for (let at = HEADER; at < file.byteLength; at += 2) {
		out.push(view.getInt16(at, true));
	}
	return out;
};

const ascii = (file: ArrayBuffer, at: number, length: number) =>
	String.fromCharCode(...new Uint8Array(file, at, length));

test("writes a 16 bit stereo header", () => {
	const file = encodeWav([track([0, 0, 0], [0, 0, 0])], 3, 48000);
	const view = new DataView(file);

	assert.equal(file.byteLength, HEADER + 3 * 2 * 2);
	assert.equal(ascii(file, 0, 4), "RIFF");
	assert.equal(view.getUint32(4, true), file.byteLength - 8);
	assert.equal(ascii(file, 8, 8), "WAVEfmt ");
	assert.equal(view.getUint16(20, true), 1);
	assert.equal(view.getUint16(22, true), 2);
	assert.equal(view.getUint32(24, true), 48000);
	assert.equal(view.getUint32(28, true), 48000 * 4);
	assert.equal(view.getUint16(32, true), 4);
	assert.equal(view.getUint16(34, true), 16);
	assert.equal(ascii(file, 36, 4), "data");
	assert.equal(view.getUint32(40, true), 12);
});

test("interleaves left and right and adds the tracks up", () => {
	const file = encodeWav(
		[track([0.25, -0.25], [0.5, 0]), track([0.25, 0], [0, -0.5])],
		2,
		44100
	);

	assert.deepEqual(samples(file), [
		Math.round(0.5 * 0x7fff),
		Math.round(0.5 * 0x7fff),
		Math.round(-0.25 * 0x8000),
		Math.round(-0.5 * 0x8000),
	]);
});

test("leaves a mix that fits alone", () => {
	const file = encodeWav([track([0.8], [-0.8])], 1, 44100);
	assert.deepEqual(samples(file), [
		Math.round(0.8 * 0x7fff),
		Math.round(-0.8 * 0x8000),
	]);
});

test("turns a loud mix down to the ceiling instead of clipping it", () => {
	const loud = encodeWav(
		[track([0.9, 0.3], [0.9, 0]), track([0.9, 0.3], [0, 0])],
		2,
		44100
	);
	const [left, right, left2] = samples(loud);

	// the loudest sample, 1.8, lands on the ceiling
	assert.equal(left, Math.round(CEILING * 0x7fff));
	assert.equal(right, Math.round(0.9 * (CEILING / 1.8) * 0x7fff));
	// everything else comes down by the same amount
	assert.equal(left2, Math.round(0.6 * (CEILING / 1.8) * 0x7fff));
});

test("a song with no tracks is silence", () => {
	assert.deepEqual(samples(encodeWav([], 2, 44100)), [0, 0, 0, 0]);
});
