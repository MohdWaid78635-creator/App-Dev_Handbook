# Supabase migration evidence

Source plan: [supabase-migration.plan.md](supabase-migration.plan.md). Phase 1 started on 27 November 2026. Scope: contracts, synthetic legacy fixtures, and content identity checks. No storage adapter replacement, account creation, network synchronization, or live data migration is authorized by this phase.

## ECC Planner checkpoint: Step 1 — baseline and fixtures

- Requirement: preserve every current saved-data category, including clears, review dates, and per-project/build isolation.
- Surfaces: existing `src/{progress,projects,study}/store.ts`, `src/projects/readiness.ts`, `src/backup/service.ts`; new `tests/fixtures/legacy-workspace.json`, `tests/fixtures/content-identities.json`, and fixture verification tests.
- Order: record existing checks -> construct synthetic version-1 backup through current factories -> freeze content identity manifest -> verify reopen/restore/export and source immutability.
- Risk: medium. Mitigation: use synthetic in-memory stores only; never read the user's device database or edit the installed app.
- Baseline: `npm test` passed 50/50; `npm run typecheck` passed. Android export result will be recorded after completion.
- Device gate: `adb` was not available on PATH and `%LOCALAPPDATA%/Android/Sdk/platform-tools/adb.exe` was absent. No installed-device backup/reopen check was performed. This remains a mandatory gate before Phase 3 storage cutover.

## ECC Planner checkpoint: Step 2 — data and content contracts

- Requirement: explicit ownership, globally unique identity, version/revision boundaries, safe tombstones, import receipts, and content compatibility before backend implementation.
- Surfaces: new `src/sync/contracts.ts`, `src/content/schema.ts`, `src/validation/json.ts`, and focused contract/content tests. Reuse existing domain readers to validate stored payloads.
- Order: define test journeys and executable negative cases -> confirm intended RED -> implement pure validators/types -> rerun identical targets -> typecheck, coverage, full regression and Android export.
- Risk: high. Mitigation: no runtime integration yet; reject malformed/unsupported input, duplicate identities, changed assessment/proof identities, and wrong owner/scope at the boundary. Client validators do not substitute for future RLS/server authorization.
- Scope boundary: this phase defines and validates DTOs, not a sync engine or publication service. Receipt persistence, cryptographic checksum verification, database constraints, SQL tests and real-device migration remain later-phase work.

## User journeys and acceptance proofs

1. An existing learner's backup reopens with the same project plans/proof/notes, checkpoint/quiz/review history, daily first answers, flashcard due dates, and project/build reviews.
2. Two devices can both have local project 1 without sharing cloud identity; a mapping is unique within its namespace and never inferred from a name.
3. A later sync boundary rejects wrong-owner data, bad revisions, unsupported versions, evidence-free statuses, malformed tombstones, and oversized payloads before accepting a result.
4. A content editor can reorder explicitly identified records and change explanatory copy, but cannot silently reassign quiz answers, checklist IDs, glossary identities, or saved proof strings.
5. An unsupported/malformed release is rejected; the current release is never mutated by validation.

## Validation record

Implementation outcomes and RED/GREEN checkpoints will be appended after the commands are run. This document does not claim Android UI, cloud, or migration completion.
