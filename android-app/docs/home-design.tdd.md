# Approved splash and home: validation record

Journeys were derived from the approved home prototype and the Android redesign to-do: start setup, resume learning, continue after mastery, view actual XP, and open existing tools.

RED: `node --test tests/home.test.mjs` failed because the new home summary module was not implemented (`ERR_MODULE_NOT_FOUND`). Checkpoint: `5229fa1`.

GREEN: the same seven tests pass. They cover a new learner, latest valid opened mission, advancement after mastery, earlier unfinished missions after mastering the last mission, full completion, restored answers without opened history, and an empty curriculum.

`npm test`: 50 tests passed. `npm run typecheck`: passed.

`node --test --experimental-test-coverage --test-coverage-include=src/progress/home.ts tests/home.test.mjs`: 100% lines, branches, and functions for the new summary logic. This does not measure native UI coverage.

`npm run check:bundle`: Android export passed. Native device checks remain pending: splash masking and sizing, navigation, TalkBack, large text, small-screen/landscape layouts, and cold-start persistence. No Android SDK/device is available in this workspace. No physical-device or visual-runtime pass is claimed.

Artwork: built-in image-generation edits of the approved logo and home prototype produced transparent logo lockup, header mark, and workshop illustration PNGs under `android-app/assets/`. Other screens retain their existing design.
