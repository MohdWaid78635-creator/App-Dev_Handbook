# Build Quest: Stages 6–12 research and validation

Checked on: 2026-11-23. Track: Expo + Supabase, Android first.

## Scope and evidence

- Replaced seven stubs with 29 cards and seven boss fights. Combined with the existing 26 cards, the handbook now has 55 cards and 13 boss fights.
- Preserved existing Stage 0–5 card IDs/content and the per-app storage format. Updated content metadata to 1.1.0.
- Sources below were opened during this task. The source version labels describe documentation reviewed, not versions installed or tested in an example app.
- The handbook is a static vanilla-JavaScript site. No Expo app, Supabase project, Play account, or paid provider was provisioned for this content task.
- Implementation recommendations (retry reconciliation, isolated restore drills, release hold points) are engineering guidance based on the linked capabilities and policies, not vendor guarantees.

## Sequencing and optional modules

- Stage 7 requires an include/skip reason for payments, push, and offline. Each later module card accepts a documented skip with a check that the app makes no unsupported promise.
- Stage 10 submits a candidate to a test track and prepares a held production release. It does not require completion of locked Stage 11 cards.
- Stage 11 prepares monitoring, update recovery, backup restoration, and cost controls; its fifth card is the final production launch gate. Publication requires all evidence plus explicit owner approval.
- Stage 12 covers ongoing upgrades, migrations, rollout handling, and review of changing facts.

## Facts that need future review

| Fact | Checked interpretation | Official source |
|---|---|---|
| Android phone-app submissions | Current requirement is API 36; other device categories and existing-app availability rules differ. Check again before submitting. | https://support.google.com/googleplay/android-developer/answer/11926878 |
| New personal Play accounts | Accounts created after November 13, 2023 need at least 12 testers opted into closed testing continuously for the preceding 14 days when applying for production access. Application/review follows; approval is not automatic. | https://support.google.com/googleplay/android-developer/answer/14151465 |
| Digital purchases | Use the Play billing rules and applicable exceptions/programmes. Native IAP libraries need a development build. | https://support.google.com/googleplay/android-developer/answer/9858738 ; https://docs.expo.dev/guides/in-app-purchases/ |
| First submission | Current Expo docs support first submission via EAS Submit after prerequisites, or a manual upload. No blanket claim that the first upload must be manual. | https://docs.expo.dev/submit/android/ |
| Client environment | EXPO_PUBLIC_ values are included in client output. Supabase secret/service_role credentials must stay server-side. | https://docs.expo.dev/guides/environment-variables/ ; https://supabase.com/docs/guides/getting-started/api-keys |
| Updates | OTA changes must match the binary runtime; native changes require a new build. Rehearse rollback in preview. | https://docs.expo.dev/eas-update/runtime-versions/ ; https://docs.expo.dev/eas-update/rollbacks/ |
| Backups | Database backups exclude Storage object contents. Free projects need off-site exports; paid retention and recovery options depend on the plan. | https://supabase.com/docs/guides/platform/backups |
| Cost control | Spend Cap excludes opted-in items such as compute and PITR, and is not a configurable custom-budget alert system. Other providers need separate controls. | https://supabase.com/docs/guides/platform/cost-control |
| Play staged rollout | Available for app updates, not first publication. Halting stops further distribution without downgrading existing installations. | https://support.google.com/googleplay/android-developer/answer/6346149 |
| Account deletion | In-scope apps need in-app and accessible web deletion request routes; the web route must work without reinstalling the app. | https://support.google.com/googleplay/android-developer/answer/13327111 |

Pricing is intentionally linked rather than promised as a fixed free allowance. Review https://expo.dev/pricing and https://supabase.com/pricing and the selected external providers.

## Card source index

### Stage 6: Core Screens

- **s6-step1 — Map the core journey and navigation:** https://docs.expo.dev/router/basics/navigation/
- **s6-step2 — Load a bounded list and a real detail screen:** https://supabase.com/docs/reference/javascript/select
- **s6-step3 — Create, edit, and delete without losing work:** https://supabase.com/docs/reference/javascript/insert
  - Supporting reference: https://supabase.com/docs/reference/javascript/update
  - Supporting reference: https://supabase.com/docs/reference/javascript/delete
- **s6-step4 — Make the journey usable with TalkBack and large text:** https://reactnative.dev/docs/accessibility

### Stage 7: Optional Modules

- **s7-step1 — Choose modules and the correct payment route:** https://support.google.com/googleplay/android-developer/answer/9858738
- **s7-step2 — Prove a digital purchase and restore in a test track:** https://docs.expo.dev/guides/in-app-purchases/
- **s7-step3 — Send push with permission and safe destinations:** https://docs.expo.dev/push-notifications/push-notifications-setup/
- **s7-step4 — Choose a safe offline strategy:** https://docs.expo.dev/versions/latest/sdk/sqlite/

### Stage 8: Testing

- **s8-step1 — Add focused unit and component checks:** https://docs.expo.dev/develop/unit-testing/
- **s8-step2 — Check route and session transitions:** https://docs.expo.dev/router/reference/testing/
- **s8-step3 — Run a real Android journey with Maestro:** https://docs.expo.dev/eas/workflows/examples/e2e-tests
- **s8-step4 — Exercise failure cases on the release candidate:** https://reactnative.dev/docs/testing-overview

### Stage 9: Security

- **s9-step1 — Check the shipped bundle and repository for secrets:** https://docs.expo.dev/guides/environment-variables/
  - Supporting reference: https://supabase.com/docs/guides/getting-started/api-keys
- **s9-step2 — Authorize every privileged server action:** https://supabase.com/docs/guides/functions/auth
- **s9-step3 — Repeat the access audit on the release backend:** https://supabase.com/docs/guides/security/production-checklist
- **s9-step4 — Prove account deletion in the app and on the web:** https://support.google.com/googleplay/android-developer/answer/13327111

### Stage 10: Build & Release

- **s10-step1 — Build a signed production Android bundle:** https://docs.expo.dev/build/setup/
  - Supporting reference: https://docs.expo.dev/build-reference/app-versions/
  - Supporting reference: https://support.google.com/googleplay/android-developer/answer/11926878
- **s10-step2 — Complete store content and accurate data declarations:** https://support.google.com/googleplay/android-developer/answer/10787469
  - Supporting reference: https://support.google.com/googleplay/android-developer/answer/9859152
- **s10-step3 — Run the closed test that applies to your account:** https://support.google.com/googleplay/android-developer/answer/14151465
- **s10-step4 — Submit to testing and hold the production release:** https://docs.expo.dev/submit/android/
  - Supporting reference: https://docs.expo.dev/submit/android-manual/

### Stage 11: Run Live

- **s11-step1 — Receive a readable crash report:** https://docs.expo.dev/guides/using-sentry/
- **s11-step2 — Rehearse a compatible update and rollback:** https://docs.expo.dev/eas-update/introduction/
  - Supporting reference: https://docs.expo.dev/eas-update/runtime-versions/
  - Supporting reference: https://docs.expo.dev/eas-update/rollbacks/
  - Supporting reference: https://docs.expo.dev/eas/environment-variables/usage/
- **s11-step3 — Restore database and files in an isolated rehearsal:** https://supabase.com/docs/guides/platform/backups
- **s11-step4 — Set cost controls and an incident owner:** https://supabase.com/docs/guides/platform/cost-control
- **s11-step5 — Complete the launch gate and verify publication:** https://docs.expo.dev/submit/android-manual/

### Stage 12: Keep Healthy

- **s12-step1 — Upgrade one SDK at a time on a branch:** https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/
- **s12-step2 — Ship migrations that older apps can still use:** https://supabase.com/docs/guides/deployment/database-migrations
- **s12-step3 — Roll out updates gradually and watch the results:** https://support.google.com/googleplay/android-developer/answer/6346149
- **s12-step4 — Review changing facts and repeat the recovery drill:** https://supabase.com/docs/guides/deployment/going-into-prod

## Validation evidence

Acceptance journey: a builder can open every populated stage, read actionable cards with proof/recovery/source metadata, follow module skip decisions, and complete the final stage without a nonexistent Stage 13 instruction.

- Baseline: `node guide/check-game.mjs` passed with 26 cards, but skipped stubs.
- RED: after strengthening validation and before inserting content, the same command exited 1 for Stages 6–12: unfinished stubs, missing descriptions/bosses, and no cards.
- GREEN: after insertion and release-sequencing review, the same command exited 0: 16 levels cover 166 sections, 12 bonus quests, and 55 playbook steps validated.
- `node --check guide/playbook-data.js` and `node --check guide/playbook.js` exited 0.
- `git diff --check` passed.
- Browser: loaded the local guide in an isolated browser context. Verified 4 cards each for Stages 6–10 and 12, and 5 for Stage 11; every stage rendered its source links and boss card.
- Browser: clicked the correct answer for each new boss and verified the saved result. A fresh app remained locked at Stage 6, confirming progress isolation in this check.
- Browser: exercised Stage 6 Start → Stuck → proof completion, verified saved proof values, and verified app-name substitution in the prompt.
- Browser: inspected 390×844 mobile (document width 390; no horizontal overflow) and 1440×1000 desktop, with dark and light appearances.
- Changed boss helper wording to clear the boss rather than promise an unlock; this also removes the final-stage reference to nonexistent Stage 13.

## Limits and remaining work

- No physical-device Expo build, actual payment, notification delivery, cloud workflow, deletion service, OTA deployment, backup restore, or production publication was executed.
- Clipboard copy buttons rendered; clipboard writing was not verified.
- Service-worker install/offline caching was not retested because the browser check used a local file URL; the existing offline asset-list validator passed and no assets were added.
- Existing Stage 0–5 technical facts were outside this research pass and were not re-audited.
- No new test runner, dependency, commit, push, or deployment was introduced. Existing unrelated worktree changes were preserved.
- Coverage percentages are not reported: this was content plus schema validation and browser smoke testing, not an executable Expo-app implementation.
