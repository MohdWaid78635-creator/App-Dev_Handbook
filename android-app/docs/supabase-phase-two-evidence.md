# Phase 2: ECC Planner and verification evidence

Date: 28 November 2026. Source: [migration plan](supabase-migration.plan.md), steps 3–4. User authorized Phase 2 implementation. No hosted project or user database is connected.

## ECC Planner checkpoint — Step 3: backend foundation

- Requirements: owner-isolated rows, server-side validation, compare-and-set revisions, retry receipts, transactional import/replacement primitives, published-only content reads, generated client types.
- Surfaces: `supabase/config.toml`, SQL migrations, role/access and mutation tests, test-only PostgreSQL harness, generated database types.
- Order: inspect Phase 1 contracts -> executable failing SQL tests -> implement migrations -> validate A/B/anonymous roles and transactions -> generate types from the tested schema.
- Risk: high. Mitigations: no hosted credentials; test databases contain synthetic data only; untrusted clients cannot bypass RPC validation through direct writes; privileged functions use fixed search paths and explicit ownership checks.
- Environment: neither Docker nor Supabase CLI is installed/available. Test SQL in real embedded PostgreSQL (PGlite) with explicitly documented Supabase `auth.users`/`auth.uid()` test scaffolding. This does not test GoTrue, PostgREST, JWT verification, network races, pgTAP, or the complete Supabase stack.

## ECC Planner checkpoint — Step 4: client/session foundation

- Requirements: optional configuration, publishable key only, separate session persistence, foreground token-refresh lifecycle, response invalidation on account/session changes, validated native callback handling.
- Surfaces: `src/cloud/client.ts`, configuration parsing, `src/auth/session-storage.ts`, session controller/provider, environment example, package manifest/lock and root provider wiring only after guest regression checks.
- Order: failing pure configuration/session tests -> implement adapters/controller -> add compatible dependencies -> typecheck and bundle -> keep sign-in/import screens and user-data integration deferred to later approved phases.
- Risk: high. Mitigations: no sign-in/upload occurs without explicit future user action; absent configuration remains guest mode; existing global data stores remain unconnected to authentication until account-scoped storage is available in Phase 3.

## Validation log

Results will be recorded only after commands complete. Full-stack and installed-device results must be reported separately from embedded SQL and pure-controller tests.
