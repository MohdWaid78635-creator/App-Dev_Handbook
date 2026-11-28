# Implementation Plan: Complete Learning and Resource Coverage

## Overview
Research completed 28 November 2026 against the repository's current structured handbook, web learning tools, native app importer, screens, content contracts, and previous curriculum audits. The mobile app contains a curated beginner journey, not the complete reference library. Restore the missing reference material first, then add the worked examples needed to turn instructions into an independently usable course.

This began as a research and proposed implementation plan. The subsequent existing-app guidance increment is implemented and documented in `existing-app-guidance.tdd.md`; full curriculum expansion below remains pending. Supabase migration Phase 3 remains paused; the content phases below are a separate sequence.

## Requirements & Scope

### Verified inventory

| Source or app surface | Verified scope | Meaning |
|---|---|---|
| Handbook, `guide/data.js` | 23 numbered chapters plus Print Pack; 191 sections; 1,513 content blocks | Source for a complete library |
| Source block types | 644 paragraphs, 87 preformatted blocks, 186 checklist blocks, 125 prompts, 434 labels, 25 headings, 11 tables, 1 definition list | All eight types need an explicit rendering strategy |
| Source checklist items | 847 strings | Includes worksheet headings and labels; not 847 independently actionable checks |
| Current article import | 7 selected sections, containing 6 prompt blocks | Does not count separate build-card prompts |
| Current guided journey | 13 missions, 55 build steps, 39 quiz slots | Preserve as the beginner path |
| Current lessons | 16 distinct lesson modules, 65 distinct-module concept cards, 27 distinct practice IDs | A lesson is reused in two missions; displayed card occurrences total 69 |
| Current readiness and study | 17 groups, 133 checks, 85 glossary terms | Already present; extend rather than duplicate |
| Web support resources | 11 help topics, 12 bonus quests, 17 fact metadata entries, 8 Print Pack sheets | Not equivalent to native library coverage |

Evidence: `android-app/scripts/import-curriculum.mjs`, `android-app/src/library/search.ts`, `android-app/src/generated/*.json`, `guide/data.js`, `guide/game-data.js`, `guide/learn-data.js`, and `guide/search-index.js`.

The 184 sections outside the article allowlist are missing as full native articles. Their subjects may still appear briefly in lessons, build instructions, glossary entries, or readiness checks. A source URL opening a website does not count as offline native coverage.

### What to add and why

1. **Complete handbook reader:** all 191 sections, chapter browsing, linked related topics, tables, examples, definitions, and checklists. Provides the depth absent from short missions.
2. **Complete prompt collection:** all 125 handbook prompt blocks, plus existing build and bonus prompts, with copy actions, topic filters, and source labels. Avoids leaving most practical AI instructions outside the app. Keep distinct prompt identities even where wording overlaps.
3. **Guided troubleshooting:** restore all 11 problem routes, grouped into stop damage, investigate, fix, and prevent. Includes crashes, bad releases, leaked keys, unexpected bills, payment errors, AI mistakes, slowness, and Play rejection guidance. Existing native troubleshooting is mostly build-step hints.
4. **Practical worksheets:** all 8 Print Pack sheets: app brief, decisions, threats, security, speed, edge cases, launch, and weekly operations. Also assess the web cost table and project-folder checklist. Readable templates come first; saved editable answers and exports require separate storage work.
5. **Bonus learning:** restore 12 side quests covering research, pricing, scaling, store discovery, analytics, onboarding, naming, store listing, launch, and support. Label optional tasks and allow a reasoned not-applicable outcome.
6. **Beginner foundations and one continuous example app:** extend the existing `guide/mobile/capstone` Habit Check-in starter and local persistence/retry lab, already linked from native Start Here. Audit and add the missing file tour, foundations, sign-in, private cloud data, release, and restore checkpoints. Do not recreate the starter or describe existing checkpoints as absent.
7. **Deeper practical labs:** authentication failures, two-user access tests, safe retries and offline recovery, payments and notifications when relevant, performance on budget phones, accessibility, privacy, migrations, backups, monitoring, and maintenance. Existing topic summaries are insufficient evidence that learners can perform these tasks.
8. **Better study and discovery:** broader question coverage with explanations, scenario exercises, related lessons, chapter and topic search, a full glossary in library search, and later bookmarks and reading position. Daily practice currently draws only from non-boss mission questions; do not confuse 39 quiz slots with a broad independent question bank.
9. **Dated source checks:** official links and last-reviewed dates for changing requirements, costs, compatibility, and service limits. Old audit claims must be rechecked rather than imported as established facts.
10. **An existing-app path and personalised resources:** ask what the user's app can do today, what is unverified, which tools it uses, and what they want next. Recommend work from the capability gaps and goal rather than assuming everyone starts at Mission 1. See `existing-app-guidance.plan.md` for the assessment, recommendation rules, and prototype-first implementation sequence. This is a first-class entry path, not an advanced filter hidden in Help.

### Scope boundaries

- Keep the 13 mission identities and existing progress intact. Additional reference sections do not need to become compulsory levels.
- Extend the existing project plan, milestones, readiness, flashcards, and backup features. Do not build duplicate versions.
- First deliver an Expo/React Native and Supabase example path. Kotlin and Flutter comparisons may be reference supplements; complete separate runnable courses are later scope.
- A full PDF line-by-line concordance, every external link, every legal jurisdiction, and every technical claim were not independently revalidated in this audit. Structured repository content is the coverage baseline. Do not label the whole handbook technically verified.
- No arbitrary target number of new levels or quiz questions; scope follows topic gaps and review quality.

## Architecture & Surface Changes

- `android-app/scripts/import-curriculum.mjs`: replace seven-section selection with complete structured import; preserve chapter, section, block, and source identities.
- `android-app/src/content/schema.ts`: version the content model for typed article blocks and added resource families. Current article body strings cannot represent tables and structured worksheets faithfully.
- `android-app/src/library/search.ts` and `android-app/app/help.tsx`: index all supported resources and expose chapter/topic browsing. Add a dedicated section reader as required instead of expanding hundreds of articles inside one list.
- `android-app/src/projects/store.ts`, `android-app/src/projects/plan.ts`, and backup/sync contracts: only extend when persistent worksheet answers, bookmarks, or reading state are implemented. Migrate old records and keep exported backups readable.
- `android-app/src/study/store.ts` and `android-app/app/study.tsx`: support reviewed question-bank expansion without changing existing question identities or invalidating study history.
- `supabase/migrations/202611280003_content.sql` and publishing code: assess forward migrations for additional document families and reader compatibility. Never edit an applied migration to retrofit new behavior.
- Existing migration content publishing phase: integrate this expanded model before its first content release, retain bundled offline content, and keep the last valid release after failed updates.

## Implementation Steps

### Phase P: Project Entry and Relevant Resources
1. **Add new-app and existing-app entry paths** (File: `android-app/docs/existing-app-guidance.plan.md`)
   - Action: Review the linked assessment and interactive prototype, then implement per-project assessment and deterministic recommendations after screen approval. Tag reference resources as the library expands.
   - Why: Existing builders need the right next action rather than a mandatory restart.
   - Dependencies: None for the prototype; persisted assessment depends on compatible project storage and backup contracts.
   - Risk: Medium.

### Phase A: Source Coverage and Corrections
1. **Create a coverage manifest** (File: `android-app/scripts/import-curriculum.mjs`)
   - Action: Enumerate every section, block type, prompt, glossary entry, help route, bonus quest, and worksheet; report imported, adapted, deferred, and excluded items with reasons.
   - Why: Prevent silent omissions and replace misleading resource counts with traceable coverage.
   - Dependencies: None.
   - Risk: Low.
2. **Review changing instructions** (Files: `guide/data.js`, `guide/game-data.js`, `guide/playbook-data.js`, `research/BEGINNER_CURRICULUM_AUDIT.md`)
   - Action: Recheck release order, API credentials, project restoration, billing controls, and update compatibility against official sources. Retain correction provenance.
   - Why: More content is useful only when instructions are sound.
   - Dependencies: Coverage manifest.
   - Risk: Medium.

### Phase B: Complete Offline Reference Library
1. **Extend content contracts and importer** (Files: `android-app/src/content/schema.ts`, `android-app/scripts/import-curriculum.mjs`)
   - Action: Import all 191 sections with all supported block types; add resource metadata and validate references and sizes. Keep shipped identities stable.
   - Why: Plain text extraction loses tables and worksheet structure.
   - Dependencies: Phase A.
   - Risk: Medium.
2. **Prototype, approve, then build the library and reader** (Files: `android-app/app/help.tsx`, `android-app/src/library/search.ts`; new reader route determined during design)
   - Action: Present chapter browsing, article reading, prompt collection, and full topic/glossary search screen by screen for approval. Implement with offline access and links from relevant missions.
   - Why: Content must be easy to find and comfortable to read on a phone.
   - Dependencies: Typed content model.
   - Risk: Medium.

### Phase C: Practical Support and Worksheets
1. **Restore support resources** (Files: `guide/game-data.js`, `android-app/src/library/search.ts`, `android-app/app/help.tsx`)
   - Action: Import 11 guided help topics and 12 bonus quests; link the 8 readable worksheets and cost/folder tools to relevant projects.
   - Why: Helps users apply and recover from what they learn.
   - Dependencies: Phase B.
   - Risk: Medium.
2. **Add persistent worksheet tools after storage readiness** (Files: `android-app/src/projects/store.ts`, `android-app/src/backup/`, `android-app/src/sync/`)
   - Action: Define answer identities, backup format, validation, and account boundaries before adding saved forms and exports. Prototype each new screen for approval.
   - Why: Prevents new project work from being lost or crossing accounts.
   - Dependencies: Scoped storage integration from the migration plan; readable worksheet templates do not depend on cloud sync.
   - Risk: High.

### Phase D: Complete Beginner Learning and Practice
1. **Build the continuous example and labs** (Files: `guide/learn-data.js`, `guide/playbook-data.js`; new starter/example directory defined with its pinned stack)
   - Action: Author prerequisites, starter/finished checkpoints, expected output, recovery hints, and independent exercises. Verify every checkpoint on Android.
   - Why: Converts broad instructions into a reproducible learning experience.
   - Dependencies: Reviewed instructions from Phase A; can be authored alongside Phase B.
   - Risk: High.
2. **Expand and review assessment coverage** (Files: `android-app/scripts/import-curriculum.mjs`, `android-app/src/study/store.ts`, `android-app/app/study.tsx`)
   - Action: Map questions to concepts, identify omitted source questions, add scenarios and delayed review, and distinguish passing a quiz from completing a real app proof.
   - Why: Measures understanding and ability rather than memorising a small repeated pool.
   - Dependencies: Final lesson content and stable IDs.
   - Risk: Medium.

### Phase E: Content Delivery and Acceptance
1. **Publish compatible content releases** (Files: `android-app/src/content/schema.ts`, `supabase/`, migration plan content-publishing phase)
   - Action: Validate complete releases, reader versions, checksums, source dates, fallback behavior, and content limits before publishing. Recompute sizes after expansion; current handbook structured JSON alone is about 283 KB, which is not a final app or release-size estimate.
   - Why: Enables reviewed content updates while keeping the app usable offline.
   - Dependencies: Validated library model and existing cloud foundation; separate from account sync activation.
   - Risk: High.

## Testing & Verification Strategy

- Automated coverage checks: every source section accounted for, all eight block types handled, no missing help references, all prompts reachable, unique stable identities, and accurate displayed counts.
- Data checks: old progress, projects, study history, and backup fixtures remain valid; content-only updates do not reset course progress.
- Reader checks: render representative tables, long prompts, preformatted examples, glossary definitions, and checklists; verify search matches actual content, including full glossary entries.
- Manual Android proofs: browse all chapters; read and copy while offline; test large fonts, TalkBack, long content, Back navigation, links, and any worksheet file sharing.
- Curriculum acceptance: reproduce the continuous example from clean setup, then ask 3–5 beginners to follow it and record where help is needed. Do not claim beginner readiness from automated tests alone.
- Rollback: retain the previous valid content bundle and ship reversible app changes; do not remove or renumber existing learning identities.
- This research-only change needs document and inventory review; application tests were not rerun because no executable code changed.

## Risks & Mitigations

- **Outdated audit recommendations:** `MISSING.md` still says 20 testers and treats some now-present topics as absent. Treat it as leads to investigate, not an authoritative import specification.
- **Quantity mistaken for completeness:** 191 sections include introductions and templates, while 125 prompts may overlap with build prompts. Publish separate counts for source coverage, learning units, and unique activities.
- **Too much mandatory learning:** preserve the short path and add deeper references and optional labs alongside it.
- **Storage scope creep:** readable resources can ship locally before new editable project fields or cloud publishing. Gate saved tools on migration support.
- **Prototype mismatch:** continue the user's prototype-first, approval-then-implementation workflow for new or redesigned screens.

## Success Criteria

- [ ] All 191 source sections are reachable and render correctly offline, with reviewed corrections identified.
- [ ] All 125 handbook prompt blocks are accounted for, alongside separately identified build and bonus prompts.
- [ ] All 11 help topics, 12 bonus quests, and 8 worksheets have an explicit native destination or documented adaptation.
- [ ] Existing 13-mission progress and backups survive expansion.
- [ ] Learners can complete and independently modify the example app with observable evidence.
- [ ] Reviewed content sources, dates, and remaining limitations are visible and accurate.

## Primary Sources Checked

- [Google Play testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465): applicable newer personal accounts require at least 12 continuously opted-in testers for 14 days; the older 20-tester audit recommendation is stale.
- [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys) and [securing the Data API](https://supabase.com/docs/guides/api/securing-your-api): distinguish mobile publishable configuration from privileged secrets; enforce appropriate data permissions.
- [Expo update runtime versions](https://docs.expo.dev/eas-update/runtime-versions/): native changes require compatible runtimes; do not promise that every change can ship as an over-the-air update.
- [React Quick Start](https://react.dev/learn): foundation topics include components, markup, data display, conditions, lists, events, and state.
- [React Native accessibility](https://reactnative.dev/docs/accessibility): include practical screen-reader behavior in examples and checks.
- [Supabase backup documentation](https://supabase.com/docs/guides/platform/backups) and [cost controls](https://supabase.com/docs/guides/platform/cost-control): use as the review baseline for backup scope and billing lessons; recheck plan-specific details when authoring labs.
