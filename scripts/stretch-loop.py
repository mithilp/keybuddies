#!/usr/bin/env python3
"""Make the loop file for one tempo.

    python3 scripts/stretch-loop.py bass_1.mp3 public/loops/bass_1_120.flac 120
    python3 scripts/stretch-loop.py public/loops/bass_1_120.flac public/loops/bass_1_80.flac 80

The source is either an mp3 exported from Logic or a loop this script made
before. If it's at a different tempo than the one asked for it gets
time-stretched, pitch stays the same. Needs ffmpeg.

Loops are FLAC because a loop has to be exactly 8 beats, to the sample, in
every browser. mp3 can't promise that: the encoder puts some silence in
front, a tag says how much, and browsers disagree about the tag. On the
Logic files Chrome started the loop 529 samples late and Firefox 1057 late
and 3312 samples long. FLAC stores the samples themselves, so what goes in
here is what every decoder hands back.
"""
import os
import subprocess
import sys
import tempfile

RATE = 44100
BEATS = 8
FRAME = 2 * 4  # bytes in one stereo float sample
DECODER_DELAY = 529  # what every mp3 decoder adds on top of the encoder's delay

RAW = ["-f", "f32le", "-ar", str(RATE), "-ac", "2"]


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

    if source_bpm != bpm:
        # the stretch comes out a few samples off, so pad and cut to length
        chain = f"atempo={bpm / source_bpm:.6f},apad,atrim=end_sample={frames}"
        loop = ffmpeg(RAW + ["-i", "-", "-af", chain] + RAW + ["-"], loop)

    ffmpeg(
        RAW
        + ["-i", "-", "-map_metadata", "-1", "-fflags", "+bitexact"]
        + ["-c:a", "flac", "-compression_level", "12", "-sample_fmt", "s16", out],
        loop,
    )

    written = len(decode(out)) // FRAME
    if written != frames:
        raise SystemExit(f"{out} came out {written} samples long, wanted {frames}")

    print(f"{out}: {frames} samples, {bpm} BPM (source was {source_bpm})")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        raise SystemExit(__doc__)
    main(*sys.argv[1:])
