// the loudest a downloaded mix gets, 1 dB under the most a file can hold
export const CEILING = 0.891;

// size of a WAV file's header, in bytes
export const HEADER = 44;

const text = (view: DataView, at: number, value: string) => {
	for (let i = 0; i < value.length; i++) {
		view.setUint8(at + i, value.charCodeAt(i));
	}
};

// Adds tracks up and writes them straight into a 16 bit stereo WAV file.
// Every track is its left and right channel, `frames` samples long.
//
// A few tracks at full volume on top of each other go over what a file can
// hold and would come out distorted, so when the loudest sample of the sum
// is over the ceiling the whole mix is turned down until it fits. A mix that
// already fits is left as it is.
//
// The sum is never kept anywhere. It's added up once to find the loudest
// sample and again while it's written, so a long song is only ever in memory
// as its tracks and the file.
export const encodeWav = (
	tracks: ReadonlyArray<readonly [Float32Array, Float32Array]>,
	frames: number,
	sampleRate: number
) => {
	const sample = (channel: 0 | 1, i: number) => {
		let sum = 0;
		for (const track of tracks) sum += track[channel][i] ?? 0;
		return sum;
	};

	let peak = 0;
	for (let i = 0; i < frames; i++) {
		peak = Math.max(peak, Math.abs(sample(0, i)), Math.abs(sample(1, i)));
	}
	const gain = peak > CEILING ? CEILING / peak : 1;

	const channels = 2;
	const bytes = frames * channels * 2;
	const file = new ArrayBuffer(HEADER + bytes);
	const view = new DataView(file);

	text(view, 0, "RIFF");
	view.setUint32(4, 36 + bytes, true);
	text(view, 8, "WAVE");
	text(view, 12, "fmt ");
	view.setUint32(16, 16, true);
	// plain PCM
	view.setUint16(20, 1, true);
	view.setUint16(22, channels, true);
	view.setUint32(24, sampleRate, true);
	view.setUint32(28, sampleRate * channels * 2, true);
	view.setUint16(32, channels * 2, true);
	view.setUint16(34, 16, true);
	text(view, 36, "data");
	view.setUint32(40, bytes, true);

	let at = HEADER;
	for (let i = 0; i < frames; i++) {
		for (const channel of [0, 1] as const) {
			const value = Math.max(-1, Math.min(1, sample(channel, i) * gain));
			view.setInt16(
				at,
				Math.round(value < 0 ? value * 0x8000 : value * 0x7fff),
				true
			);
			at += 2;
		}
	}

	return file;
};
