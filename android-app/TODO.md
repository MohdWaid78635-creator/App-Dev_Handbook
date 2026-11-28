# BuildWisp to-do

## Current session · 28 November 2026

**ON HOLD at the user's request.** Handbook import is complete; finish the Git push and stop. Resume from [the root handoff](../RESUME_HERE.md).

- [x] Import all 191 handbook sections, 125 prompts, and 85 glossary terms; preserve tables, definitions, and source identities.
- [x] Connect chapter browsing, full search, and relevant handbook chapters for assessed projects.
- [x] Verify 156 app tests, type checking, and Android export; [import evidence](docs/handbook-import.tdd.md).

Latest priority: existing-app assessment and relevant resources. Implemented Home entry, project-specific questionnaire/results, tool-aware matching, backups, scoped-storage compatibility, and a forward SQL validator migration. No AI API. [Plan](docs/existing-app-guidance.plan.md) · [Evidence](docs/existing-app-guidance.tdd.md).

- [x] Existing-app assessment and matching from the current curated library; 149 app tests and 15 database tests pass.
- [ ] Verify new native screens on Android, including TalkBack, large text, and interrupted forms.
- [x] Import the complete structured handbook using [the content expansion plan](docs/content-expansion-research.plan.md).
- [ ] Port the separate guided rescue flows and bonus quests; extend practical labs and editable worksheets after resuming.
- [ ] Submit a new APK when a preview build is requested; this increment has not been built through EAS.

Previous priority: correct the installed APK layouts before continuing Phase 3. The shared Router/Slot style-loss bug is fixed across all 59 linked controls; [regression evidence](docs/linked-layout-fix.tdd.md). The user is reviewing the corrected preview. Phase 3's storage core has 11 passing SQLite tests including assessment isolation, but provider/screen integration and the phone backup gate remain unfinished. Storage and cloud cutover remain disabled.

Native Android appearance, navigation, file picker/sharing, restore confirmation, TalkBack, large text, and landscape checks remain pending. Validation details are recorded in `docs/home-design.tdd.md`.

## Supabase migration · Phase 2 foundations verified locally

Working agreement: use ECC Planner at every step. At the end of each phase, explain simply what changed, why it was necessary, what passed, and what still needs checking.

- [x] Inspect the current local stores, content pipeline, project identities, and backup format.
- [x] Write the ECC Planner implementation plan, dependencies, risks, tests, and rollback strategy.
- [x] Phase 1: freeze synthetic legacy backups and content identities; verify round-trip and invalid-input behavior.
- [x] Phase 1: implement/test versioned sync contracts, ownership/identity/revision checks, import receipts, and content compatibility.
- [x] Phase 2: implement owner-isolated tables, conditional writes, transactional batches, retry receipts, workspace epochs, and content publication guards.
- [x] Phase 2: prepare the disabled-by-default typed client, separate session storage, bounded session lifecycle, and PKCE callback foundation.
- [x] Verify 121 app tests, 14 embedded PostgreSQL checks, generated types, TypeScript, and Android bundling.
- [ ] Run full local Supabase/pgTAP, real JWT/API and parallel-connection checks (Docker runtime unavailable).
- [ ] Integrate the prepared AuthProvider only after account-scoped stores and approved account flows exist.
- [ ] Capture installed Android backup/export/reopen baseline before Phase 3 storage cutover (SDK/device unavailable here).
- [ ] Confirm the proposed account/content-management defaults and development project setup before dependent integration work.
- [ ] Implement verified local migration, accounts, cloud sync, and cloud-aware restore in the plan's dependency order.
- [ ] Prototype and approve new account, import, conflict, and sync screens before implementing them.
- [ ] Add validated remote content releases with a local cache and bundled fallback.
- [ ] Complete two-device Android, isolation, offline, recovery, and accessibility verification before rollout.

## 25 November 2026 · Approved design session

- [x] Approve the colour card: violet, mint, lilac, porcelain, and plum ink.
- [x] Approve the clay B and mint wisp logo.
- [x] Approve the powder lilac splash prototype.
- [x] Approve the returning-learner home prototype.
- [x] Implement splash configuration and the home screen, including saved progress and new, returning, mastered, and completed learner states.
- [ ] Check installed Android cold start, TalkBack, larger text, small-screen and landscape layouts, and every navigation action.
- [x] Prototype and approve the Mission Map.
- [x] Implement the Mission Map journey layout with real mastery, XP, a current mission, and shared navigation.
- [x] Prototype and approve Practice.
- [x] Implement the Practice clay layout for matching and ordering, with retry and completion feedback.
- [x] Prototype and approve Knowledge Check.
- [x] Implement Knowledge Check with stage progress, selected-answer feedback, retries, and saved-answer handling.
- [x] Prototype and approve Mission Results.
- [x] Implement Mission Results with the clay trophy, saved XP, completion rows, next mission, and milestone actions.
- [x] Prototype and approve Lesson Detail.
- [x] Implement Lesson Detail with clay disclosures, expandable examples, full lesson/build content, and accessible Practice actions.
- [x] Prototype and approve Review room.
- [x] Implement Review room with the clay question card, saved queue, answer feedback, study entry, and shared navigation.
- [x] Prototype and approve Daily Practice and Flashcards.
- [x] Implement both study modes with clay tabs, daily feedback, revealed cards, saved counts, and recall actions.
- [x] Prototype and approve Start Here / setup checkpoints.
- [x] Implement Start Here with expandable checkpoints, expected results, saved checkmarks, and the first-mission action.
- [x] Prototype and approve Your Projects and the project editor.
- [x] Implement the clay project list/editor, expandable tool menus, project-platform icons, and technology icons in Plan Mode choices.
- [x] Prototype and approve Plan Mode.
- [x] Implement Plan Mode’s four-stage clay form, technology dropdowns, and draft/navigation actions.
- [x] Prototype and approve Build Workspace.
- [x] Implement Build Workspace with the mission selector, proof progress, disclosures, and active-card prompt actions.
- [x] Prototype and approve Project Milestones.
- [x] Implement Project Milestones with evidence states, saved counts, note editing, and guarded summary preview/export.
- [x] Prototype and approve Production Readiness overview and check editor.
- [x] Implement Production Readiness with build selection, saved status counts, evidence validation, and unsaved-edit feedback.
- [x] Prototype and approve Help and Resource Library.
- [x] Implement the clay library with search, labeled category icons, expandable resources, and contextual help.
- [x] Prototype and approve Backup and Restore.
- [x] Implement the clay export/preview states, actual backup counts, replacement warning, and guarded restore action.

The approved Mission Map is at `/missions`; the agreed prototype and implementation sequence is complete. Device validation remains open.

## 26 November 2026 · Redesign the Android app

- [ ] Redesign the home screen first. Make **Continue learning**, the next mission, and project progress easy to find. Show how it looks for a new learner, a returning learner, and someone who just mastered a mission.
- [ ] Use the home prototype to establish the visual style for the whole app. Review navigation, typography, spacing, cards, progress indicators, and original workshop artwork before applying them to other screens.
- [ ] Carry the approved design through the app one screen at a time. Start with the Mission Map, Practice, Knowledge Check, and Results. Then update Lessons, Review and Flashcards, the project and build tools, Production Readiness, Help, and Backup and Restore.
- [ ] Add motion alongside each redesigned screen. Show progress when a mission is mastered, reveal answer feedback in Practice, celebrate the first boss clear, reveal flashcard meanings, and confirm successful saves in the build tools. Use short effects and honor Android’s reduced-motion setting.
- [ ] Compare the current home screen with the redesigned prototype before changing the rest of the app. Verify that navigation, saved progress, and XP still work, and check the new design on Android with TalkBack, larger text, and reduced motion.
