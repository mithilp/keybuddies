"use client";

import crunker from "./crunker";
import { Song } from "./song";

// How far ahead of now the tracks are told to start, in seconds. It gives the
// browser time to have every track ready, so they all begin on the same
// sample.
const LEAD = 0.03;

type Voice = { gain: GainNode; source: AudioBufferSourceNode | null };

// Plays a rendered song through the one audio context. Every track is a
// buffer source going through its own gain, and all of them are started at
// the same context time. That makes
// - muting a gain change,
// - the position a read of the context's clock,
// - seeking a restart of the sources from somewhere else,
// - looping the sources' own loop, which wraps on the exact sample. Every
//   track's buffer is as long as the song, so they all wrap together.
export class Transport {
	private song: Song | null = null;
	private voices = new Map<string, Voice>();

	// the context time the sources started at, and where in the song that was
	private startedAt = 0;
	private offset = 0;

	private looping = false;

	// called once when the song gets to its end by itself. not when it's
	// stopped, and not while it loops.
	onEnded: (() => void) | null = null;

	get playing() {
		return this.song !== null;
	}

	// `at` is seconds into the song. `muted` says which tracks start silent.
	start(song: Song, at: number, muted: (track: string) => boolean) {
		this.stop();

		const context = crunker!.context;
		this.song = song;

		for (const { track } of song.tracks) {
			const gain = context.createGain();
			gain.gain.value = muted(track) ? 0 : 1;
			gain.connect(context.destination);

			this.voices.set(track, { gain: gain, source: null });
		}

		this.begin(at);
	}

	// jumps to another place in the song without stopping it
	seek(at: number) {
		if (!this.song) return;

		this.silence();
		this.begin(at);
	}

	stop() {
		this.silence();

		for (const { gain } of this.voices.values()) {
			gain.disconnect();
		}

		this.voices.clear();
		this.song = null;
	}

	mute(track: string, muted: boolean) {
		const voice = this.voices.get(track);
		if (!voice) return;

		// a few ms of ramp, a jump in volume would click
		voice.gain.gain.setTargetAtTime(
			muted ? 0 : 1,
			crunker!.context.currentTime,
			0.005
		);
	}

	// Takes effect right away, also on a song that's playing. Switched off
	// mid song, the song plays to its end and stops there.
	setLoop(looping: boolean) {
		this.looping = looping;

		for (const { source } of this.voices.values()) {
			if (source) source.loop = looping;
		}
	}

	// seconds into the song right now
	position() {
		if (!this.song) return 0;

		// before the sources have started this is still where they will
		const elapsed = Math.max(
			0,
			crunker!.context.currentTime - this.startedAt
		);

		// a looping song has been around a few times
		return (this.offset + elapsed) % this.song.duration;
	}

	// a source can only be started once, so every start and every seek makes
	// new ones
	private begin(at: number) {
		const context = crunker!.context;
		const song = this.song!;

		if (!(at >= 0 && at < song.duration)) at = 0;

		const when = context.currentTime + LEAD;
		let last: AudioBufferSourceNode | null = null;

		for (const { track, buffer } of song.tracks) {
			const voice = this.voices.get(track)!;

			const source = context.createBufferSource();
			source.buffer = buffer;
			source.loop = this.looping;
			source.connect(voice.gain);
			source.start(when, at);

			voice.source = source;
			last = source;
		}

		this.startedAt = when;
		this.offset = at;

		// every track is as long as the song, so one of them ending is the
		// song ending
		if (last) {
			last.onended = () => {
				const ended = this.onEnded;
				this.stop();
				ended?.();
			};
		}
	}

	private silence() {
		for (const voice of this.voices.values()) {
			if (!voice.source) continue;

			// stopping fires ended too, and that isn't the song finishing
			voice.source.onended = null;
			voice.source.stop();
			voice.source.disconnect();
			voice.source = null;
		}
	}
}
