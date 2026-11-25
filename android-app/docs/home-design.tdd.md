# Approved splash and home: validation record

Journeys were derived from the approved home prototype and the Android redesign to-do: start setup, resume learning, continue after mastery, view actual XP, and open existing tools.

RED: `node --test tests/home.test.mjs` failed because the new home summary module was not implemented (`ERR_MODULE_NOT_FOUND`). Checkpoint: `5229fa1`.

GREEN: the same seven tests pass. They cover a new learner, latest valid opened mission, advancement after mastery, earlier unfinished missions after mastering the last mission, full completion, restored answers without opened history, and an empty curriculum.

`npm test`: 50 tests passed. `npm run typecheck`: passed.

`node --test --experimental-test-coverage --test-coverage-include=src/progress/home.ts tests/home.test.mjs`: 100% lines, branches, and functions for the new summary logic. This does not measure native UI coverage.

`npm run check:bundle`: Android export passed. Native device checks remain pending: splash masking and sizing, navigation, TalkBack, large text, small-screen/landscape layouts, and cold-start persistence. No Android SDK/device is available in this workspace. No physical-device or visual-runtime pass is claimed.

Artwork: built-in image-generation edits of the approved logo and home prototype produced transparent logo lockup, header mark, and workshop illustration PNGs under `android-app/assets/`. Other screens retain their existing design.

## Approved Mission Map implementation

The map now uses the same tested `createHomeSummary` and `createLearningResults` functions as Home for its highlighted mission, mastery, and XP. This presentation change adds no progress storage or scoring logic. All missions link to their existing lessons, including mastered and unopened missions. New learners retain a setup link and completed learners receive a Review link. The bottom navigation was extracted without changing its destinations and is shared with Home.

Validation after the map change: `npm test` passed all 50 tests; `npm run typecheck` passed; `npm run check:bundle` exported Android successfully; `git diff --check` passed. Native UI interaction, appearance, TalkBack, and large-text checks remain pending, as described in the README. No device rendering is claimed.

## Approved Practice implementation

Practice now uses the approved clay palette, focused header, pair progress, and large matching choices. The incorrect choice is marked amber until another answer is chosen; correct matches still advance immediately. Both matching and ordering use labeled retry/success feedback. Existing scoring, shuffling, ordering, undo, reset, and exercise navigation functions are retained; no progress-writing calls or XP awards were added. The invalid-route recovery now points to `/missions`.

`npm test`: 50 tests passed, including wrong-match retention, correct-match advancement, ordering validation, and shuffled choice coverage. `npm run typecheck`: passed. `npm run check:bundle`: Android export passed. `git diff --check`: passed. These checks cover existing exercise rules, not native rendering or the new selection styling. Device appearance and accessibility checks remain pending.
