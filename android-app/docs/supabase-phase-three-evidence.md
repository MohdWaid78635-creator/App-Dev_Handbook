# Phase 3: ECC Planner and verification evidence

Date: 28 November 2026. Source: [migration plan](supabase-migration.plan.md), steps 5–6.

## ECC Planner checkpoint — Step 5: transactional local persistence

- Requirements: isolated guest/user namespaces; validated one-time legacy copy; stable UUID mappings; durable pending-change intents; record/intent atomicity; preservation on failure/restart.
- Surfaces: new `src/storage/database.ts`, `scope.ts`, `migrate.ts`, SQLite driver and store factories; new real-SQLite migration/storage tests using Node's built-in SQLite engine.
- Order: failing acceptance tests -> minimal schema/transactions and legacy validation -> restart/fault tests -> typecheck/native export.
- Risk: high. The source legacy KV data is never deleted. Migration marker, copied records and recovery snapshot commit together. Guest changes never enter an account's queue without a later explicit import.
- Scope: pending-change intents are durable snapshots, not a network sync engine. The Phase 4 engine will translate them into conditional server mutations and acknowledge only the captured intent ID.

## ECC Planner checkpoint — Step 6: data-provider boundaries

- Requirements: capture the current scope in each store instance; reject stale callbacks after switching accounts; remount provider/form state; keep backups scope-specific.
- Surfaces: scoped store context/boundary, root wiring, progress provider, projects/plans/build/milestones/readiness/study/backup callers.
- Order: scope-lease and store-isolation tests -> prepare gated integration -> regression/typecheck/bundle -> enable cutover only after the existing real-device backup/reopen gate is satisfied.
- Risk: high. Account changes must never redirect an old form's write into the next account. Scope identity and generation are captured, not looked up dynamically inside an old callback.
- Gate: asked the user whether the preview's backup/reopen baseline was checked. Until confirmed, `EXPO_PUBLIC_ENABLE_SCOPED_STORAGE` remains false and legacy storage remains active. Cloud sync/account screens remain later-phase work.

## Validation record

Append actual RED/GREEN evidence and unresolved native gates after execution. No real device records are read by the synthetic test harness.
