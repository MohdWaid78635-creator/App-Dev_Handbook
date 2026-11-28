# Implementation Plan: Existing-App Assessment and Personalised Resources

## Overview
Add two visible entry paths: start a new app, or continue an existing app. Existing builders describe their app, its working capabilities, and their immediate goal; the app explains a suggested starting area and shows relevant resources. This work precedes expanding the library so restored content is discoverable by need.

Status, 28 November 2026: user instructed proceeding with implementation after reviewing the no-AI approach. Native entry, assessment, per-project persistence, and current-library matching implemented. Automated app/database checks pass; native phone visual/accessibility checks and full library expansion remain pending. Related plan: `content-expansion-research.plan.md`; Supabase migration Phase 3 remains a separate paused workstream.

## Requirements & Scope

- Entry points on Home and project creation; existing saved projects can add or revise an assessment from project details.
- Reuse project name, goal, target platform, language/framework, data provider, sign-in provider, and constraints from `PlanDraft`; confirm rather than re-enter or overwrite them.
- Ask intent: learn basics, finish a feature, fix a problem, prepare a release, improve a live app, or assess an unfamiliar app. Ask one immediate problem/goal and relevant optional features.
- Ask current capabilities separately: runnable build, core journey, persistence, account sessions, access control, failure/device tests, release preparation, distribution, and live monitoring/recovery.
- Answers: works and checked, needs work, unsure, or not needed where appropriate. Do not assume a later milestone proves earlier capabilities. An app on Play can still have unknown data protection or no tested restore process.
- Distinguish broad lifecycle position (prototype, building, preparing release, live) from suggested next work (for example, check private data access). Derive a tentative stage only from answers and show why; allow correction.
- Recommendations combine goal, gaps, platform, stack, and optional feature applicability. A live app with a current crash needs troubleshooting first; a planned release with unknown access isolation needs that verification before release work.
- Show next action, explanation, recommended lesson, reference sections, applicable checklist, and copyable prompt. Keep all chapters searchable and never lock other missions.
- Self-reported assessment is not a code scan, security audit, course completion, earned XP, readiness approval, or proof that production is safe. No repository access is implied.
- Assessment belongs to one project. Learning progress belongs to the existing learning model; changing an assessment must not clear or fabricate it.
- Support local/offline use, no-account use, edits, unknown answers, and old projects with no assessment. New projects receive the normal beginner path until assessed.
- Explicit non-goals: automatic repository scanning, forced stack migration, AI chat or paid API calls, credentials collection, a complete Flutter/iOS/web course in the first release.

### Recommendation behavior

| Situation | Next action | Relevant resources |
|---|---|---|
| Idea, no runnable build | Run one screen | Existing Start Here and capstone, workshop setup, basic architecture |
| Screens exist, main action incomplete | Finish core journey | Forms, list/detail/edit, empty/loading/error states, acceptance checks |
| App works locally, persistence missing or unclear | Check saving and recovery | Data model, reopen test, safe retry, selected storage guidance |
| Accounts/private cloud records, access isolation unknown | Verify user data access | Auth sessions, grants and policies, two-user isolation checks |
| Device-only app, accounts not needed | Skip account-specific recommendations | Local persistence, device backup, platform tests |
| Feature complete, preparing launch | Test the candidate, then release preparation | Failure tests, TalkBack, privacy, store requirements, signing |
| Already live, crash or broken update | Follow repair route first | Relevant rescue guide; recovery, diagnosis, fix verification |
| Already live, cost spike | Investigate usage and abuse | Cost controls, rate limits, monitoring, relevant billing references |
| Already live, improving performance | Measure before changing | Performance profiling, low-end device tests, before/after worksheet |
| Unfamiliar or inherited app | Establish what exists | Inventory, backups, build reproduction, threat/access review, unknowns |
| Unsupported or unknown stack | Show general guidance, explain coverage limit | Platform-neutral planning/testing plus official links; no Expo-specific commands presented as universally applicable |

Ordering: immediate incident/repair goal first; applicable foundational gaps next; stated feature or release goal next; optional deeper learning last. Within a category, use explicit stable priority and ID ordering. Unknowns become verification actions, not failed or completed stages. A user can continue browsing after seeing a warning about an unverified prerequisite.

### Prototype journey

1. Where are you starting? New app / existing app.
2. What do you have? Working screens / working core journey / test build / live app / not sure, with a separately selected goal and stack.
3. What have you checked? Short capability questions with explicit unsure and not-needed choices.
4. Your next move: suggested focus, reasons, a verification task, matching references, and an option to revise answers or browse everything.

The interactive HTML prototype illustrates these choices and local ranking. It uses a deliberately limited resource preview; it does not contain the full 191-section import or persist answers.

## Architecture & Surface Changes

- `android-app/src/projects/assessment.ts` (new): versioned assessment types, validation, applicability rules, and pure recommendation function returning IDs and explanations.
- `android-app/src/projects/store.ts`: optional per-project assessment; extend validation and limits without breaking legacy projects. Reuse `PlanDraft` fields rather than copy conflicting tool choices.
- `android-app/src/library/search.ts`: extend resource metadata with topics, lifecycle areas, supported platform/stack, and links to lessons/checklists. Keep broad search usable independent of assessment.
- `android-app/src/content/schema.ts`: versioned resource metadata and cross-reference validation as part of the complete library expansion.
- `android-app/app/index.tsx`, `android-app/app/project.tsx`, `android-app/app/getting-started.tsx`: visible entry and return paths, retaining current beginner workshop and progress.
- `android-app/app/assessment/[id].tsx` (new, after approval): short assessment tied to an existing project, showing resumable choices and result.
- `android-app/app/help.tsx`: suggested-for-project resources, reason labels, and an obvious all-resources switch.
- `android-app/src/backup/`, `android-app/src/sync/`, `android-app/src/storage/`: inspect actual validators, fixtures, scoped store serialization, and export limits before persisting new fields. No live cloud dependency for recommendations.

## Implementation Steps

### Phase 1: Rules and Prototype
1. **Review capability and goal mapping** (File: `android-app/docs/existing-app-guidance.plan.md`)
   - Action: Confirm cases in the table and preserve self-report uncertainty. Reconcile new goals with the 13 mission IDs and full source sections.
   - Why: Avoid incorrectly equating a live app with a verified app.
   - Dependencies: Existing curriculum and content coverage audit.
   - Risk: Low.
2. **Prototype the entry, assessment, and recommendation** (File: `android-app/prototypes/existing-app/index.html`)
   - Action: Present the approved lilac, mint, violet clay direction; allow new/existing paths, changing answers, goal-specific results, and returning to the full resource preview.
   - Why: User can approve concrete behavior and screens before production redesign.
   - Dependencies: Step 1.
   - Risk: Low; review artifact only.

### Phase 2: Assessment Data and Recommendation Logic
1. **Write behavioral tests, then implement** (Files: `android-app/tests/assessment.test.mjs`, `android-app/src/projects/assessment.ts`)
   - Action: Prove unknown vs failed, local-only exclusions, live-app repair priority, unsupported-stack fallback, deterministic results, and no learning-progress mutation.
   - Why: Recommendations influence consequential work and need predictable reasoning.
   - Dependencies: Approved prototype and rules.
   - Risk: Medium.
2. **Add safe project persistence** (Files: `android-app/src/projects/store.ts`, project/backup/storage test fixtures)
   - Action: Add optional versioned assessment with validation and backward-compatible load/export/restore; refuse unknown invalid versions without erasing saved work. Test independent projects and storage scopes.
   - Why: User needs different recommendations for different apps, without losing existing work.
   - Dependencies: Assessment types and existing storage model review.
   - Risk: High.

### Phase 3: Native Screens and Relevant Library
1. **Implement approved assessment and entry points** (Files: `android-app/app/assessment/[id].tsx`, Home, Project, Start Here)
   - Action: Connect assessment to selected project; preserve answers on Back; make completion and edit actions explicit; show suggested stage and separate next focus.
   - Why: Makes the existing-app path visible and easy to correct.
   - Dependencies: Phase 2 and screen approval.
   - Risk: Medium.
2. **Connect resource recommendations** (Files: `android-app/src/library/search.ts`, `android-app/app/help.tsx`, content importer/schema)
   - Action: Add reviewed metadata to existing and newly imported resources, display reasons, handle empty matches, and provide all-resource browsing.
   - Why: Resource relevance must continue working as the library grows.
   - Dependencies: Phase 2; complete library content phases provide additional destinations.
   - Risk: Medium.

### Phase 4: Device Verification and Content Integration
1. **Verify complete journeys** (Files: assessment/library/project tests and the evidence document)
   - Action: Check fresh install, old project, multiple projects, offline reopening, large fonts, TalkBack, interrupted form, backup/restore, and unsupported tools. Test native behavior on a real phone before declaring visual/device verification complete.
   - Why: Prevents another gap between an approved prototype and the installed app.
   - Dependencies: Phase 3.
   - Risk: Medium.
2. **Continue full library expansion** (File: `android-app/docs/content-expansion-research.plan.md`)
   - Action: Apply coverage manifest and resource tags to all sections and support resources; connect cloud content publishing only after contracts are compatible.
   - Why: Relevant recommendations and complete content must grow together.
   - Dependencies: Approved metadata model; cloud delivery follows its separate migration gates.
   - Risk: Medium.

## Testing & Verification Strategy

- Prototype checks: both entry paths; each lifecycle choice; repair vs release vs feature goals; unsure and not-needed responses; editing and Back navigation; long text and 360px width.
- Production tests: rules and unsupported-stack handling; deterministic ranking; no assessment-to-XP auto-completion; backward-compatible project/backup decoding; project isolation and stale scope callbacks.
- Content checks: every recommended resource ID exists, supported stacks are explicit, no missing topic mappings, fallback is useful when matching content is absent.
- Native checks: screen layout compared with approved prototype, keyboard/focus order, TalkBack, large fonts, offline result access, and saved project restoration.
- Rollback: optional assessment fields and separate recommendation output; preserve old projects and the normal library. No learning progress rewriting.

## Risks & Mitigations

- **False confidence:** show 'Based on your answers' and 'Verify next'; never label an app secure or release-ready from a questionnaire.
- **Overly long onboarding:** ask app position and goal first; reveal applicable checks; allow unsure and revise later.
- **Forced prerequisites:** prioritize essential verification but keep the full library and missions open.
- **Wrong stack instructions:** respect saved tool selections; label general guidance and missing platform coverage.
- **Duplicate or stale state:** save one assessment per project; reuse current plan selections; invalidate suggestions when inputs change.
- **Confusing migration phases:** use the named assessment phases here, separate from Supabase Phase 3.

## Success Criteria

- [x] Existing-app entry wired from Home and project cards.
- [x] Result shows a self-reported lifecycle position and a separate suggested action, with reasons.
- [x] A live app with unknown security checks receives verification guidance rather than automatic completion.
- [x] Local-only checks and backend-aware lab selection avoid irrelevant Supabase recommendations.
- [x] Project goals and tools drive matching from the current library; general-reference fallback is explicit.
- [x] All resources remain browseable; assessment does not modify learning progress.
- [x] Legacy projects, project-scoped storage, and backup round trips pass automated checks.
- [ ] Real Android layout, TalkBack, interrupted-form behavior, and navigation verified against the prototype.
- [ ] Complete handbook and support-resource coverage added through the separate content expansion phases.
