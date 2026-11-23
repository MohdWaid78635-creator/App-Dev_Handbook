# Research notes for the Expo + Supabase playbook, stages 0 to 5

Checked: 2026-11-23, from official pages only. Gathered across two passes of official documentation (Expo, Supabase, Node, Git, Android, Google Play). Prices, store availability, and limits change: re-check before publishing a step.

---

## Stage 0: Set up the workshop

| Item | Finding | Source |
|---|---|---|
| **Node.js** | Download page lists **v26.13.1 LTS** (also v24.22.3 and v22.23.5 LTS lines). Windows: use `.msi` installer. macOS: use `.pkg` installer or `brew install node`. | nodejs.org/en/download |
| **Git (Windows)** | "Git for Windows" installer (2.56.1 x64); `winget install Git.Git` or Chocolatey. | git-scm.com/install/windows |
| **Git (macOS)** | `brew install git`, MacPorts, or `xcode-select --install`. | git-scm.com/install/mac |
| **Git First-Time Config** | Run once: `git config --global user.name "Your Name"`, `git config --global user.email "you@example.com"`, and `git config --global init.defaultBranch main` (Git 2.28+; default otherwise is `master`). Config precedence: `--local` (.git/config) overrides `--global` (~/.gitconfig, in Windows `$HOME`) overrides `--system` (/etc/gitconfig). | git-scm.com/book/en/v2/Getting-Started-First-Time-Git-Setup |
| **Android Studio** | Version: 2026.2.2 Patch 2. Requires virtualization in BIOS (Intel VT-x / AMD-V). Studio alone: 8 GB RAM, 8 GB disk. Studio + Emulator: **16 GB RAM minimum** (32 GB recommended), 16 GB disk free (32 GB+ SSD recommended), 1920x1080 display recommended, GPU with 4 GB VRAM min (8 GB rec). Device Manager: View > Tool Windows > Device Manager > Create Virtual Device. | developer.android.com/studio/install, /studio/run/managing-avds |
| **Android SDK for Expo** | Android 16 (API 36) SDK Platform + Sources + Build-Tools + Emulator; set `ANDROID_HOME` (Windows default `%LOCALAPPDATA%\Android\Sdk`), add `platform-tools` to PATH; JDK 17. | docs.expo.dev/get-started/set-up-your-environment |
| **Phone USB debugging** | Settings > About phone > tap "Build number" 7 times to enable Developer options > turn on USB debugging; `adb devices` in terminal must list the phone with status `device`. | developer.android.com/studio/debug/dev-options |
| **Claude Code install** | Windows PowerShell: `irm https://claude.ai/install.ps1 \| iex`; macOS: `curl -fsSL https://claude.ai/install.sh \| bash`. Requires a paid Claude plan or Console account. | code.claude.com/docs/en/setup |
| **Editors** | Cursor and VS Code official download pages. | cursor.com/download, code.visualstudio.com/download |
| **Expo account** | Free signup at expo.dev/signup. Expo Go on iOS requires terminal login (`npx expo login`) and app login to run in dev mode. Development builds do NOT require Expo Go login. | expo.dev/changelog/expo-go-57-login |

---

## Stage 2: Project skeleton

- **Latest SDK is 58** (announced 2026-10-15): React Native 0.88, React 19.3, Node 22.13+ / 24.3+ / 26+ (odd-numbered Node lines unsupported). Source: docs.expo.dev/versions/latest, expo.dev/changelog/sdk-58.
- **The Expo Go SDK 58 Trap:** As of 2026-11-23, no changelog entry confirms Expo Go SDK 58 in the app stores. Running `npx create-expo-app@latest` therefore creates an **SDK 57** project.
  - To use SDK 58: initialize with `npx create-expo-app --template default@sdk-58`.
  - SDK 58 projects on physical devices require a **development build** (`expo-dev-client`) rather than Expo Go.
- **Template defaults:** The `default` template includes Expo CLI, Expo Router, TypeScript configuration, and `AGENTS.md` (plus `.claude/settings.json` if Claude Code is installed). Starter routes live in `src/app/`. Run `npm run reset-project` to move starter code to an `example/` folder. Minimal options are `blank` or `blank-typescript`. Source: docs.expo.dev/more/create-expo, github.com/expo/expo/tree/main/templates/expo-template-default.
- **New Architecture:** Permanently enabled in SDK 55+ and cannot be disabled in SDK 58 (`newArchEnabled: false` is ignored). Source: docs.expo.dev/guides/new-architecture.md.
- **Running SDK 58 on a physical Android phone without Expo Go:**
  1. `npm install --global eas-cli && eas login`
  2. In project: `npx expo install expo-dev-client`
  3. Build debug APK: `eas build --platform android --profile development` (creates development client APK via cloud build).
  4. Sideload APK: Download on phone or install via USB: `adb install <path-to-file.apk>`.
  5. Start dev server: `npx expo start`, then launch app on phone and connect.
- **Environment variables:** Only `EXPO_PUBLIC_*` variables are bundled into the client via `process.env.EXPO_PUBLIC_*`. Inlined values are embedded in plaintext in the client bundle and are **never secret**. Add `.env*.local` to `.gitignore`. In SDK 58, only standard `.env`, `.env.local`, `.env.development`, `.env.production` load (custom `.env.staging` is ignored). Source: docs.expo.dev/guides/environment-variables.
- **Naming & Free Plan Limits:** EAS Build is "Expo Build", EAS Update is "Expo Update" (CLI commands and `eas.json` remain `eas`). Free plan: 15 Android and 15 iOS builds, low-priority queue (wait times up to 90 min at peak), 45-min build timeout; Expo Update free tier includes 1,000 monthly active users (MAU). Source: expo.dev/pricing.

---

## Stage 3: Backend (Supabase)

- **Free plan:** 500 MB database, 50,000 MAU, 5 GB egress, 1 GB storage, 2 active projects, paused after 1 week of inactivity, **no automatic backups**. Pro plan: $25/mo, daily backups kept 7 days, spend cap on by default (compute add-ons billed separately). Source: supabase.com/pricing, supabase.com/docs/guides/platform/cost-control.
- **Dev and Prod setup:** Two separate projects (dev and prod) fit entirely in the free plan. Git branch-based DB branching requires Pro. Source: supabase.com/docs/guides/deployment/branching.
- **Migrations workflow:** `supabase migration new <name>` → write SQL in `supabase/migrations/` → `supabase login` → `supabase link` → `supabase db push --remote`. Never edit the production schema manually in the dashboard; manual drift breaks `db push`. Source: supabase.com/docs/guides/deployment/database-migrations.

---

## Stage 4: Sign-in

- **API Keys:** Use the **publishable** key (`sb_publishable_...`) in the app. The **secret** key (`sb_secret_...`) bypasses all RLS and must never be committed to Git or embedded in the app. Legacy names `anon` and `service_role` are deprecated by late 2026. Source: supabase.com/docs/guides/api/api-keys.
- **Session storage:** Current official Supabase Expo quickstart uses `expo-sqlite/localStorage/install` (`@supabase/supabase-js`, `react-native-url-polyfill`, `expo-sqlite`). Options: `autoRefreshToken: true, persistSession: true, detectSessionInUrl: false`. SecureStore has a 2048-byte item size limit and requires custom AES encryption wrappers. Source: supabase.com/docs/guides/getting-started/quickstarts/expo-react-native.
- **AppState auto-refresh:** On mobile, you must attach an `AppState.addEventListener('change', ...)` listener: call `supabase.auth.startAutoRefresh()` when state is `'active'`, and `supabase.auth.stopAutoRefresh()` when backgrounded. Otherwise, background token polling drains battery. Source: supabase.com/docs/reference/javascript/auth-startautorefresh.
- **Google Sign-In:** Official Supabase docs recommend native sign-in via `@react-native-google-signin/google-signin` + `supabase.auth.signInWithIdToken({ provider: 'google', token })` rather than web browser redirects.
  - Requires Google Cloud Console OAuth 2.0 Client IDs for Android (registering SHA-1 fingerprint for both debug and release keystores) and Web (`webClientId`).
  - Add client IDs to Supabase Dashboard > Authentication > Providers > Google.
- **Email OTP / Magic Links:**
  - `signInWithOtp` sends a magic link by default; adding `{{ .Token }}` to the email template changes it to a 6-digit OTP code verified via `supabase.auth.verifyOtp({ email, token, type: 'email' })`.
  - Rate limit: 1 request every 60 seconds per user, expires in 1 hour.
  - Deep linking: requires setting `scheme` in `app.json`, configuring `makeRedirectUri()` from `expo-auth-session`, and adding redirect URL (e.g. `com.myapp://**`) to Supabase Auth URL allow-list.
  - **Email provider trap:** Supabase's built-in default email service allows only **2 emails per hour** across the entire project and delivers ONLY to project team members. Real apps must configure custom SMTP (Resend, SendGrid, Postmark) before launching.
- **Phone Sign-In:** Requires configuring a third-party SMS provider (Twilio, MessageBird, Vonage). Rate limit defaults to 30 SMS/hr per project. Test phone numbers with fixed verification codes can be registered in the dashboard to test without SMS costs. Source: supabase.com/docs/guides/auth/phone-login.

---

## Stage 5: Database and access rules (RLS)

- **RLS Performance Rules (apply in this order):**
  1. Index every column used in RLS policies (especially `user_id`).
  2. Wrap function calls in `select`, e.g., `(select auth.uid())`, enabling Postgres to cache the evaluation once per statement instead of once per row.
  3. Always declare the role with `to authenticated` or `to anon`.
  4. Avoid joins inside policies; use `security definer` functions with `search_path = ''` or subqueries checking membership sets.
  5. Client-side queries should still include `.eq('user_id', userId)` to assist query planner indexing.
  Source: supabase.com/docs/guides/database/postgres/row-level-security-performance.
- **Common Traps:**
  - RLS enabled on a table with no policies causes queries to return empty results without errors.
  - **Views bypass RLS** by default unless defined with `security_invoker = true` (Postgres 15+).
  - **Never use `user_metadata` for permissions** (users can edit their own metadata from the client); use `app_metadata` or a dedicated roles table.
- **Testing RLS with two users:**
  - Create pgTAP test files in `supabase/tests/` via `supabase test new <table_name>_rls` and execute with `supabase test db`.
  - Seed test users into `auth.users`, switch session with `set local role authenticated; set local request.jwt.claim.sub = '<user-uuid>';`.
  - Verify denials: SQLSTATE 42501 for insert/update violations; empty result set (`is_empty`) for unauthorized `select` queries.
  - Always use `returning` to verify writes rather than bare `lives_ok`.

---

## Facts for Later Stages (Stages 6 to 12)

- **Google Play 12-Tester Closed Test Rule:** Personal developer accounts created after 2023-11-13 must have at least **12 testers opted in for 14 consecutive days** on a closed testing track before applying for production access. One-time developer registration fee is **$25**. Source: support.google.com/googleplay/android-developer/answer/14151465.
- **Google Play Device Verification:** Personal account holders must verify access to an Android physical phone (Android 10+, non-rooted) by scanning a QR code with the Play Console mobile app before publishing apps. Takes < 1 minute. Source: support.google.com/googleplay/android-developer/answer/14316361.
- **Google Play Target API Level:** Starting August 31, 2026, all new apps and updates must target **Android 16 (API level 36)** or higher. Existing apps must target API 35 to remain discoverable. Extension to Nov 1, 2026 has expired; no subsequent extension granted. Source: support.google.com/googleplay/android-developer/answer/11926878.
- **Google Play Data Safety Form:** Mandatory for all apps submitted to Google Play (including closed test tracks). Apps that collect zero data must still complete the declaration and link a privacy policy. Source: support.google.com/googleplay/android-developer/answer/10787469.

---

## Conflicts Resolved from the Book & Guide

1. **Closed tester count:** `MISSING.md` and old notes stated 20 testers; the official Google Play requirement is **12 testers for 14 consecutive days** (personal accounts).
2. **Supabase key names:** The handbook used `anon` and `service_role`; Supabase officially migrated to **`publishable`** and **`secret`** keys, deprecating the legacy keys by end of 2026.
3. **Target API Level:** Old Android guidance targeted API 34/35; Google Play strictly requires **API 36 (Android 16)** as of Aug 31, 2026.
4. **Starter architecture:** Expo Go cannot be assumed for SDK 58 out-of-the-box due to store delays; the playbook guides the user through `npx create-expo-app --template default@sdk-58` with development builds (`expo-dev-client`) and USB sideloading via `adb`.
