"use client";

import crunker from "./crunker";
import { Song } from "./song";

// How far ahead of now the tracks are told to start, in seconds. It gives the
// browser time to have every track ready, so they all begin on the same
// sample.
const LEAD = 0.03;

// How long one render of the song takes to hand over to the next, in
// seconds. Short enough not to be heard as a fade, long enough not to click.
const FADE = 0.01;

type Voice = {
	gain: GainNode;
	source: AudioBufferSourceNode | null;
	muted: boolean;
};

// Plays a rendered song through the one audio context. Every track is a
// buffer source going through its own gain, and all of them are started at
// the same context time. That makes
// - muting a gain change,
// - the position a read of the context's clock,
// - seeking a restart of the sources from somewhere else,
// - looping the sources' own loop, which wraps on the exact sample. Every
//   track's buffer is as long as the song, so they all wrap together.
// - an edit to the song a second set of sources that takes over from the
//   first at the same beat.
export class Transport {
	private song: Song | null = null;
	private voices = new Map<string, Voice>();

	// the context time the sources started at, and where in the song that was
	private startedAt = 0;
	private offset = 0;

	private looping = false;

	// called once when the song gets to its end by itself. not when it's
	// stopped, and not while it loops.
	private onEnded: (() => void) | null = null;

	get playing() {
		return this.song !== null;
	}

	// how long the song that's playing is, in seconds
	get duration() {
		return this.song?.duration ?? 0;
	}

	// the tempo the song that's playing was rendered at
	get bpm() {
		return this.song?.bpm ?? 120;
	}

	// `at` is seconds into the song. `muted` says which tracks start silent.
	// `ended` is called if the song gets to its end by itself.
	start(
		song: Song,
		at: number,
		muted: (track: string) => boolean,
		ended: () => void
	) {
		this.stop();

		this.song = song;
		this.onEnded = ended;
		this.voices = this.connect(song, muted);

		this.begin(at, crunker!.context.currentTime + LEAD);
	}

	// jumps to another place in the song without stopping it
	seek(at: number) {
		if (!this.song) return;

		this.silence();
		this.begin(at, crunker!.context.currentTime + LEAD);
	}

	// Puts a newer render of the song in place of the one that's playing. It
	// comes in at the beat the old one is on, so a song at another tempo or
	// of another length carries on from the same place in the music. The two
	// are faded into each other over a few ms. Tracks that didn't change are
	// the same samples in both, and the fade can't be heard on them.
	//
	// Comes back false when the new song has nothing at that beat: it got
	// shorter than where the song is, and the song isn't looping. Nothing is
	// changed then, ending the song is up to the caller.
	swap(song: Song, muted: (track: string) => boolean) {
		const old = this.song;
		if (!old || !(song.duration > 0)) return false;

		const when = crunker!.context.currentTime + LEAD;

		// where the old song will be when the new one comes in
		const played = this.offset + Math.max(0, when - this.startedAt);

		// it's about to end by itself
		if (!this.looping && played >= old.duration) return false;

		const seconds = played % old.duration;

		// the same beat is at another second when the tempo changed
		let at = song.bpm === old.bpm ? seconds : (seconds * old.bpm) / song.bpm;

		if (at >= song.duration) {
			if (!this.looping) return false;

			at %= song.duration;
		}

		for (const voice of this.voices.values()) {
			const { gain, source } = voice;

			gain.gain.cancelScheduledValues(when);
			gain.gain.setValueAtTime(voice.muted ? 0 : 1, when);
			gain.gain.linearRampToValueAtTime(0, when + FADE);

			if (source) {
				// this isn't the song finishing either
				source.onended = () => {
					source.disconnect();
					gain.disconnect();
				};
				source.stop(when + FADE);
			} else {
				gain.disconnect();
			}
		}

		this.song = song;
		this.voices = this.connect(song, muted);

		for (const voice of this.voices.values()) {
			voice.gain.gain.setValueAtTime(0, when);
			voice.gain.gain.linearRampToValueAtTime(voice.muted ? 0 : 1, when + FADE);
		}

		this.begin(at, when);

		return true;
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

		voice.muted = muted;

		const now = crunker!.context.currentTime;

		// a fade in that's still going would end on the old volume
		voice.gain.gain.cancelScheduledValues(now);

		// a few ms of ramp, a jump in volume would click
		voice.gain.gain.setTargetAtTime(muted ? 0 : 1, now, 0.005);
	}

	// Takes effect right away, also on a song that's playing. Switched off
	// mid song, the song plays to its end and stops there.
	setLoop(looping: boolean) {
		const now = crunker!.context.currentTime;

		// Once it has wrapped, offset + elapsed is how long the sources have
		// been going, not a place in the song. Without the loop that's what
		// swap() takes it for, so it's counted from here again.
		if (this.song && this.looping && !looping && now > this.startedAt) {
			this.offset = (this.offset + now - this.startedAt) % this.song.duration;
			this.startedAt = now;
		}

		this.looping = looping;

		for (const { source } of this.voices.values()) {
			if (source) source.loop = looping;
		}
	}

	// seconds into the song right now
	position() {
		if (!this.song) return 0;

		// before the sources have started this is still where they will
		const elapsed = Math.max(0, crunker!.context.currentTime - this.startedAt);

		// a looping song has been around a few times
		return (this.offset + elapsed) % this.song.duration;
	}

	// a gain for every track of a song, with nothing playing through it yet
	private connect(song: Song, muted: (track: string) => boolean) {
		const context = crunker!.context;
		const voices = new Map<string, Voice>();

		for (const { track } of song.tracks) {
			const silent = muted(track);

			const gain = context.createGain();
			gain.gain.value = silent ? 0 : 1;
			gain.connect(context.destination);

			voices.set(track, { gain: gain, source: null, muted: silent });
		}

		return voices;
	}

	// A source can only be started once, so every start, every seek and every
	// swap makes new ones. `when` is the context time they start at, `at` is
	// where in the song that is.
	private begin(at: number, when: number) {
		const context = crunker!.context;
		const song = this.song!;

		if (!(at >= 0 && at < song.duration)) at = 0;

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
