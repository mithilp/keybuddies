#!/usr/bin/env python3
"""Make an 80 or 160 BPM copy of a 120 BPM loop.

    python3 scripts/stretch-loop.py public/loops/bass_1_120.mp3 public/loops/bass_1_80.mp3 80

Needs ffmpeg with libmp3lame. Pitch stays the same, only the tempo changes.

The loops exported from Logic are plain 160k frames behind an ID3v2.2 tag
with an iTunSMPB comment that says "skip 528 samples, then the next N are
the loop". Chrome reads that and decodes exactly 8 beats. Firefox ignores it,
decodes every frame, and the loop starts 1057 samples in (528 from the
encoder, 529 from the decoder). This writes the same layout, so a stretched
loop lines up with the Logic ones in both.
"""
import os
import subprocess
import sys
import tempfile

SOURCE_BPM = 120
SOURCE_START = 1057  # where the loop starts in a full decode of a Logic file
SOURCE_SAMPLES = 176400  # 8 beats at 120 BPM and 44.1 kHz
LAME_START = 576 + 529  # where libmp3lame puts its first input sample
TAG_DELAY = 528  # the delay the Logic files declare
TAG_SIZE = 4086  # Logic pads its tag to this size
FRAME = 1152

BITRATES = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320]
RATES = [44100, 48000, 32000]


def frame_sizes(data):
    sizes = []
    at = 0
    while at + 4 <= len(data):
        if data[at] != 0xFF or (data[at + 1] & 0xFE) != 0xFA:
            raise SystemExit(f"not an mp3 frame at byte {at}")
        bitrate = BITRATES[data[at + 2] >> 4]
        rate = RATES[(data[at + 2] >> 2) & 3]
        padded = (data[at + 2] >> 1) & 1
        sizes.append(144000 * bitrate // rate + padded)
        at += sizes[-1]
    return sizes


def encode(source, bpm, samples, total):
    # drop a few samples off the front so the loop starts on the same
    # sample a Logic file does, then pad the end out to `total`
    shift = LAME_START - (TAG_DELAY + 529)
    chain = ",".join(
        [
            f"atrim=start_sample={SOURCE_START}:end_sample={SOURCE_START + SOURCE_SAMPLES}",
            "asetpts=N/SR/TB",
            f"atempo={bpm / SOURCE_BPM:.6f}",
            "apad",
            f"atrim=end_sample={samples}",
            f"atrim=start_sample={shift}",
            "asetpts=N/SR/TB",
            "apad",
            f"atrim=end_sample={total}",
        ]
    )
    with tempfile.TemporaryDirectory() as folder:
        path = os.path.join(folder, "loop.mp3")
        subprocess.run(
            ["ffmpeg", "-v", "error", "-y", "-i", source, "-af", chain]
            + ["-map_metadata", "-1", "-fflags", "+bitexact", "-flags:a", "+bitexact"]
            + ["-c:a", "libmp3lame", "-b:a", "160k", "-ar", "44100", "-ac", "2"]
            + ["-write_xing", "0", "-id3v2_version", "0", "-f", "mp3", path],
            check=True,
        )
        with open(path, "rb") as file:
            return file.read()


def main(source, out, bpm):
    bpm = int(bpm)
    if SOURCE_SAMPLES * SOURCE_BPM % bpm:
        raise SystemExit("8 beats at that tempo isn't a whole number of samples")
    samples = SOURCE_SAMPLES * SOURCE_BPM // bpm

    # Logic writes one frame more than the loop strictly needs
    frames = -(-(TAG_DELAY + 529 + samples) // FRAME) + 1

    # the encoder decides how many frames it writes, so pad until it's right
    for padding in range(0, 4 * FRAME, 100):
        audio = encode(source, bpm, samples, samples + padding)
        sizes = frame_sizes(audio)
        if len(sizes) == frames:
            break
    else:
        raise SystemExit("couldn't get the frame count to match")

    text = " 00000000 %08X %08X %016X 00000000 %08X" % (
        TAG_DELAY,
        frames * FRAME - TAG_DELAY - samples,
        samples,
        len(audio) - sum(sizes[-8:]),
    )
    text += " 00000000" * 6

    body = b"\x00eng" + b"iTunSMPB\x00" + text.encode("ascii")
    comment = b"COM" + len(body).to_bytes(3, "big") + body
    comment += b"\x00" * (TAG_SIZE - len(comment))
    size = bytes((TAG_SIZE >> shift) & 0x7F for shift in (21, 14, 7, 0))

    with open(out, "wb") as file:
        file.write(b"ID3\x02\x00\x00" + size + comment + audio)

    print(f"{out}: {samples} samples in {frames} frames")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        raise SystemExit(__doc__)
    main(*sys.argv[1:])
