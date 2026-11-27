# Supabase migration evidence

Source plan: [supabase-migration.plan.md](supabase-migration.plan.md). Phase 1 started on 27 November 2026. Scope: contracts, synthetic legacy fixtures, and content identity checks. No storage adapter replacement, account creation, network synchronization, or live data migration is authorized by this phase.

## ECC Planner checkpoint: Step 1 — baseline and fixtures

- Requirement: preserve every current saved-data category, including clears, review dates, and per-project/build isolation.
- Surfaces: existing `src/{progress,projects,study}/store.ts`, `src/projects/readiness.ts`, `src/backup/service.ts`; new `tests/fixtures/legacy-workspace.json`, `tests/fixtures/content-identities.json`, and fixture verification tests.
- Order: record existing checks -> construct synthetic version-1 backup through current factories -> freeze content identity manifest -> verify reopen/restore/export and source immutability.
- Risk: medium. Mitigation: use synthetic in-memory stores only; never read the user's device database or edit the installed app.
- Baseline: `npm test` passed 50/50; `npm run typecheck` passed; `npm run check:bundle` completed an Android export successfully before new contract code was introduced.
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

Results recorded on 28 November 2026. This document does not claim Android UI, cloud, or live-data migration completion.

| Plan step / guarantee | Command or test | Actual result |
|---|---|---|
| Step 1: frozen version-1 backup reopens and round-trips every saved category | `node --test tests/legacy-workspace.test.mjs` | 2 passed; invalid sections rejected before a replacement batch |
| Step 2 RED: acceptance targets execute against unimplemented validator exports | `node --test tests/sync-contracts.test.mjs tests/content-compatibility.test.mjs` | Exit 1; positive acceptance cases throw the explicit not-implemented errors. The earlier missing-module run was only an initial discovery, not the runtime RED proof |
| Step 2 initial GREEN: domain payloads and content compatibility | Same target after implementation | 59 passed, 0 failed |
| Step 2 review RED: wrong-content/action acknowledgements, incomplete import mappings, and changed question scoring kind | Same target with the three new review cases | 62 tests: 59 passed, 3 failed with `Missing expected exception` |
| Step 2 review GREEN: bind acknowledgement content/action, require full import mappings, freeze question kind | Same target after fixes | 62 passed, 0 failed |
| Complete regression | `npm test` | 114 passed, 0 failed: original 50 + 2 fixture tests + 62 contract/content tests |
| Type safety / generated content parity | `npm run typecheck` | Passed; regenerated 13 missions, 16 modules, 55 build cards, 17 readiness groups / 133 checks |
| Android export after Phase 1 | `npm run check:bundle` | Passed; 1,263 modules, Android bundle exported. The new validators are not wired into runtime screens/storage |
| Patch hygiene | `git diff --check` | Passed |

### Contract decisions implemented

- Schema version 1; lowercase canonical UUIDs; integer safe revisions; ISO timestamps in canonical UTC form.
- Four payload kinds: `learning`, `study`, `project`, `readiness`. Existing pure store readers validate their domain data without writes. Cloud project payloads exclude the local numeric ID; readiness payloads carry the global project ID.
- Learning/study use a singleton identity per account. Projects/reviews use UUIDs. Mapping validation requires one-to-one numeric/global identities in exactly the expected `guest:<uuid>` or `user:<uuid>` namespace.
- Applied/conflict/rejected responses are distinct types. Owner, operation, entity, and revision must match the expected boundary; applied responses additionally match the submitted action/content without depending on JSON object-key order.
- Tombstones are limited to project/readiness entities and contain no live payload. Delete intents require a prior revision. This is a DTO rule, not deletion/sync implementation.
- Import receipts match the expected account, dataset, operation, and complete source-project ID set. This validates receipt shape/content; persistent receipts and retry behavior still require the future backend.
- Envelopes reject unexpected or missing fields. JSON byte limits are checked before parsing, including multibyte Unicode. Proposed limits: 256 KiB per mutation/result/receipt/mapping document, 8 MiB workspace/backup budget, 4 MiB content release, and 16,000 characters per content text field. The workspace limit is a shared budget constant, not a complete workspace upload endpoint. Any existing record exceeding an upload budget must remain local/recoverable; batching or revised quotas must be addressed before enabling cloud upload.
- All four content documents validate together. The frozen manifest preserves explicit mission/lesson/practice/question/build/readiness/glossary/article identities, assessed prompts/options/answers/question kinds, and stored proof strings. Removing/reassigning these requires a future explicit migration mechanism; this phase intentionally rejects such changes.
- Reordering explicitly identified records, adding new question identities, and explanatory-copy updates pass compatibility checks. No remote JavaScript execution or content publication is introduced.
- The content-identity fixture was extended with each existing question's current `kind` during the review fix, preserving all original IDs/text/answers. It was not regenerated to accept new lesson changes.

### Coverage

Command from `android-app`:

```powershell
node --experimental-test-coverage --test-coverage-include=src/sync/contracts.ts --test-coverage-include=src/content/schema.ts --test-coverage-include=src/validation/json.ts --test tests/sync-contracts.test.mjs tests/content-compatibility.test.mjs
```

Node reported 100% line coverage, 100% branch coverage and 98.33% function coverage across those three new modules. The read-only adapter's `write` function intentionally throws and is not called by validation. These are Node/V8 runtime coverage results, not native, SQL, integration, or security certification.

### Git checkpoints

- `4af4729`: synthetic legacy and content baselines, source plan and per-step ECC Planner checkpoints.
- `3a17978`: executable runtime RED acceptance cases with unimplemented contract exports.
- `6bfc0c5`: initial GREEN validators and types (59 tests).
- `c567cc4`: three additional review cases reproduce acceptance gaps (3 failed / 62).
- `14e01c2`: reviewed GREEN implementation and scoring-kind manifest extension (62 tests).

All checkpoints are on `codex/supabase-phase-one`. Preserve this RED/GREEN summary if commits are later squashed.

### Remaining gates

- Installed Android backup/export/reopen baseline: not performed; SDK/device unavailable in this environment. Required before Phase 3 replaces an active storage adapter.
- RLS, SQL constraints, Auth, network behavior, session lifecycle, local ID translation/migration, idempotent server receipt persistence, and real sync/conflict/restore flows: not implemented in Phase 1.
- Content checksum verification, cache adoption/publication, identity aliases/retirement migrations, payload pagination, and full workspace quota enforcement: later-phase work. A UUID is a validated identity format, not proof of authorization or a content checksum.
- Newly added modules are not connected to app screens or storage. Existing backups remain version 1; no user data was read, uploaded, or rewritten by these tests.
