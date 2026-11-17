# KeyBuddies

Make a song with your friends in the browser. One person starts a studio, everyone else joins with its 6-digit code, and whatever anyone changes shows up for everyone.

Devpost prize: Winner, Future of Entertainment.

## What you can do

- Stack tracks. A track is a row of cells, and each cell is 8 beats.
- Add loops from the library (bass, piano, drums) to the studio and put them in cells, next to the sounds you recorded.
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
| `library` | ids of the loops added from the library |
| `libraryRemoved` | ids of the loops taken out of the sidebar list while a cell still held them |

Both lists can be missing. A studio made before the library has neither, and the loops its cells hold show up in the sidebar anyway. The first time it's opened those loops are written into `library`, so they stay in the list when their cells are overwritten. `studioLoops` in `src/utils/loops.ts` makes the list.

`studios/{code}/tracks/{id}`

| field | |
| --- | --- |
| `createdAt` | timestamp |
| `name` | track name |
| `order` | where it sits in the list |
| `notes` | the cells, in order |

A cell is `{ type, name, id }`. `type` is `"empty"`, `"loop"` (`id` is a loop from the library in `src/utils/loops.ts`) or `"sound"` (`id` is a document in `sounds`).

`sounds/{id}`

| field | |
| --- | --- |
| `name` | sound name |
| `type` | `"piano"` or `"drum"` |
| `sequence` | the notes, each `{ note, start, end }` |
| `steps` | drum sounds only: how many steps the cell is cut into. Beats from before it was added don't have it |
| `code` | 6-digit code for sharing it, set the first time it's shared |

`studios/{code}/soundList/{id}`: an empty doc for each sound the studio has, named by the sound's id. A sound can be in more than one studio, and taking it out of one leaves it in the others.

`shareCodes/{code}`: `{ sound }`, the id of the sound a share code is for. Adding a sound by its code looks it up here.

Sounds made before `soundList` and `shareCodes` have an `in` field with the codes of their studios. `scripts/move-sounds.ts` moves them over, see Firestore rules below.

For a piano sound `note` is a MIDI number and `start` and `end` are in eighths of a beat, 0 to 64. For a drum sound `note` is the drum's place in `drumVoices` and `start` is a half-beat step, 0 to 15.

## Running it

You need Node 24 and a Firebase project with Firestore turned on. The app reads and writes without signing in, so the rules in `firestore.rules` let anyone in, but only to the paths and shapes above.

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
npm test        # timing, drum and library tests, run with node --test
npx tsc --noEmit
```

## Firestore rules

The rules are in `firestore.rules`. With no sign-in they can't say who writes, only what: nothing can be listed except a studio's own tracks and sounds, so studio codes can't be pulled out of the database, studio codes are 6 digits, studios and sounds can't be deleted (the app never does), fields like `createdAt`, `name` and `type` don't change, and lists and names have caps far past what the app makes. Updates only check the fields they change, so studios, tracks and sounds from 2024 with fields the app doesn't use any more still work.

The tests in `tests/rules` run every read and write the app makes against the Firestore emulator, plus the ones that should be turned down:

```bash
npm run test:rules
```

That needs Java 11 or newer. It runs firebase-tools 13 through npx under the `demo-keybuddies` project, so it never touches the real database. The emulator starts for the run and stops after it.

Changing `firestore.rules` doesn't change the live database. Before publishing them the first time, move the old sounds over while the database is still open, or their studios' sidebars will come up empty:

```bash
node --env-file=.env.local scripts/move-sounds.ts          # says what it would do
node --env-file=.env.local scripts/move-sounds.ts --write  # does it
```

Then publish the rules by pasting them into Firestore > Rules in the Firebase console, or with `firebase deploy --only firestore:rules`.
