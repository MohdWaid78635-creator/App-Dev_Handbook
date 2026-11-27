# Phase 2: ECC Planner and verification evidence

Date: 28 November 2026. Source: [migration plan](supabase-migration.plan.md), steps 3–4. User authorized Phase 2 implementation. No hosted project or user database is connected.

## ECC Planner checkpoint — Step 3: backend foundation

- Requirements: owner-isolated rows, server-side validation, compare-and-set revisions, retry receipts, transactional import/replacement primitives, published-only content reads, generated client types.
- Surfaces: `supabase/config.jsonc`, SQL migrations, role/access and mutation tests, test-only PostgreSQL harness, generated database types. The verified CLI 3.4.0 generates JSONC, superseding the original plan's TOML filename.
- Order: inspect Phase 1 contracts -> executable failing SQL tests -> implement migrations -> validate A/B/anonymous roles and transactions -> generate types from the tested schema.
- Risk: high. Mitigations: no hosted credentials; test databases contain synthetic data only; untrusted clients cannot bypass RPC validation through direct writes; privileged functions use fixed search paths and explicit ownership checks.
- Environment: Docker is unavailable. The pinned CLI was run through `npx supabase@3.4.0 init` to create local configuration; no hosted link or database reset was performed. Test SQL in real embedded PostgreSQL (PGlite) with explicitly documented Supabase `auth.users`/`auth.uid()` scaffolding. This does not test GoTrue, PostgREST, JWT verification, network races, pgTAP, or the complete Supabase stack.

## ECC Planner checkpoint — Step 4: client/session foundation

- Requirements: optional configuration, publishable key only, separate session persistence, foreground token-refresh lifecycle, response invalidation on account/session changes, validated native callback handling.
- Surfaces: `src/cloud/client.ts`, configuration parsing, `src/auth/session-storage.ts`, session controller/provider, environment example, package manifest/lock and root provider wiring only after guest regression checks.
- Order: failing pure configuration/session tests -> implement adapters/controller -> add compatible dependencies -> typecheck and bundle -> keep sign-in/import screens and user-data integration deferred to later approved phases.
- Risk: high. Mitigations: no sign-in/upload occurs without explicit future user action; absent configuration remains guest mode; existing global data stores remain unconnected to authentication until account-scoped storage is available in Phase 3.

## Validation log

| Step / guarantee | RED evidence | GREEN evidence |
|---|---|---|
| Step 3: private records, conditional writes, receipts and atomic batches | `526a5f4`: 10 embedded database tests failed because tables/RPCs were absent | `npm test` in `supabase`: first 13 tests passed after schema implementation |
| Step 3: published-only immutable content | `cd9093e`: 3 tests failed on absent content tables | All 3 content cases passed after migrations |
| Review: old offline work after whole-workspace replacement | `4bf3662`: new regression reproduced an incorrect applied write after replacement (13 pass / 1 fail before adding the epoch field) | `bcdbee2`: 14 database checks passed with required workspace epochs; client DTOs updated before any deployment |
| Step 4: configuration, session isolation, lifecycle, callback parsing | `8302845`: 6 tests failed with explicit not-implemented exports | All 6 passed after implementation |
| Review: startup network hang | `0f7d469`: the new test timed out after 1 second, proving loading could remain unresolved | `baf4ef2`: 7 session/configuration checks passed with a 10-second production bound |
| App regression | Existing 114 tests retained | `npm test` in `android-app`: 121 passed, 0 failed |
| TypeScript | Generated content and new SDK types checked | `npm run typecheck`: passed |
| Database type drift | Introspect the migrated PostgreSQL schema | `node scripts/generate-types.mjs --check`: passed for 10 tables and 3 RPCs |
| Android JavaScript export | Existing app still launches against local data | `npm run check:bundle`: Android export passed (1,263 modules) |

`git diff --check`: passed. All recorded checkpoints are on `codex/supabase-phase-two`; preserve the RED/GREEN table if they are later squashed.

### Separately requested Expo preview

The Android preview submitted before Phase 2 resumed finished successfully on the user-selected `wajid.mohd7866` account: build `eda1d1d1-c089-4879-af01-d606c43106b9`, source checkpoint `7923c03`. [APK](https://expo.dev/artifacts/eas/XcUunWUrXvMXzkhVD5JWvT5i80J3zpv7pxB937HgVF0.apk). This is a native build of the approved local-data app, not a native test of the later Supabase/session foundations. It has not been installed here.

### What was implemented and why

1. Ten database tables and three controlled RPCs. They keep accounts separate, reject invalid payloads, and make writes conditional on the version a device last read.
2. Owner RLS, revoked direct writes, locked-down helper functions and fixed search paths. Public app configuration alone cannot authorize private-data access or bypass validation.
3. Request receipts and atomic import/replacement primitives. A retry cannot duplicate a committed operation, and an invalid later batch item cannot leave earlier writes partially applied.
4. Workspace epochs plus project/review tombstones. Replacing a workspace also invalidates work queued on another offline device, including projects that had never reached the server. This is a predeployment refinement to the Phase 1 DTO, still schema version 1 because no cloud protocol has been deployed.
5. Content drafts/published rows and immutable publication guards. Learners cannot see in-progress edits, and a published release cannot be edited in place. Full course validation/publication stays in Phase 6.
6. A lazy typed Supabase client, separate session adapter, session controller/provider and PKCE callback parser/completion helper. These prepare accounts while avoiding automatic upload or attaching a session to the existing unscoped data stores.

### Boundaries and pending verification

- Backend tests use two synthetic users and actual PostgreSQL behavior in PGlite, with Auth scaffolding. They are ordered integration scenarios, not proof of real JWT verification, PostgREST grants, cross-connection locking, or a hosted Supabase deployment.
- The pgTAP files in `supabase/tests/database` have been written but not executed: a full local Supabase stack needs a container runtime. No hosted project has been selected, created, or modified.
- Database types are generated from the tested embedded schema, not falsely reported as Supabase CLI output. They intentionally expose no typed table writes/relationship joins. Reconcile with CLI-generated types before hosted integration.
- Cloud configuration defaults to disabled, and `AuthProvider` is deliberately unmounted until Phase 3 provides account-scoped local records. The existing root provider, storage, backup format and screens remain unchanged.
- Email confirmation settings and the exact callback allowlist are prepared locally. Signup, email delivery, recovery, PKCE exchange, native storage/foreground behavior and callback routing still need full-stack/device checks and approved account screens.
- SQLite-backed session keys are separate from backup/user-data keys. No claim of encrypted-at-rest sessions is made. Large-session support is tested through the adapter; native persistence/device protection is still a device check.
- Supabase client 2.119.2 and URL polyfill 4.0.0 are pinned. `npm audit` reported three moderate findings on the Expo/fingerprint/minimatch dependency path and suggested changing Expo to an incompatible older major. No forced dependency change was made; reassess this upstream chain before release.
- Phase 2 source/code work is ready locally. Production readiness and full Supabase integration remain gated; cloud saves and account UI are not enabled.

### Coverage

`node --experimental-test-coverage --test-coverage-include=src/cloud/config.ts --test-coverage-include=src/auth/session.ts --test-coverage-include=src/auth/session-storage.ts --test tests/cloud-auth.test.mjs` reported 100% lines, 90% branches and 91.30% functions across the three pure modules. This excludes native wrappers, the SDK, SQL migrations and hosted infrastructure; no SQL/native coverage percentage is claimed.

Full-stack and installed-device results must remain separate from these embedded SQL and pure-controller results. See [database operations](../../supabase/README.md) for repeatable local checks and rollout gates.
