# Existing-app guidance implementation evidence

28 November 2026. Source plan: [existing-app guidance](existing-app-guidance.plan.md). User authorised proceeding without an AI API. This increment implements the assessment and current-library matching; it does not complete the handbook import or resume Supabase storage integration.

## What changed and why

1. **Project assessment and local rules:** each app records its reported position, current goal, data applicability, and six capability checks. Unknown answers lead to verification. Repair, exposure, performance, and cost goals take priority. This lets existing builders pick up their work without repeating the course.
2. **Project and backup compatibility:** optional versioned assessment fields preserve older projects, plans, milestones, learning records, and backups. Scoped-storage tests prove account separation. The prepared cloud contract and a forward SQL migration accept the new field without enabling cloud sync.
3. **Native flow:** Home offers new/existing entry, project cards expose assessment, and a two-step form produces an explained next action. Tool selectors include existing technology icons. Matching resources can be searched and filtered, with an all-resources escape. This makes the guidance accessible without an AI service.
4. **Backend relevance:** SQLite learners use the existing starter/local lab. Unknown or different backends receive general references instead of being sent to Supabase-specific labs. This avoids inappropriate implementation instructions.

## RED and GREEN evidence

| Guarantee | RED evidence | GREEN evidence |
|---|---|---|
| Assessment persistence and recommendation behavior | `node --test tests/assessment.test.mjs`: 8 failed because `saveAssessment` was missing | Targeted assessment/backup/sync run: 23 passed after implementation |
| Backup and sync preserve answers | Targeted assessment backup and mutation tests both failed; missing save method and unexpected payload field | Same tests passed after project and contract changes |
| Database accepts valid assessment and rejects invalid versions | `node --test tests/assessment.test.mjs` in `supabase`: 1 failed, valid payload returned false | Same test passed with forward migration, including RPC write and other-user isolation |
| Local/other backends avoid Supabase-specific labs | New targeted test failed because local-lab routing was absent | Assessment plus scoped-storage target: 20 passed after backend-aware routing |

Checkpoints on `codex/supabase-phase-three`: `f3335e2` RED, `5b2c7db` GREEN, `4c9e830` backend-routing RED, `ae76115` backend-routing GREEN. Existing unrelated guide cache change was excluded.

## Final verification

- App suite: `npm test` — 149 passed, 0 failed, 0 skipped.
- Database suite: `npm test` in `supabase` — 15 passed using embedded PostgreSQL. Covers valid/invalid assessment, RPC persistence, and user isolation as well as existing RLS, receipts, batches, and content checks.
- `npm run typecheck` — passed.
- `npm run check:bundle` — Android export passed, 1,268 modules.
- Assessment coverage: `node --test --experimental-test-coverage --test-coverage-include=src/projects/assessment.ts tests/assessment.test.mjs` — 100% lines, 98.85% branches, 100% functions; 10 targeted tests passed.
- `git diff --check` — passed.
- Interactive browser prototype was previously checked at 390px with navigation, edits, search, and explained matching. Those checks do not substitute for native-device verification.

## Pending and limitations

- No new APK was requested or submitted in this increment. The installed app does not change until a new preview build is installed.
- Real Android layout, large-font flow, TalkBack, and the native interrupted-form journey have not been tested here. Questionnaire edits are saved explicitly by **Find my next move**; unsaved edits do not survive leaving the screen or closing the app.
- No live Supabase migration or auth/sync activation. `202611280004_assessment.sql` is tested locally and must precede future assessment sync.
- Recommendations currently match the existing 7-article/13-mission curated library. Full handbook, rescue routes, and new labs are separate planned increments. General references do not claim full stack-specific coverage.
- App position is reported by the user; recommended next work is rule-derived. This is not automatic source inspection or security/release certification.
