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

## Approved Knowledge Check implementation

The question and boss stages now use the approved clay surfaces, question progress markers, labeled correct/retry selections, explanation feedback, and explicit advancement actions. Stage markers reflect the current attempt, so replay does not show old answers as already complete. Existing resume, answer saving, one-time XP, retry, and results navigation logic are preserved. Save failures suppress the saved-answer footer and retain the existing retry path. Header Help opens the current mission's resources, and invalid-route recovery opens `/missions`.

`npm test`: all 50 tests passed, including saved answer persistence, replay preservation, first-success XP, and mastery requirements. `npm run typecheck`: passed. `npm run check:bundle`: Android export passed. `git diff --check`: passed. Native layout, selection styling, stage display, TalkBack, large-text, and landscape checks remain pending; these are not verified by the unit tests.

## Approved Mission Results implementation

Results now uses the approved trophy, mint mission-XP pill, completion rows, overall mastery progress, next-mission card, Review link, and eligible milestone action. The trophy is conditional on mastery; unfinished checks retain their Continue action and pending statuses. The final mission retains a primary map-return action, now linked to `/missions`. The existing result calculation and adjacent mission selection are retained, with no new XP writes. Header Help opens mission-specific resources.

The built-in image-generation tool isolated the approved violet trophy and mint star onto a transparent background; the production asset is `android-app/assets/clay-trophy.png`.

`npm test`: 50 tests passed, including partial mastery and one-time XP. `npm run typecheck`: passed. `npm run check:bundle`: Android export passed. `git diff --check`: passed. Trophy PNG transparency verified. Native results rendering, route interactions, TalkBack, and large-text/landscape checks remain pending.

## Approved Lesson Detail implementation

Lesson Detail now uses the approved clay disclosures, mint expandable examples, AI-check disclosures, and explain-back panels. The full generated lesson and build-card content is retained. Reading does not award mastery or XP; the existing opened-mission save remains intact. Header Missions and Help open the map and mission-scoped resources. Practice and Knowledge Check actions are docked outside the reading scroll area for taller portrait screens, and flow after the content in short windows or above 1.5× text scaling.

`npm test`: all 50 tests passed, including curriculum lessons, examples, reflection prompts, glossary terms, and corresponding build tasks. `npm run typecheck`: passed. `npm run check:bundle`: Android export passed. `git diff --check`: passed. Native accordion state announcements, dock/fallback layout, large text, landscape, and route interactions remain pending.

## Approved Review room implementation

Review now uses the approved clay question card, actual queue count, neutral choices, mint/amber feedback, and study entry below the current question. Global Review uses shared navigation; mission-scoped Review retains its scope and Results return route. The caught-up and invalid-mission states have separate recovery behavior. Existing `getReviewQueue` and `recordReviewSuccess` logic are retained, including the successful-save guard before advancing and the non-animated scroll reset. There are no changes to review scheduling or XP calculation.

`npm test`: all 50 tests passed, including immediate misses, 24-hour review scheduling, restart persistence, preserved first-success XP, and first success through Review. `npm run typecheck`: passed. `npm run check:bundle`: Android export passed. `git diff --check`: passed. Native rendering, queue advancement interactions, TalkBack, large text, and landscape checks remain pending.

## Approved Daily Practice and Flashcards implementation

Both modes now use the approved clay tabs and shared Practice room header. Daily Practice renders the actual streak, question, correct/saved-answer labels, explanation, completion state, and related lesson action. Flashcards render the real due and recalled counts, recall progress, stacked card face, reveal state, and grading choices. Existing daily selection, first-answer persistence, date refresh, midnight guard, card scheduling, and save-failure handling are retained. No XP writes or scoring changes were introduced. All content remains from the existing curriculum/glossary.

`npm test`: all 50 tests passed, including daily first-answer retention, date changes, streak boundaries, flashcard persistence, deferral order, and failed-write preservation. `npm run typecheck`: passed. `npm run check:bundle`: Android export passed. `git diff --check`: passed. Native rendering, mode switching, reveal and grading controls, TalkBack, large text, and landscape checks remain pending.

## Approved Start Here implementation · 26 November 2026

Start Here now uses clay checkpoint disclosures, actual checked-count progress, mint expected-result panels, selectable first-edit commands, and separate evidence checkboxes. The initial expansion follows the first unchecked step; all steps can be reopened. Existing checkpoint persistence and capstone-guide error handling remain intact. The first mission is always available through a docked action that flows after the content in short windows or above 1.5× font scaling. No mastery or XP is awarded by checking setup evidence.

`npm test`: all 50 tests passed, including checkpoint persistence, unchecking, and failed-save preservation. `npm run typecheck`: passed. `npm run check:bundle`: Android export passed. `git diff --check`: passed. Native disclosure/checkbox interactions, guide launch, dock/fallback layout, TalkBack, large text, and landscape checks remain pending.

## Approved projects and editor · 26 November 2026

The project list/editor now uses the approved clay layout, expandable project tools, visible Edit, local-save notices, shared list navigation, and the original three-field form. Existing validation, field limits, duplicate-save guard, save-error draft retention, and mission/milestone parameters are retained. The editor handles focused Android Back and keyboard avoidance. Saved platform details refresh on returning to the list.

The user additionally requested icons in both project tools and Plan Mode technology dropdowns. Tools use bundled outline icons. Saved platforms and Plan choices use bundled brand glyphs where available and descriptive category icons elsewhere; labels stay visible and decorative icons are hidden from accessibility. No downloaded logos, new packages, stored project fields, planning choices, or recommendation rules were added. Plan Mode's full redesign remains pending its prototype.

`npm test`: all 50 tests passed, including separate projects, edits retaining IDs, invalid-field rejection, failed-save preservation, plans, and project evidence. `npm run typecheck`: passed. `npm run check:bundle`: Android export passed, including the final contextual return links. `git diff --check`: passed. Native menus, icons, keyboard handling, Back navigation, contextual tool links, TalkBack, large text, and landscape checks remain pending.

## Approved Plan Mode redesign · 27 November 2026

Plan Mode now uses the approved four-stage indicator, clay fields, labeled icon dropdowns, explicit radio selections, recommendations, and official-details actions. All fields in the security and review stages remain available. Existing recommendation, conflict checking, draft storage, foundation-prompt generation, clipboard handling, and failure messages are preserved. Next changes stage without a save claim. Actions and their status messages are docked outside the scroll area on taller screens, and inline on short windows or above 1.5× text scaling. The platform/computer fields share a row only when width and text size permit. Expo choices now combine language and React glyphs.

`npm test`: all 50 tests passed, including recommendation rules, incompatible-choice detection, foundation prompts, and project-scoped draft persistence. `npm run typecheck`: passed. `npm run check:bundle`: Android export passed. `git diff --check`: passed. Native rendering, dropdown interactions, keyboard/dock layout, navigation, source launch, copy, TalkBack, large text, and landscape checks remain pending.

## Approved Build Workspace · 27 November 2026

The workspace now uses the approved clay mission dropdown, actual proof totals, card status badges, and independent instruction/proof/recovery disclosures. All original guidance, source metadata, optional skip reasons, and Resume controls remain available. The open card's Copy/Preview actions are docked on taller screens and inline on short windows or above 1.5× text scaling. Preview scrolls to the card; clipboard fallback exposes selectable text. Clipboard responses for a different active card are ignored. Existing project proof storage, optional-card validation, save guards, and project-name prompt substitution are retained.

`npm test`: all 50 tests passed, including proof persistence, per-project isolation, optional-only skipping, reason validation, Resume retaining proof, unchecking, and failed-save preservation. `npm run typecheck`: passed. `npm run check:bundle`: Android export passed. `git diff --check`: passed. Native disclosure/checkbox behavior, prompt selection/copy/fallback, active-card switching, scroll positioning, keyboard/dock layout, TalkBack, large text, and landscape checks remain pending. The unit suite verifies data rules, not the new native interactions.
