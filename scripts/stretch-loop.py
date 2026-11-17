#!/usr/bin/env python3
"""Make the loop file for one tempo.

    python3 scripts/stretch-loop.py bass_1.mp3 public/loops/bass_1_120.flac 120
    python3 scripts/stretch-loop.py public/loops/bass_1_120.flac public/loops/bass_1_80.flac 80

The source is either an mp3 exported from Logic or a loop this script made
before. If it's at a different tempo than the one asked for it gets
time-stretched to exactly 8 beats, with the pitch within a few cents of
where it was. Needs ffmpeg.

Loops are FLAC because a loop has to be exactly 8 beats, to the sample, in
every browser. mp3 can't promise that: the encoder puts some silence in
front, a tag says how much, and browsers disagree about the tag. On the
Logic files Chrome started the loop 529 samples late and Firefox 1057 late
and 3312 samples long. FLAC stores the samples themselves, so what goes in
here is what every decoder hands back.
"""
import math
import os
import subprocess
import sys
import tempfile

RATE = 44100
BEATS = 8
FRAME = 2 * 4  # bytes in one stereo float sample
DECODER_DELAY = 529  # what every mp3 decoder adds on top of the encoder's delay

NUDGES = 8  # how many tempos either side of the asked one the stretch tries
NUDGE = 0.0002  # how far apart they are, as a share of the tempo
LIMIT = 0.003  # the most a stretch may be resampled by, about 5 cents of pitch
SLACK = 8  # samples of silence a loop may end in beyond what its source does


def raw(rate):
    return ["-f", "f32le", "-ar", str(rate), "-ac", "2"]


RAW = raw(RATE)


def ffmpeg(args, data=None):
    return subprocess.run(
        ["ffmpeg", "-v", "error", "-y"] + args,
        input=data,
        stdout=subprocess.PIPE,
        check=True,
    ).stdout


def decode(path):
    return ffmpeg(["-i", path] + RAW + ["-"])


def logic_tag(data):
    """The delay and length a Logic mp3 declares, and where its frames start."""
    if data[:3] != b"ID3":
        return None
    size = 0
    for byte in data[6:10]:
        size = (size << 7) | byte
    at = data.find(b"iTunSMPB\x00", 0, 10 + size)
    if at < 0:
        return None
    fields = data[at + 9 : 10 + size].split(b"\x00")[0].split()
    return int(fields[1], 16), int(fields[3], 16), 10 + size


def read_loop(path):
    """The loop as raw stereo float samples, nothing before it or after."""
    with open(path, "rb") as file:
        data = file.read()

    if not path.lower().endswith(".mp3"):
        return decode(path)

    tag = logic_tag(data)
    if tag is None:
        raise SystemExit("that mp3 has no iTunSMPB tag, so there's no telling where the loop starts")
    delay, length, frames_at = tag

    # decode the bare frames so no decoder gets to act on the tag, then cut
    # the loop out by hand
    with tempfile.TemporaryDirectory() as folder:
        bare = os.path.join(folder, "frames.mp3")
        with open(bare, "wb") as file:
            file.write(data[frames_at:])
        samples = decode(bare)

    start = (delay + DECODER_DELAY) * FRAME
    loop = samples[start : start + length * FRAME]
    if len(loop) != length * FRAME:
        raise SystemExit("the file is shorter than its tag says")
    return loop


def stretch(loop, tempo, frames):
    """The loop `tempo` times as fast and exactly `frames` samples long.

    atempo can't be told a length. It comes out up to 1500 samples short or
    long, and padding or cutting that leaves the end of the loop silent or
    missing. Where it lands jumps around with the tempo, so the tempos right
    next to the asked one are tried too and the closest one is kept. What's
    still missing is made up by resampling, which moves the pitch by the
    same share. Returns the loop and how far the pitch moved, in cents.
    """
    best = None
    for nudge in sorted(range(-NUDGES, NUDGES + 1), key=abs):
        chain = f"atempo={tempo * (1 + nudge * NUDGE):.6f}"
        tried = ffmpeg(RAW + ["-i", "-", "-af", chain] + RAW + ["-"], loop)

        if best is None or abs(len(tried) // FRAME - frames) < abs(best - frames):
            best = len(tried) // FRAME
            stretched = tried

    if abs(best - frames) > frames * LIMIT:
        raise SystemExit(
            f"the stretch came out {best} samples long, too far from {frames} to fix"
        )

    if best != frames:
        # called `best` Hz and resampled to `frames` Hz, every sample of the
        # stretch is used and it comes out `frames` samples long
        chain = f"aresample={frames}"
        stretched = ffmpeg(
            raw(best) + ["-i", "-", "-af", chain] + raw(frames) + ["-"], stretched
        )

    return stretched, 1200 * math.log2(best / frames)


def silent_tail(loop):
    """How many samples of pure silence the loop ends in."""
    silence = bytes(FRAME)
    last = len(loop) // FRAME
    while last > 0 and loop[(last - 1) * FRAME : last * FRAME] == silence:
        last -= 1
    return len(loop) // FRAME - last


def bpm_of(loop):
    frames = len(loop) // FRAME
    if frames == 0 or BEATS * 60 * RATE % frames:
        raise SystemExit(f"{frames} samples isn't 8 beats at a whole tempo")
    return BEATS * 60 * RATE // frames


def main(source, out, bpm):
    bpm = int(bpm)
    if BEATS * 60 * RATE % bpm:
        raise SystemExit("8 beats at that tempo isn't a whole number of samples")
    frames = BEATS * 60 * RATE // bpm

    loop = read_loop(source)
    source_bpm = bpm_of(loop)

    # a source that fades out can end in some silence of its own
    allowed = silent_tail(loop) * source_bpm // bpm + SLACK
    note = f"source was {source_bpm}"

    if source_bpm != bpm:
        loop, cents = stretch(loop, bpm / source_bpm, frames)
        note += f", pitch moved {cents:+.1f} cents"

    ffmpeg(
        RAW
        + ["-i", "-", "-map_metadata", "-1", "-fflags", "+bitexact"]
        + ["-c:a", "flac", "-compression_level", "12", "-sample_fmt", "s16", out],
        loop,
    )

    # nothing above pads or cuts, so a wrong length here is a real miss
    written = decode(out)
    if len(written) != frames * FRAME:
        raise SystemExit(
            f"{out} came out {len(written) // FRAME} samples long, wanted {frames}"
        )

    # the right length isn't enough, the sound has to reach the end of it
    silent = silent_tail(written)
    if silent > allowed:
        raise SystemExit(f"{out} ends in {silent} samples of silence")

    print(f"{out}: {frames} samples, {bpm} BPM ({note})")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        raise SystemExit(__doc__)
    main(*sys.argv[1:])
