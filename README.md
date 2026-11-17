# KeyBuddies

Make a song with your friends in the browser. One person starts a studio, everyone else joins with its 6-digit code, and whatever anyone changes shows up for everyone.

Devpost prize: Winner, Future of Entertainment.

## What you can do

- Stack tracks. A track is a row of bars, and clips on it are 1, 2 or 4 bars long.
- Add loops from the library (bass, piano, drums) to the studio and put them on tracks, next to the sounds you recorded.
- Record a piano part on your keyboard and fix it up on a grid, or tap out a drum beat on a grid of sixteenths. Either one can be 1, 2 or 4 bars.
- Share a recorded sound with another studio by its code.
- Set the tempo to 80, 120 or 160 BPM for the whole studio.
- Play, pause, loop, mute tracks, and download the song as a WAV.

## How it works

It's a Next.js app with Firestore behind it. There is no server of its own and no sign-in. The studio page listens to its studio and its tracks with `onSnapshot`, so an edit made by one person is drawn for everyone. Track edits go through transactions so two people editing the same track don't overwrite each other.

Firestore only holds the arrangement. All audio is made in the browser:

- Loops are FLAC files in `public/loops`, one per tempo, each exactly 2 bars (8 beats) long. `scripts/stretch-loop.py` makes them.
- Piano sounds are built from the note samples in `public/sounds/piano`.
- Drums are synthesized in `src/utils/drum-synth.ts`, there are no drum files.
- `src/utils/song.ts` renders every track to one buffer of the same length, and `src/utils/transport.ts` starts them all at the same time on one audio context. That's what keeps tracks in sync, and makes muting and looping cheap.
- The timing math lives in `src/utils/tempo.ts`. A bar is 4 beats, so a 2 bar loop is 176400 samples at 120 BPM and 44.1 kHz. Every clip starts on a bar line counted from the start of the song, so nothing drifts.
- A clip plays its source from the start. A clip shorter than its source cuts it off (a 1 bar clip of a loop plays the loop's first bar), and a longer one plays it again from the next bar line (a 4 bar clip of a loop plays it twice). `fill` in `src/utils/clips.ts` does that math.

## Data model

`studios/{code}`: the code is the 6-digit studio code.

| field | |
| --- | --- |
| `createdAt` | timestamp |
| `bpm` | `"80"`, `"120"` or `"160"` |
| `library` | ids of the loops added from the library |
| `libraryRemoved` | ids of the loops taken out of the sidebar list while a track still held them |

Both lists can be missing. A studio made before the library has neither, and the loops its tracks hold show up in the sidebar anyway. The first time it's opened those loops are written into `library`, so they stay in the list when their clips are replaced. `studioLoops` in `src/utils/loops.ts` makes the list.

`studios/{code}/tracks/{id}`

| field | |
| --- | --- |
| `createdAt` | timestamp |
| `name` | track name |
| `order` | where it sits in the list |
| `clips` | the clips, in order. Tracks from before clips had lengths don't have it |
| `bars` | how many bars the track is. Same as `clips` |
| `notes` | the 8 beat cells from before clips had lengths. Empty on new tracks |

A clip is `{ type, name, id, start, bars }`. `type` is `"loop"` (`id` is a loop from the library in `src/utils/loops.ts`) or `"sound"` (`id` is a document in `sounds`). `start` is the bar it starts on, from 0, and `bars` is 1, 2 or 4. Clips never overlap. They stay in an array on the track doc, so one transaction still covers a whole track edit.

Tracks from before clips had lengths have a list of 8 beat cells in `notes`, `{ type, name, id }` with `type` `"empty"`, `"loop"` or `"sound"`, and no `clips` or `bars`. They aren't migrated. `readTrack` in `src/utils/clips.ts` reads the cell at index i as a 2 bar clip on bar i * 2, and the track as 2 bars per cell. The first edit to one writes `clips` and `bars` and leaves `notes` as it was. A track with `clips` is only read from them.

Once a track has `clips`, the rules turn down any change to its `notes`. A tab still on the old app only knows `notes`, so on those tracks it gets its "Couldn't save that change" message instead of an edit nobody sees. It still shows the cells the track had before its first new edit, and new tracks as empty, until it's reloaded.

`sounds/{id}`

| field | |
| --- | --- |
| `name` | sound name |
| `type` | `"piano"` or `"drum"` |
| `sequence` | the notes, each `{ note, start, end }` |
| `bars` | 1, 2 or 4. Sounds from before it was added don't have it and are 2 bars |
| `steps` | drum sounds only: how many steps the beat is cut into, 16 to a bar when it has `bars`. Beats from before it was added don't have it |
| `code` | 6-digit code for sharing it, set the first time it's shared |

`studios/{code}/soundList/{id}`: an empty doc for each sound the studio has, named by the sound's id. A sound can be in more than one studio, and taking it out of one leaves it in the others.

`shareCodes/{code}`: `{ sound }`, the id of the sound a share code is for. Adding a sound by its code looks it up here.

Sounds made before `soundList` and `shareCodes` have an `in` field with the codes of their studios. `scripts/move-sounds.ts` puts them in their studios' `soundList` and leaves `in` where it is, see Firestore rules below. The app doesn't read or write `in` any more.

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

Changing `firestore.rules` doesn't change the live database. The new app reads each studio's `soundList`, so old sounds have to be moved over first with `scripts/move-sounds.ts`:

```bash
node --env-file=.env.local scripts/move-sounds.ts          # says what it would do
node --env-file=.env.local scripts/move-sounds.ts --write  # does it
```

The script lists every sound, which the rules turn down, so it only works while the database is still open. The first time:

1. Run it, dry run first, then `--write`, before merging. The old app ignores what it adds.
2. Merge and wait for Vercel to deploy.
3. Run `--write` again, to pick up what tabs still on the old app saved, shared or added since.
4. Publish the rules right after that, with nothing in between. Anything an old tab writes after the last run won't show in the new app.
5. Click through the app and watch the console for `PERMISSION_DENIED`.

Publish at a quiet hour. Once the rules are live, tabs still on the old app can't save, share or add sounds, since those list `/sounds`, and a recording that fails to save is lost on reload. A reload gets the new app.

Known gaps:

- A sound taken out of a studio in an old tab after the first run comes back in the new app, since reruns only add. It can be taken out again there.
- Old sounds keep `in`, and a sound can be read by anyone with its share code or id, so the studio codes in `in` are still readable. Rules can't hide a field, so closing this means removing `in` from old sounds. The rules turn that down too, so it has to happen before they're published, or with admin access.

It only adds docs. Old sounds keep their `in`, so tabs still on the old app keep working until the rules are published. Before writing anything, `--write` saves every sound, and every studio with its tracks and `soundList`, to `backup-<time>.json` in the folder it's run from (gitignored). `--backup <file>` saves it somewhere else, and works without `--write` too. Running it again is safe: `movedSounds/{id}` keeps which studios each sound was already put in, so a second run only picks up studios an old tab added since, and a sound someone took out of a studio stays out.

To publish the rules, paste them into Firestore > Rules in the Firebase console, or run `firebase deploy --only firestore:rules`.
