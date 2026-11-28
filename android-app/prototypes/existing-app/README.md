# Existing-app guidance prototype

Open `index.html` directly in a browser or review through the local plan canvas. This self-contained preview has no dependencies, account requirement, network requests, or saved user data.

Reviewed 28 November 2026. Scope: entry choice, app context, capability check, explained recommendations, resource preview, editing, and Back navigation. Uses existing approved lilac/mint/violet clay direction. Capability answers begin as unsure; no completed work is fabricated.

Verification performed:

- 11 Node assert checks of the embedded recommendation function: new app, local-only release, uncertain private-data applicability, unknown stage, repair/security/cost priority, missing runnable build, and unknown/other-stack fallback.
- Browser flow: entry to assessment to result; resource reading and return; search; editing preserves the selected app position; returning to entry.
- Browser flow after navigation correction: result to library to reader to library to Back returns to the result.
- Mobile emulation at 390px, screenshot visually inspected; no horizontal overflow on recommendation screen. Primary actions use at least 48px targets; focus rings and reduced-motion styling included.

Limits: sample resources only; not the full handbook reader. Ranking is illustrative, self-reported, and not an audit. The installed Expo app, stored projects, learning progress, backups, and Supabase have not changed. Real Android/TalkBack and persistence tests belong to production implementation after screen approval.

The user subsequently instructed proceeding with the no-AI implementation. Native work and remaining device checks are recorded in `../../docs/existing-app-guidance.tdd.md`; this HTML remains a design reference. Detailed sequence is in `../../docs/existing-app-guidance.plan.md`.
