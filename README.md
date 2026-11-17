# KeyBuddies

Make a song with your friends in the browser. One person starts a studio, everyone else joins with its 6-digit code, and whatever anyone changes shows up for everyone.

Devpost prize: Winner, Future of Entertainment.

## What you can do

- Stack tracks. A track is a row of cells, and each cell is 8 beats.
- Put a loop in a cell (bass, piano, drums), or a sound you recorded.
- Record a piano part on your keyboard and fix it up on a grid, or tap out a drum beat on a 16-step grid.
- Share a recorded sound with another studio by its code.
- Set the tempo to 80, 120 or 160 BPM for the whole studio.
- Play, pause, loop, mute tracks, and download the song as a WAV.

## How it works

It's a Next.js app with Firestore behind it. There is no server of its own and no sign-in. The studio page listens to its studio and its tracks with `onSnapshot`, so an edit made by one person is drawn for everyone. Cell edits go through transactions so two people editing the same track don't overwrite each other.

Firestore only holds the arrangement. All audio is made in the browser:

- Loops are FLAC files in `public/loops`, one per tempo, each exactly 8 beats long. `scripts/stretch-loop.py` makes them.
- Piano sounds are built from the note samples in `public/sounds/piano`.
- Drums are synthesized in `src/utils/drum-synth.ts`, there are no drum files.
- `src/utils/song.ts` renders every track to one buffer of the same length, and `src/utils/transport.ts` starts them all at the same time on one audio context. That's what keeps tracks in sync, and makes muting and looping cheap.
- The timing math lives in `src/utils/tempo.ts`. A cell is always 8 beats, so 176400 samples at 120 BPM and 44.1 kHz.

## Data model

`studios/{code}`: the code is the 6-digit studio code.

| field | |
| --- | --- |
| `createdAt` | timestamp |
| `bpm` | `"80"`, `"120"` or `"160"` |

`studios/{code}/tracks/{id}`

| field | |
| --- | --- |
| `createdAt` | timestamp |
| `name` | track name |
| `order` | where it sits in the list |
| `notes` | the cells, in order |

A cell is `{ type, name, id }`. `type` is `"empty"`, `"loop"` (`id` is a loop from `src/utils/loops.ts`) or `"sound"` (`id` is a document in `sounds`).

`sounds/{id}`

| field | |
| --- | --- |
| `name` | sound name |
| `type` | `"piano"` or `"drum"` |
| `sequence` | the notes, each `{ note, start, end }` |
| `in` | codes of the studios that have this sound |
| `code` | 6-digit code for sharing it |

For a piano sound `note` is a MIDI number and `start` and `end` are in eighths of a beat, 0 to 64. For a drum sound `note` is the drum's place in `drumVoices` and `start` is a half-beat step, 0 to 15.

## Running it

You need Node 24 and a Firebase project with Firestore turned on. The app reads and writes without signing in, so the Firestore rules have to allow that.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

Put these in `.env.local`. They come from the Firebase project's web app config.

- `NEXT_PUBLIC_FIREBASE_API`
- `NEXT_PUBLIC_PROJECT_ID`
- `NEXT_PUBLIC_SENDER_ID`
- `NEXT_PUBLIC_APP_ID`
- `NEXT_PUBLIC_MEASUREMENT_ID`

Other commands:

```bash
npm run build   # production build
npm run lint    # eslint
npm test        # timing tests, run with node --test
npx tsc --noEmit
```
