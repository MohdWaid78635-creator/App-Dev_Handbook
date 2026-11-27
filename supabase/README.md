# BuildWisp database foundation

This directory contains additive PostgreSQL migrations and local verification for Supabase migration Phase 2. Nothing here has been applied to a hosted project. Do not enable cloud access in the app until account-scoped storage and approved account flows are integrated.

## Run the embedded PostgreSQL checks

From this directory:

```powershell
npm ci
npm test
npm run types:check
```

The harness runs real PostgreSQL SQL/RLS/transactions in PGlite, with test-only `auth.users`, `auth.uid()` and role scaffolding. The scenario suites exercise two synthetic users. These checks do **not** run GoTrue, PostgREST, actual JWT verification, pgTAP, parallel database connections, or native Android code.

`npm run types` generates `android-app/src/cloud/database.types.ts` from the actual embedded schema. Table writes are deliberately typed as unavailable; client writes must go through RPCs. Typed relationship joins are not exposed by this generator. Reconcile the generated types with Supabase CLI output before hosted integration.

## Full Supabase checks still required

The configuration was initialized using Supabase CLI 3.4.0 and uses its generated `config.jsonc` format, rather than the earlier plan's TOML filename. From the repository root, use the pinned CLI with a working Docker-compatible runtime to start the local stack, apply these migrations to a disposable local database, and run `supabase test db` for `tests/database/*.sql`. Follow the CLI's local development instructions; never select a hosted/production target for a reset or fixture test.

The local email provider requires confirmation. Its allowed native redirect is exactly `buildquestacademy://auth-callback`; hosted Auth settings still need matching configuration and delivery verification.

## Data/API contract

- Private tables have owner-only RLS reads and no direct learner writes. The three authenticated RPCs check the current `auth.uid()`, fixed envelope keys, payloads, revisions and byte budgets.
- `apply_sync_mutation(request)` accepts the Phase 1 DTO plus required `workspaceEpoch`. Accepted writes and their request/response receipt commit together. Reusing an operation ID with changed input fails. Stale record revisions return a conflict; old workspace epochs return `stale_workspace`.
- `workspace_snapshot({})` holds a shared workspace lock and returns `schemaVersion`, `workspaceRevision`, `workspaceEpoch`, and owner records. Mutation/batch RPCs take an exclusive lock on the same row.
- `commit_workspace_batch(request)` accepts `schemaVersion`, `ownerId`, `operationId`, `mode` (`import` or `replace`), `expectedWorkspaceRevision`, `mappings` and `mutations`; import also requires `guestDatasetId`. Mappings contain the user namespace, local project ID and cloud project UUID. Every project mutation must have one mapping. Projects apply before reviews. Nested mutations must use fresh operation IDs; a whole-batch retry uses the same outer ID and exact request.
- A successful import returns the Phase 1 import receipt and records the dataset ID to prevent re-import. A second operation for an already imported dataset is rejected rather than silently duplicated.
- Replacement requires the current workspace revision, increments its epoch, tombstones existing projects/reviews, and resets existing learning/study rows. Incoming replacements apply transactionally; any failed mutation rolls the entire batch back. An old offline device must re-download/reconcile the new epoch. The app still needs explicit preview/confirmation and local queue handling in later phases before this RPC is exposed.
- Payloads are bounded to 256 KiB per mutation and 8 MiB per workspace/batch; actual JSONB encoding is measured, so boundary whitespace/metadata overhead must be considered when the sync engine is implemented. Receipts and tombstones are retained for correctness; retention, abuse/rate controls and storage monitoring are hosted-rollout gates.
- Readiness records cannot point at another user's project, a deleted project, or a second review with the same project/build. A review's project/build association cannot change under the same ID.
- Content drafts are private; learners read published releases only. Publishing requires four documents within the release byte budget. Published documents are immutable, and the stable pointer can target only a published release. These are database-level guards; the full curriculum/identity/checksum validation and trusted publication script belong to Phase 6. No real course content has been published here.

## Application boundary

`android-app/.env.example` keeps cloud access disabled. Only a publishable key belongs in public Expo configuration; elevated credentials remain server-side. The lazy client uses PKCE and a separate `buildwisp.auth.*` SQLite namespace for sessions, outside backup keys. This storage is app-private SQLite, **not an encryption-at-rest implementation**; it avoids SecureStore's per-value session-size limits without adding a second persistence dependency.

The session controller handles foreground refresh, cleanup, a 10-second startup bound, and generation checks for obsolete responses. `AuthProvider` and the callback completion helper are prepared and typechecked but intentionally not mounted/routed: current local stores are still guest-only. Do not connect an account to them before Phase 3 isolation is implemented.
