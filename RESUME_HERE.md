# Project on hold — resume here

**Status: ON HOLD at the user's request, 28 November 2026.** Finish the handbook import and Git push, then stop. Resume only when the user asks; no reminder, background build, deployment, or automatic continuation is scheduled.

## Where we stopped

- Branch: `codex/supabase-phase-three`.
- Existing-app guidance is implemented: new/existing entry, a per-project capability check, explained next action, and relevant resources. No AI API is needed. Answers are saved explicitly, separately from course progress.
- The complete structured handbook from `guide/data.js` is now imported: **191 sections across 23 numbered chapters plus Print Pack, 125 handbook prompts, and 85 glossary terms**. Eight block types are represented, including all table cells, checklists, definitions, examples, and preformatted text. Tables use labelled rows in the current reader.
- Library now has **540 searchable entries**: 214 learn entries, 91 glossary entries, 55 troubleshooting hints, and 180 prompts. These totals include course resources; 85 is the source handbook glossary count. The **13 guided missions remain 13**; full reference material is in Help / Resource Library.
- Chapter browsing, full-text search, glossary search, copyable prompt entries, and project recommendations use the expanded handbook. **Browse all resources** is always available.
- Source handbook import checkpoint: `6f05008`. Final branch HEAD also contains this handoff and its verification notes. Repository: `https://github.com/MohdWaid78635-creator/App-Dev_Handbook`.

## First work when the user returns

1. Read this note, `android-app/TODO.md`, and `android-app/docs/handbook-import.tdd.md`; inspect Git status before editing. Use ECC Planner for the next step, as the user requested.
2. Prepare a fresh Expo Android preview **if the user asks to resume build/device verification**. The latest assessment and handbook changes are not in the previously installed APK. Use Expo account **`wajid.mohd7866`**, project **`buildwisp`**, project ID `595f872b-1494-479e-a0bd-f5cd62c7ebd1`. Existing package is `com.buildquestacademy.preview`; preserve it for updates.
3. Check actual Android layout against the approved clay design. Test Home → existing app → saved assessment → tailored resources; switch projects; browse chapters; search prompts/glossary; read a long table and Print Pack; test offline, large fonts, TalkBack, Back navigation, and backup/export/restore. Form edits are not saved until **Find my next move**.
4. Then agree which paused workstream to resume. **Supabase migration Phase 3** still needs native SQLite adapter/provider integration and safe store/screen cutover. Complete the real-phone backup/reopen gate before enabling scoped storage or cloud saves.

## What remains

- New APK and real-phone checks; this import work only ran a local Android export.
- Full rich reader styling and editable worksheet tools. The eight Print Pack sheets are imported as readable templates, not saved interactive forms.
- The separate 11 guided rescue flows and 12 web bonus quests. Handbook rescue chapter content is imported; the web flow/bonus interfaces have not been ported.
- More worked capstone checkpoints and deeper labs. Reuse `guide/mobile/capstone`; do not rebuild the existing starter/local retry lab.
- Review dated technical instructions and official links before treating the entire handbook as current. The import proves source coverage, not independent verification of every claim or PDF page.
- Remaining Supabase phases, account switching, conflict handling, and reviewed content publishing. No live Supabase migration or cloud activation was performed in these last increments. The new `supabase/migrations/202611280004_assessment.sql` must be applied before syncing project assessments.

## Verification and important files

- App suite: **156 tests passed**; type checking and Android export passed. Importer formatter coverage: **100% lines, branches, functions**. Existing database suite: 15 passed at the assessment checkpoint; no SQL changed during handbook import.
- Importer: `android-app/scripts/import-curriculum.mjs` and `android-app/scripts/handbook.mjs`.
- Generated JSON under `android-app/src/generated/` is intentionally ignored by Git. Sources and importer are committed. `npm test`, `npm run typecheck`, local startup, and EAS post-install regenerate it.
- Assessment plan/evidence: `android-app/docs/existing-app-guidance.plan.md`, `android-app/docs/existing-app-guidance.tdd.md`.
- Content roadmap: `android-app/docs/content-expansion-research.plan.md`.
- Supabase roadmap/evidence: `android-app/docs/supabase-migration.plan.md`, `android-app/docs/supabase-phase-three-evidence.md`.
- Preview assets/prototype: `android-app/prototypes/existing-app/`. The old local review canvas has been ended.
- Existing unrelated modification `guide/.impeccable/hook.cache.json` was intentionally left uncommitted. Do not include it in task commits or reset it without checking ownership.

## Working preferences to preserve

Screen-by-screen prototypes and approval for redesigns; lilac background with mint and violet clay styling. Do not return to an all-white background. Explain each phase simply: what changed, why, checks passed, and what remains. Preserve all saved project and learning progress; questionnaires must never auto-award XP or certify an app as secure/release-ready.
