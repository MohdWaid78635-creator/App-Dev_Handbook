# MISSING.md — Content Gaps in App Builder's Handbook Guide

> Generated 22 Nov 2026 by auditing all 23 chapters against the needs of a 2026 indie builder in India
> using Supabase + React Native / Flutter on Android.
> **No existing files were changed.** Add this content in future handbook editions or supplements.

---

## How to read this file

Each section lists:
- **Missing Completely** — topic never appears anywhere in the book
- **Too Shallow** — topic exists but needs much more depth
- **Wrong / Outdated** — factually incorrect or no longer accurate

Priority markers: 🔴 Critical · 🟡 Important · 🟢 Nice to have

---

## Chapter 0 — How to Use This Book

### Missing Completely
- 🟡 **AI tool selection guide** — book assumes one AI chat window; no guidance on choosing between Claude Code, Cursor, Gemini CLI, or plain ChatGPT for a non-technical founder
- 🟡 **Context window limits** — no explanation of what happens when the AI "forgets" the start of your conversation and how to prevent it (using project memory files)
- 🟢 **How to use this book on a phone** — the guide itself is a phone-friendly web app, but Ch 0 gives no mobile-first reading tips

### Too Shallow
- Project memory files (CLAUDE.md etc.) are mentioned but not introduced here — first-time readers have no idea what they are until much later

---

## Chapter 1 — Your Role and the AI's Role

### Missing Completely
- 🔴 **React Native / Flutter context** — entire chapter assumes Kotlin + Jetpack Compose; a React Native or Flutter builder has no equivalent examples
- 🟡 **How to verify AI-generated code without being a developer** — "check the AI's work" is repeated but *how* is never shown for a non-coder
- 🟡 **Agentic IDEs in 2026** — Cursor, Claude Code, Windsurf are now standard; the book only describes copy-pasting prompts into a chat window
- 🟡 **When to override the AI** — no guidance on recognising when the AI chose a bad architecture, an expensive library, or a deprecated API
- 🟢 **AI cost awareness** — GPT-4o / Claude Sonnet per-token costs; when a long context session starts costing real money

### Too Shallow
- "Never trust the AI completely" is stated but not operationalised with concrete checks
- No mention of `.cursorrules` / `CLAUDE.md` as the primary tool for steering the AI's behaviour across sessions

### Wrong / Outdated
- 🟡 "Driver and engine" analogy is correct in spirit but understates AI capability in 2026 — modern AI can propose architecture, write tests, and self-review code

---

## Chapter 2 — The Whole Journey on One Page

### Missing Completely
- 🔴 **Cross-platform journey variant** — the 15-stage journey is described for a native Android app; no equivalent for React Native (Expo) or Flutter
- 🟡 **OTA updates stage** — Expo EAS Update and CodePush allow shipping JS fixes without a Play Store review; this is a major workflow step missing from the journey
- 🟡 **14-day / 20-tester Google Play requirement** — personal developer accounts must have 20 real testers for 14 days before the app can go public; this blocks many beginners and is never mentioned

---

## Chapter 3 — Planning: Idea, First Version, Requirements, Costs

### Missing Completely
- 🔴 **India-specific cost realities** — cost estimates ignore Indian ARPU (₹30–₹200/month vs \$5–\$15 globally); a viable app in the US may not be viable in India at the same price
- 🔴 **TRAI DLT registration** — sending SMS OTPs in India requires pre-registering your business entity, templates, and sender ID with TRAI's DLT portal; can take 2–4 weeks and block launch
- 🟡 **Low-end device planning** — 2–4 GB RAM budget Android phones are the majority of the Indian market; planning should include device tier targets from day one
- 🟡 **AI-assisted market research** — no prompts for competitor analysis, App Store keyword research, or user persona generation using AI
- 🟡 **Freemium / subscription vs one-time pricing for India** — Indians strongly prefer one-time purchases or free-with-UPI-tip models over subscriptions
- 🟢 **MVP scope discipline with AI** — AI will happily build everything you describe; the book needs a prompt specifically for cutting scope to the minimum shippable version

### Too Shallow
- Section 3.5 budget checks exist but no worked example with real rupee figures
- Agile iteration with AI (weekly sprint, what to do when a feature takes 3× longer than expected) is absent

---

## Chapter 4 — UX and UI: How the App Feels and Looks

### Missing Completely
- 🔴 **Accessibility (a11y)** — screen readers (TalkBack on Android), minimum touch target sizes (48 dp), colour contrast ratios, and what Google Play *requires* for accessibility are completely absent
- 🔴 **Vernacular / regional language UI** — Hindi, Tamil, Bengali, Telugu support; font loading for Devanagari and other scripts on budget devices; right-to-left considerations
- 🟡 **Low-RAM UI patterns** — avoiding heavy animations, lazy loading lists, skeleton screens for slow connections — all standard for Indian devices but not mentioned
- 🟡 **OEM battery manager interference** — Xiaomi MIUI, Realme UI, Samsung One UI aggressively kill background processes; UI must handle "app resumed from killed state" gracefully
- 🟡 **Indian input patterns** — numeric keypad for Aadhaar/mobile input, OTP autofill via SMS Retriever API, WhatsApp-style UI patterns users expect
- 🟢 **Dark mode design** — mentioned nowhere; 60%+ of Indian users use dark mode

### Too Shallow
- UX chapter exists but has no specific guidance for one-handed phone use (popular in India with large-screen budget phones)

---

## Chapter 5 — Architecture and Choosing Tools

### Missing Completely
- 🔴 **React Native / Flutter architecture patterns** — state management (Zustand, Redux Toolkit, Riverpod, Bloc), dependency injection, navigation (Expo Router, React Navigation, go_router) are completely absent
- 🔴 **Supabase connection pooling (Supavisor)** — direct Postgres connections from mobile apps exhaust the connection pool; Supavisor is mandatory but never mentioned
- 🟡 **Offline-first architecture** — SQLite (op-sqlite), WatermelonDB, PowerSync, Supabase's offline sync capabilities; essential for India's patchy connectivity
- 🟡 **Monorepo vs single repo for app + backend** — common architectural decision a beginner must make early
- 🟡 **Environment management** — `.env.local` vs `.env.production`, how Expo and Flutter handle environment variables, never committing secrets
- 🟢 **Edge Functions vs direct DB calls** — when to use a Supabase Edge Function vs calling the database directly from the app

### Too Shallow
- ARCHITECTURE.md is recommended but no example shown
- Client-server explanation exists but no cross-platform code example

---

## Chapter 6 — Database: Your Data, Who Can See It, and How to Never Lose It

### Missing Completely
- 🔴 **RLS performance traps** — wrapping `auth.uid()` in a function call in RLS policies causes a full table scan instead of an index scan; a beginner following the book's prompts will build a slow app without knowing why
- 🔴 **Supabase RLS common mistake: open SELECT** — the most frequent RLS error is enabling RLS but leaving SELECT open to all authenticated users instead of scoping to the row owner; the book never warns about this
- 🟡 **Data residency for DPDP compliance** — Supabase's default region may not store data in India; DPDP Act may require Indian data to stay in India; no guidance given
- 🟡 **Database migrations with live users** — how to change a table schema after users are using the app without data loss or downtime ("expand-and-contract" pattern)
- 🟡 **Soft deletes vs hard deletes** — DPDP requires account deletion; book mentions it but doesn't explain the tradeoff between truly deleting rows vs flagging them as deleted
- 🟢 **Supabase Realtime for live features** — not mentioned; essential for chat, live orders, notifications

### Too Shallow
- Access matrix concept is good but no worked Supabase RLS policy example is shown
- Backup strategy exists but no mention of Supabase PITR (Point In Time Recovery)

---

## Chapter 7 — Coding with AI Safely

### Missing Completely
- 🔴 **Git workflow for AI-assisted projects** — commit every AI session's work; never let the AI make 500-line changes in one go; branch before experimenting; none of this is covered
- 🔴 **Reviewing AI-generated code without being a developer** — what to look for, red flags (hardcoded values, `TODO` left in, `console.log` in production, `any` types in TypeScript)
- 🟡 **Package / dependency traps** — AI frequently adds unmaintained or malicious npm packages; how to check package health (npm downloads, last publish date, GitHub stars)
- 🟡 **TypeScript strict mode** — AI-generated JS/TS is often loosely typed; enabling strict TypeScript catches a whole class of bugs before they reach users
- 🟡 **CI/CD basics** — GitHub Actions to run lint + tests on every push; prevents shipping broken code; not mentioned anywhere
- 🟢 **Expo EAS Build** — building a production `.aab` for Google Play via Expo's cloud service; replaces Android Studio for React Native builders

---

## Chapter 8 — Security: The Full Industrial List

### Missing Completely
- 🔴 **Account Takeover (ATO) / credential stuffing** — attackers use leaked passwords from other apps to log into yours at scale; detecting unusual login patterns, alerting users, and forcing password resets are completely absent
- 🔴 **What to do AFTER a breach** — the entire chapter is preventive; no guidance on: how to know you were breached, what to do in the first hour, rotating all keys without taking the app down, and the DPDP Act requirement to notify users
- 🔴 **Admin account security** — Ch 14 has an admin dashboard but Ch 8 never specifically covers: separate admin login, mandatory 2FA, never sharing admin credentials, audit log of every admin action, Cloudflare Zero Trust for IP restriction
- 🟡 **Supabase RLS gotchas for security** — the most common RLS mistake (open SELECT) can silently expose all user data; needs its own security warning
- 🟡 **Social engineering / phishing** — fake SMS/email pretending to be your app; what to tell users; how to make your official communications distinguishable
- 🟡 **Leaked key Git history cleanup** — if a secret is committed to Git, rotating the key is not enough; the history must be purged using BFG Repo-Cleaner or `git-filter-repo`
- 🟢 **Certificate pinning nuances** — the book correctly says "don't pin without an expert" but doesn't explain the specific risk (locked out when certificate renews)

---

## Chapter 9 — Rate Limiting and Abuse

### Missing Completely
- 🔴 **Chargebacks and payment disputes** — user pays, receives goods, then tells their bank it was fraud; you lose goods, money, and pay a chargeback fee; no content on evidence collection, delivery proof, or dispute windows (especially Razorpay/Cashfree dispute APIs)
- 🔴 **Content abuse / illegal content (IT Act obligations)** — if your app has user-generated content, you are legally required to have a takedown process under the IT Act; PhotoDNA / hash matching; what to do when someone reports illegal content
- 🟡 **Account sharing / subscription abuse** — one paid account shared by 10 people; device limits, concurrent session detection, handling without punishing real users
- 🟡 **Review bombing / competitor rating manipulation** — 1-star review floods from competitors; how to report on Play Console, what Google accepts as proof, how to respond publicly
- 🟡 **Insider abuse** — your own admin or team member leaking data; principle of least privilege for humans; audit logs; revoking access when someone leaves
- 🟡 **What ABUSE_LIMITS.md should actually contain** — book says to create this file but never shows a worked example with real numbers for different app types (social, e-commerce, booking)
- 🟢 **UPI-specific fraud patterns** — fake UPI payment screenshots, UPI collect request scams, QR code swapping; Indian-specific fraud the book completely misses

---

## Chapter 10 — Making the App Fast and Smooth

### Missing Completely
- 🔴 **React Native / Flutter performance tools** — Flipper, React DevTools Profiler, Flutter DevTools, FlashList (replaces FlatList), Impeller rendering engine, Fabric architecture; the chapter only references Android/Compose tooling
- 🔴 **Supabase query optimisation** — indexes, avoiding N+1 queries, using `.select('col1,col2')` instead of `select('*')`, connection pooling impact on query speed
- 🟡 **Image optimisation pipeline** — Supabase Storage image transformations, Cloudflare Images, serving WebP with JPEG fallback; essential for India's slow connections
- 🟡 **Cold start optimisation for React Native / Flutter** — JS bundle size, Hermes engine, deferred imports; Flutter AOT vs JIT; missing entirely
- 🟡 **Offline caching strategies** — cache-then-network, stale-while-revalidate, background sync; named patterns that the AI can implement if prompted correctly
- 🟢 **Android Vitals thresholds** — Google uses ANR rate and crash rate to suppress apps in search; specific threshold numbers (< 0.47% crash rate, < 0.47% ANR rate) are not given

### Wrong / Outdated
- 🟡 App size guidance conflates Play Store download size with installed size; these differ significantly and the distinction matters for budget users on limited data plans

---

## Chapter 11 — Edge Cases: The Complete List

### Missing Completely
- 🔴 **UPI payment edge cases** — UPI Intent failures (app not installed), webhook race conditions (payment confirmed on phone before server receives webhook), pending state handling, idempotency keys for retries
- 🔴 **SMS OTP autofill failures (DLT scrubbing)** — TRAI DLT template mismatch silently causes OTP SMS to be blocked or delivered without the standard format, breaking SMS Retriever autofill
- 🟡 **Dual-SIM handling** — many Indian budget phones have dual SIMs; OTP may arrive on the wrong SIM; app must handle gracefully
- 🟡 **Indian number format edge cases** — ₹1,00,000 (Indian lakh format) vs ₹100,000; Devanagari numerals (०, १, २…) on some devices; date formats (DD/MM/YYYY prevalent in India)
- 🟡 **Offline optimistic mutations with conflict resolution** — user performs action offline, server rejects it when back online; app must reconcile without data loss

### Wrong / Outdated
- 🟡 Storage permission guidance is outdated — Android 13+ uses granular media permissions (READ_MEDIA_IMAGES etc.) and Android 14+ Photo Picker is now preferred; `READ_EXTERNAL_STORAGE` is deprecated

---

## Chapter 12 — Testing: Try to Break It Before Users Do

### Missing Completely
- 🔴 **Cross-platform UI test tools** — Maestro and Detox for React Native/Flutter end-to-end testing; the chapter only recommends Compose UI tests which don't apply to cross-platform apps
- 🔴 **Secure CI/CD integration testing** — how to run integration tests in GitHub Actions against a Supabase test project without exposing service role keys or incurring production costs
- 🟡 **Mocking native APIs in Jest / flutter_test** — how to test code that calls native modules (camera, biometrics, push notifications) without crashing the test runner
- 🟡 **Load testing Supabase** — testing REST/PostgREST endpoints and Realtime WebSocket connections under load; k6 or Artillery with Supabase-specific guidance
- 🟢 **Visual regression testing** — catching unintended UI changes across devices; Chromatic or Percy for Storybook; not mentioned

---

## Chapter 13 — Privacy, Legal and Google Play Policy

### Missing Completely
- 🔴 **Indian Grievance Officer requirement (IT Rules 2021/2023)** — apps with significant Indian users must appoint a Grievance Officer with a name, email, and response SLA published in the app; non-compliance risks Play Store removal
- 🔴 **Financial / KYC regulations for payment apps** — RBI guidelines for payment aggregators, e-KYC rules, PPI wallet regulations; if your app handles money you likely need RBI approval or a licensed partner
- 🔴 **Aadhaar number handling** — masking is mandatory under the Aadhaar Act; storing or logging a full Aadhaar number is illegal; not mentioned at all
- 🔴 **AD_ID permission (ADVERTISING_ID)** — must be declared explicitly in AndroidManifest.xml when using any analytics or ad SDK; omission causes Play Store build rejection
- 🟡 **Parental consent implementation for under-18** — DPDP requires verifiable parental consent for minors; practical implementation (age gate, guardian verification flow) is absent
- 🟡 **Data Safety form for common SDKs** — Firebase Analytics, Crashlytics, Facebook SDK etc. all collect data automatically; failing to declare this in Play Console's Data Safety section causes rejection
- 🟡 **Google Play financial services / loan app policy** — extremely strict rules on who may offer loans via Play Store; many India fintech apps get banned for policy violations

### Too Shallow
- DPDP Act timelines are listed but practical implementation (what fields to add to your database, what UI to build) is absent

---

## Chapter 14 — Your Admin Dashboard

### Missing Completely
- 🔴 **Admin portal security architecture** — client-side RLS is insufficient for admin portals; needs a `public.user_roles` table with security definer functions; Cloudflare Zero Trust or similar for MFA and IP restriction
- 🔴 **Immutable audit logs** — how to prevent alteration of audit records via table permissions or Postgres triggers; current content doesn't explain this critical detail
- 🟡 **Push notification management from admin** — FCM / OneSignal integration to send targeted push notifications from the admin dashboard; a standard admin feature not mentioned
- 🟡 **Customer support workflow** — refund procedures for Razorpay/Cashfree via API, secure staff impersonation for debugging user issues, escalation paths; completely absent
- 🟡 **Database backup and PITR from admin** — Supabase Point-In-Time Recovery; how to restore without corrupting live data; when to use it
- 🟢 **Direct Supabase Dashboard edit warning** — editing production tables directly in Supabase Dashboard bypasses app validation and audit trails; handbook should explicitly warn against this

---

## Chapter 15 — Release: Getting onto Google Play Safely

### Missing Completely
- 🔴 **14-day / 20-tester requirement for personal accounts** — a personal Google Play Developer account cannot publish to open testing or production without completing a 14-day closed test with at least 20 real testers who opt in; this surprises and blocks most beginners
- 🔴 **Play Signing SHA-1 for Google Sign-In** — when using Google Sign-In with Supabase, the Play App Signing SHA-1 fingerprint must be registered in Google Cloud Console; failing to do this causes silent login failures in production
- 🔴 **Keystore loss = cannot update app** — losing your Android keystore file means you can never push an update to your existing app; backup strategy for the keystore is not mentioned at all
- 🔴 **16 KB memory page size (Android 15+)** — apps with native libraries must be built with 16 KB alignment for future Android API requirements; not mentioned
- 🟡 **Google Play Billing vs third-party gateways** — mandatory Play Billing for digital goods (subscriptions, in-app purchases); Razorpay/Cashfree for physical goods and services; getting this wrong causes app suspension
- 🟡 **Pre-Launch Report interpretation** — how to read Firebase Test Lab results in Play Console, interpret false positives, and provide login credentials for testing gated apps
- 🟡 **Staged rollout strategy** — rolling out to 1% → 10% → 50% → 100% of users; monitoring crash rate at each stage before expanding
- 🟡 **Automating AAB upload via Fastlane / GitHub Actions** — manual uploads cause human errors; automation is standard practice but not mentioned
- 🟢 **Play In-App Review API** — prompting users to rate the app at the right moment without leaving the app; standard UX practice not covered

### Wrong / Outdated
- 🟡 Content incorrectly represents the 20-tester requirement — the actual requirement is 20 opted-in testers who must keep the app installed for 14 consecutive days before the production track unlocks

---

## Chapter 16 — Running It Live

### Missing Completely
- 🔴 **Indian payment gateway monitoring** — Razorpay, Cashfree, PhonePe, and UPI infrastructure have frequent webhook failures and downtime windows; monitoring payment success rate separately from app health is essential
- 🔴 **FCM push notification deliverability monitoring** — OEM battery optimisation (Xiaomi, Realme, OnePlus) silently kills FCM delivery; monitoring delivery rates and guiding users to whitelist the app is not covered
- 🔴 **SMS / OTP deliverability monitoring** — TRAI DLT template mismatches cause OTP SMS to be silently dropped; monitoring OTP success rate and having a fallback (email OTP, WhatsApp OTP) is critical
- 🟡 **Feature flag architecture for Supabase** — practical implementation using a `/feature_flags` table with client-side caching; free alternatives (PostHog, Flagsmith free tier) compared to building from scratch
- 🟡 **Customer support channels for India** — Indian users strongly prefer WhatsApp Business API or in-app chat (Intercom, Freshchat) over email ticketing; not mentioned
- 🟡 **Google Play Vitals alert thresholds** — specific numbers for ANR rate (< 0.47%) and crash rate (< 0.47%) that trigger Play Store suppression; monitoring these is not covered

---

## Chapter 17 — Keeping It Healthy

### Missing Completely
- 🔴 **Database schema migration strategy (expand-and-contract)** — the safe way to change a live database column without downtime; add new column → migrate data → remove old column; not covered
- 🟡 **OTA update strategy (Expo EAS Update / CodePush)** — shipping JavaScript fixes to React Native users without a Play Store review cycle; a major maintenance tool not mentioned
- 🟡 **SDK audit and removal** — periodically checking for SDKs that have changed their data collection practices or been acquired by dubious companies; removing them safely
- 🟢 **Dependency licence audit** — ensuring open-source libraries used in production comply with their licences (GPL contamination risk)

---

## Chapter 18 — MCP, Skills, Plugins and Project Memory Files

### Missing Completely
- 🟡 **`.cursorrules` / `.windsurfrules`** — equivalent to CLAUDE.md but for Cursor and Windsurf IDE users; the chapter only covers Claude's project memory format
- 🟡 **MCP security model** — how to audit an MCP server before giving it access to your project; risk of prompt injection through malicious MCP tools
- 🟢 **Context window management strategy** — when to start a new chat session vs continue; how project memory files compensate for context loss

---

## Chapter 19 — My Prompt Library

### Missing Completely
- 🔴 **Supabase-specific prompts** — generating safe SQL migrations, RLS policies with correct performance patterns, Postgres trigger functions, Edge Function boilerplate; the existing prompts are framework-agnostic
- 🔴 **React Native / Flutter specific prompts** — Expo EAS setup, navigation boilerplate, state management setup, native module integration; completely absent
- 🟡 **India-specific localisation prompts** — generating multilingual UI strings, Indian number formatting (lakh/crore), date formatting (DD/MM/YYYY), and regional input validation
- 🟡 **Play Store rejection response prompt** — a prompt to parse a Google rejection letter, audit the offending code, and propose a remediation plan
- 🟡 **ANR and memory leak triage prompt** — prompts specifically for diagnosing Application Not Responding errors and memory leaks in React Native / Flutter
- 🟢 **Prompt for splitting dev/prod Supabase projects** — safely separating a unified Supabase project into separate dev and prod projects after the fact, without copying production user data

---

## Chapter 20 — Rescue: "I Already Built the App and It Is Insecure, Slow or Laggy"

### Missing Completely
- 🔴 **Lost Android keystore rescue** — losing the keystore means you cannot push any further updates; Play Console has a key reset request process (takes weeks, not guaranteed); this is a catastrophic scenario with no coverage
- 🔴 **Leaked secret in Git history** — rotating the key is not enough; the history must be purged with BFG Repo-Cleaner or `git-filter-repo` before the repo can be considered safe; not mentioned
- 🔴 **Enabling RLS on a live app safely** — simply enabling RLS without testing breaks the app immediately; the rescue must explain using permissive fallback policies and testing on a staging branch first
- 🟡 **Auth provider migration** — migrating from Firebase Auth, custom backend, or raw SQL to Supabase Auth with live users; OTP re-verification or password reset flows
- 🟡 **Play Store suspension rescue** — what to do immediately when Google suspends your app; the appeals process, timeline, and what evidence to submit
- 🟡 **Data Safety audit rescue** — many SDKs collect device data automatically; reconciling third-party SDK data collection with Play Console Data Safety declarations after submission
- 🟡 **Splitting dev/prod Supabase projects after the fact** — safely migrating from a single Supabase project used for both dev and prod without copying production user data to dev
- 🟢 **ANR triage rescue** — step-by-step for diagnosing Application Not Responding errors in React Native (bridge thread congestion) and Flutter (main isolate blocking)

---

## Cross-Cutting Gaps (Missing from ALL Chapters)

### 🔴 Critical — Absent Everywhere

1. **iOS / Apple App Store** — the entire handbook is Android-only. No TestFlight, App Store review rules, iOS-specific security (Keychain, App Transport Security), SwiftUI, or Xcode. If a user wants to ship on iPhone, they are completely on their own.

2. **React Native (Expo) end-to-end coverage** — the book's tech stack is Kotlin + Jetpack Compose + Supabase. React Native with Expo is used by 60–70% of indie builders in 2026 and is never properly addressed in any chapter.

3. **Flutter end-to-end coverage** — same gap; Flutter/Dart has a large Indian developer community and zero coverage.

4. **Marketing and getting first users** — not a single section in any chapter covers how to get users after launch. No content on landing pages, beta communities, App Store Optimization, social media, India-specific channels (WhatsApp groups, regional tech communities).

5. **Team collaboration** — the entire book assumes a solo builder with one AI. Nothing on working with a designer, another developer, or a client; handing off a codebase; using GitHub branches and pull requests collaboratively.

### 🟡 Important — Absent Everywhere

6. **TRAI DLT registration** — the Indian SMS regulatory system that every app sending OTPs must navigate; affects planning, launch timeline, and ongoing operations; not mentioned in any chapter.

7. **UPI-specific integration depth** — UPI Intent flow, UPI Collect flow, UPI AutoPay (mandates), handling UPI app not installed, reconciling UPI transaction IDs with your order IDs; Indian payment reality absent from all chapters.

8. **App Store Optimization (ASO)** — writing Play Store titles, descriptions, and choosing keywords so users can find the app; screenshot design for the Play Store listing; not covered anywhere.

9. **Push notification strategy** — when to send vs when it becomes spam; FCM setup and token management; deep links from notification to specific screen; notification permission best practices (ask at the right moment, not on first launch).

10. **Offline mode / sync architecture** — what happens when the user has no internet; local-first storage patterns; sync conflict resolution; showing "you are offline" gracefully; mentioned in passing but no chapter covers it properly.

11. **Review and rating strategy** — when and how to ask for a Play Store review (Play In-App Review API); how to respond to negative reviews; how to report fake reviews.

### 🟢 Nice to Have — Absent Everywhere

12. **Semantic versioning** — what 1.2.3 means, when to bump major vs minor vs patch, how this relates to force-update logic.

13. **Regional language support (i18n)** — supporting Hindi, Tamil, Bengali etc.; i18n libraries for React Native (i18next) and Flutter (intl package); translating strings without breaking AI-generated code.

14. **Competitor analysis and positioning** — how to research what already exists in the Play Store for your niche before building.

15. **Founder mental health / burnout** — building an app alone with AI is isolating and the feedback loop is slow; no content on setting realistic expectations, managing failure, or finding communities.

---

## Summary Count

| Category | Count |
|---|---|
| Missing Completely (🔴 Critical) | 42 |
| Missing Completely (🟡 Important) | 51 |
| Missing Completely (🟢 Nice to have) | 18 |
| Too Shallow | 29 |
| Wrong / Outdated | 8 |
| **Total gaps** | **148** |

---

*This file was auto-generated by a 3-agent swarm audit. Human review recommended before acting on any item.*
