// Build Quest — Step Card & Boss Fight Data
// Schema:
//   id: string (unique)
//   stage: number (0-12)
//   title: string
//   why: string (2-line explanation)
//   do: string[] (numbered actions)
//   prompt: string (copy-ready prompt with [APP_NAME] placeholder)
//   proof: string[] (observable checks)
//   ifStuck: string (guidance if broken)
//   risk: string
//   rollback: string
//   cost: string
//   xp: number
//   factCheck: { key: string, url: string, checkedOn: string }
//   source: { url: string, checked: string, versions: string[] }
//
// Boss fights per stage test the most critical conceptual trap.

window.PLAYBOOK_DATA = {
  meta: {
    name: 'Build Quest',
    subtitle: 'Ship an Expo + Supabase Android app, one boss fight at a time.',
    version: '1.1.0',
    stack: 'Expo SDK 57/58 · React Native 0.88 · Supabase 2.x · EAS · Android 16 (API 36)',
  },
  stages: [
    // ── STAGE 0: Set up the workshop ───────────────────────────────────────
    {
      id: 0,
      title: 'Set up the workshop',
      desc: 'Install Node LTS, Git, Android Studio with API 36, and configure your phone for USB debugging.',
      steps: [
        {
          id: 's0-step1',
          stage: 0,
          title: 'Install Node.js LTS and Git',
          why: 'Node runs the Expo bundler and CLI tools. Git tracks your project changes so you never lose working code.',
          do: [
            'Download and install Node.js LTS (v22+ or v24+ from nodejs.org). Avoid odd-numbered releases (e.g. Node 23).',
            'Install Git from git-scm.com (Windows: `winget install Git.Git`; macOS: `brew install git`).',
            'Set your identity: `git config --global user.name "Your Name"` and `git config --global user.email "you@example.com"`.',
            'Set main branch: `git config --global init.defaultBranch main`.'
          ],
          prompt: 'Check my development environment for [APP_NAME]. Run `node -v`, `git --version`, and `git config --list`. Confirm that Node is an active LTS version (>= 22) and Git is configured with default branch main.',
          proof: [
            'Running `node -v` outputs v22.x, v24.x, or v26.x.',
            'Running `git --version` prints Git 2.28 or higher.',
            'Running `git config init.defaultBranch` prints main.'
          ],
          ifStuck: 'If commands are not recognized after installation, restart your terminal or computer so the new PATH environment variables take effect.',
          risk: 'Installing an unsupported odd-numbered Node version can cause subtle native bundling errors.',
          rollback: 'Uninstall Node and reinstall the official LTS version from nodejs.org/en/download.',
          cost: '$0',
          xp: 20,
          factCheck: { key: 'node-lts', url: 'https://nodejs.org/en/download', checkedOn: '2026-11-23' },
          source: { url: 'https://nodejs.org/en/download', checked: '2026-11-23', versions: ['Node 22/24 LTS', 'Git 2.56+'] }
        },
        {
          id: 's0-step2',
          stage: 0,
          title: 'Install Android Studio & SDK 36 (Android 16)',
          why: 'Google Play strictly requires targeting Android 16 (API 36). Android Studio provides SDK platform tools, build tools, and ADB.',
          do: [
            'Download and install Android Studio (developer.android.com/studio).',
            'Open Android Studio > SDK Manager: install Android 16 (API 36) SDK Platform, Sources, and Build-Tools.',
            'Set system environment variable `ANDROID_HOME` (Windows: `%LOCALAPPDATA%\\Android\\Sdk`).',
            'Add `%ANDROID_HOME%\\platform-tools` to your system PATH.'
          ],
          prompt: 'Verify my Android SDK setup for building [APP_NAME]. Check if `adb --version` is accessible from the command line and confirm that `ANDROID_HOME` points to the Android SDK directory with API 36 tools installed.',
          proof: [
            'Running `adb --version` displays Android Debug Bridge version in terminal.',
            'Environment variable `ANDROID_HOME` is set to the valid SDK path.'
          ],
          ifStuck: 'On Windows, search for "Edit the system environment variables", click Environment Variables, and ensure both ANDROID_HOME and platform-tools in Path exist under System variables.',
          risk: 'Missing platform-tools in PATH means Expo CLI and EAS local builds cannot detect connected devices or emulators.',
          rollback: 'Reopen Android Studio SDK Manager and re-check "Android SDK Platform-Tools".',
          cost: '$0',
          xp: 20,
          factCheck: { key: 'android-target-api', url: 'https://developer.android.com/studio/install', checkedOn: '2026-11-23' },
          source: { url: 'https://docs.expo.dev/get-started/set-up-your-environment', checked: '2026-11-23', versions: ['Android Studio 2026', 'API 36 (Android 16)'] }
        },
        {
          id: 's0-step3',
          stage: 0,
          title: 'Configure Physical Android Phone for USB Debugging',
          why: 'Testing on a real physical Android phone is essential for verifying touch responsiveness, permissions, and native hardware behavior.',
          do: [
            'On your Android phone, open Settings > About phone.',
            'Tap "Build number" 7 times rapidly until the toast says "You are now a developer!".',
            'Open Settings > System > Developer options, toggle on "USB debugging".',
            'Connect phone to PC with a data-capable USB cable.',
            'When the phone prompts "Allow USB debugging?", check "Always allow from this computer" and tap OK.',
            'In terminal, run `adb devices`.'
          ],
          prompt: 'Help me verify that my physical Android phone is connected and recognized for [APP_NAME]. Run `adb devices` and verify the status is "device" rather than "unauthorized" or "offline".',
          proof: [
            '`adb devices` lists a serial number followed by the word "device".',
            'The phone displays no unresolved permission or driver alerts.'
          ],
          ifStuck: 'If status is "unauthorized", disconnect the USB cable, reconnect, unlock the phone screen, and approve the USB debugging prompt.',
          risk: 'Low-quality charge-only USB cables lack data lines and will never trigger ADB detection.',
          rollback: 'In Developer options, tap "Revoke USB debugging authorizations" to reset all computer pairings.',
          cost: '$0',
          xp: 20,
          factCheck: { key: 'adb-usb-debugging', url: 'https://developer.android.com/studio/debug/dev-options', checkedOn: '2026-11-23' },
          source: { url: 'https://developer.android.com/studio/debug/dev-options', checked: '2026-11-23', versions: ['Android 10+'] }
        },
        {
          id: 's0-step4',
          stage: 0,
          title: 'Create Expo Account and Install EAS CLI',
          why: 'EAS (Expo Application Services) compiles native APK and AAB binaries in the cloud so you can build without complex local toolchains.',
          do: [
            'Sign up for a free Expo account at expo.dev/signup.',
            'Install EAS CLI globally: `npm install -g eas-cli`.',
            'Log into your account: `eas login`.'
          ],
          prompt: 'Confirm that EAS CLI is installed and authenticated for [APP_NAME]. Run `eas whoami` and display my logged-in Expo username.',
          proof: [
            'Running `eas --version` prints the CLI version (>= 14.x).',
            'Running `eas whoami` returns your Expo account username.'
          ],
          ifStuck: 'If global npm install gives permission errors on Windows, run PowerShell as Administrator or configure an npm global directory in your user profile.',
          risk: 'Installing eas-cli locally in a single project folder rather than globally can lead to command not found errors in scripts.',
          rollback: 'Run `npm uninstall -g eas-cli` and reinstall using your preferred node package manager.',
          cost: '$0 (Free plan includes 15 Android builds per month)',
          xp: 20,
          factCheck: { key: 'eas-pricing', url: 'https://expo.dev/pricing', checkedOn: '2026-11-23' },
          source: { url: 'https://expo.dev/signup', checked: '2026-11-23', versions: ['EAS CLI 14+'] }
        }
      ],
      boss: {
        question: 'When should you move from Expo Go to a development build?',
        options: [
          'Expo Go was completely removed from the Google Play Store.',
          'Use a compatible Expo Go build for supported beginner exercises. Use a development build when the project needs a native dependency or configuration Expo Go does not include.',
          'Physical Android devices are restricted to installing apps only from the official Play Store.',
          'Expo charges a mandatory $25/month fee to open apps inside Expo Go.'
        ],
        answer: 1
      }
    },

    // ── STAGE 1: Idea check and scope ──────────────────────────────────────
    {
      id: 1,
      title: 'Idea check and scope',
      desc: 'Lock your 1-sentence proposition, define 3 core screens, and permanently lock your Android package identifier.',
      steps: [
        {
          id: 's1-step1',
          stage: 1,
          title: 'Define the 1-Sentence Pitch & 3 Core Screens',
          why: 'Feature creep delays launches for months. Constraining your MVP to exactly 3 screens guarantees you can ship a working version.',
          do: [
            'Write a 1-sentence value proposition for [APP_NAME]: "For [target user], [APP_NAME] is a [category] that [key benefit]."',
            'List exactly 3 essential screens (e.g. 1: Feed/Dashboard, 2: Action/Create, 3: Detail/Settings).',
            'Move all other ideas into a "Post-Launch v2" list.'
          ],
          prompt: 'Here is my concept for [APP_NAME]: [DESCRIBE IDEA]. Help me sharpen this into a 1-sentence value proposition and specify exactly 3 core screens for the MVP. Ruthlessly cut non-essential features.',
          proof: [
            'Value proposition is written and under 30 words.',
            'Exactly 3 core screens are specified with one clear primary action each.'
          ],
          ifStuck: 'Ask your AI: "What is the single action without which [APP_NAME] cannot solve its core user problem?" Make that screen #2.',
          risk: 'Adding payment systems, social logins, and multi-tenant teams before proving basic utility.',
          rollback: 'Remove extra screens from your scope document.',
          cost: '$0',
          xp: 20,
          factCheck: { key: 'mvp-scope', url: 'https://expo.dev', checkedOn: '2026-11-23' },
          source: { url: 'https://docs.expo.dev', checked: '2026-11-23', versions: ['MVP Architecture'] }
        },
        {
          id: 's1-step2',
          stage: 1,
          title: 'Lock Android Package Identifier & App Name',
          why: 'The Android package identifier (e.g. com.company.appname) cannot be altered once uploaded to Google Play without losing all reviews and users.',
          do: [
            'Choose a reverse-domain identifier (e.g. `com.[yourname].[appname]`).',
            'Check that it does not already exist on Google Play (`play.google.com/store/apps/details?id=...`).',
            'Record your chosen package identifier in your project spec.'
          ],
          prompt: 'I want to name my app [APP_NAME]. Recommend 3 clean reverse-DNS package identifiers conforming to `com.[brand].[appname]`. Verify they use lowercase alphanumeric characters only and avoid reserved keywords.',
          proof: [
            'Package name strictly matches regex `^[a-z][a-z0-9_]*(\\.[a-z][a-z0-9_]*)+$`.',
            'Navigating to `https://play.google.com/store/apps/details?id=<YOUR_ID>` returns a 404 page (confirming it is available).'
          ],
          ifStuck: 'If your common name is taken, append "app" or your domain suffix (e.g. `com.devstudio.mycoolapp`).',
          risk: 'Changing package name later breaks Google OAuth SHA fingerprints, deep links, push notifications, and store listings.',
          rollback: 'Pick a new identifier before triggering your first cloud build.',
          cost: '$0',
          xp: 20,
          factCheck: { key: 'android-package-id', url: 'https://developer.android.com/studio/build/application-id', checkedOn: '2026-11-23' },
          source: { url: 'https://developer.android.com/studio/build/application-id', checked: '2026-11-23', versions: ['Google Play Console 2026'] }
        },
        {
          id: 's1-step3',
          stage: 1,
          title: 'Execute the 5-User Reality Check',
          why: 'Building in a vacuum leads to zero downloads. Pitching 5 real people validates whether anyone actually cares about the problem.',
          do: [
            'Identify 5 real people in your target demographic.',
            'Share your 1-sentence pitch and 3-screen outline.',
            'Ask: "If I install this on your Android phone next week, would you open it daily?"',
            'Document their honest objections.'
          ],
          prompt: 'Draft a short, non-leading 3-question survey message I can send to 5 real potential users of [APP_NAME] to validate if they feel the pain point and want an Android app for it.',
          proof: [
            'You have written feedback notes from at least 5 distinct individuals.',
            'At least 3 confirmed they want the core problem solved.'
          ],
          ifStuck: 'Find target users in specific subreddits, Discord servers, or relevant forums where people complain about this problem.',
          risk: 'Mistaking polite encouragement for genuine demand.',
          rollback: 'Pivot your core screen workflow if users express zero interest in the problem.',
          cost: '$0',
          xp: 20,
          factCheck: { key: 'user-validation', url: 'https://expo.dev', checkedOn: '2026-11-23' },
          source: { url: 'https://docs.expo.dev', checked: '2026-11-23', versions: ['Product Validation'] }
        }
      ],
      boss: {
        question: 'Why is it dangerous to change your Android package identifier (`android.package` in app.json) after uploading your first release to Google Play Console?',
        options: [
          'Google Play allows package name updates only if you pay an additional $100 fee.',
          'Google Play treats a new package name as an entirely different application, permanently severing all existing users, ratings, push notification tokens, and OAuth credentials.',
          'Expo CLI permanently blocks builds if the package name changes.',
          'Android devices will show an operating system warning stating the phone is damaged.'
        ],
        answer: 1
      }
    },

    // ── STAGE 2: Project skeleton ──────────────────────────────────────────
    {
      id: 2,
      title: 'Project skeleton',
      desc: 'Initialize Expo Router with strict TypeScript, configure git & env variables, and build your first Android dev client APK.',
      steps: [
        {
          id: 's2-step1',
          stage: 2,
          title: 'Initialize Expo Router Project with TypeScript',
          why: 'Expo Router delivers file-based routing, native tab navigation, and type safety configured according to modern standards.',
          do: [
            'Run `npx create-expo-app@latest [APP_NAME] --template default` (or `--template default@sdk-58` for SDK 58).',
            'Open the project folder in VS Code or Cursor.',
            'In `app.json`, set `name`, `slug`, `scheme`, and `android.package` to your locked identifier.',
            'Run `npx expo start` to confirm clean initialization.'
          ],
          prompt: 'Create an Expo Router TypeScript project named [APP_NAME]. Configure `app.json` with my app name, scheme "[APP_NAME]", and android package identifier. Verify directory structure.',
          proof: [
            '`package.json` contains `expo`, `expo-router`, and `react-native`.',
            '`app.json` contains configured `android.package` matching your Stage 1 identifier.',
            '`app/` folder exists containing `_layout.tsx`.'
          ],
          ifStuck: 'If npm fails due to path issues on Windows, avoid directories containing spaces or exclamation marks.',
          risk: 'Using older template styles without Expo Router requires complex React Navigation refactoring later.',
          rollback: 'Delete the directory and re-run with the official `--template default` flag.',
          cost: '$0',
          xp: 20,
          factCheck: { key: 'expo-sdk-version', url: 'https://expo.dev/changelog', checkedOn: '2026-11-23' },
          source: { url: 'https://docs.expo.dev/more/create-expo', checked: '2026-11-23', versions: ['Expo SDK 57/58', 'React Native 0.88'] }
        },
        {
          id: 's2-step2',
          stage: 2,
          title: 'Configure .gitignore and Public Environment Variables',
          why: 'Client environment variables (`EXPO_PUBLIC_*`) are bundled in plaintext into the APK and are never secret. Secrets must never be committed to git.',
          do: [
            'Ensure `.gitignore` contains `.env*.local`, `.env`, `node_modules/`, `.expo/`, and `*.jks`.',
            'Create `.env.example` listing required public variables.',
            'Create `.env` for local testing with `EXPO_PUBLIC_SUPABASE_URL=`.'
          ],
          prompt: 'Audit the `.gitignore` file for [APP_NAME] to guarantee that all `.env` files, keystores, and build caches are ignored. Explain why client-side EXPO_PUBLIC_ variables are visible to anyone decompiling the APK.',
          proof: [
            'Running `git status` does not show `.env` or `.env.local`.',
            '`.gitignore` contains `.env*` and android keystore patterns.'
          ],
          ifStuck: 'If a `.env` file was already tracked in git, untrack it without deleting local data: `git rm --cached .env`.',
          risk: 'Accidentally committing service role keys or keystore passwords to a public GitHub repo.',
          rollback: 'Run `git rm --cached .env` and immediately rotate any exposed credentials.',
          cost: '$0',
          xp: 20,
          factCheck: { key: 'expo-env-vars', url: 'https://docs.expo.dev/guides/environment-variables', checkedOn: '2026-11-23' },
          source: { url: 'https://docs.expo.dev/guides/environment-variables', checked: '2026-11-23', versions: ['Expo SDK 57/58'] }
        },
        {
          id: 's2-step3',
          stage: 2,
          title: 'Configure eas.json for Development & Production',
          why: 'EAS Build requires build profiles defining whether to compile a debug development APK or an optimized release AAB for Google Play.',
          do: [
            'Run `eas build:configure`.',
            'In `eas.json`, configure the `development` profile with `"developmentClient": true` and `"android": { "buildType": "apk" }`.',
            'Configure the `production` profile with `"android": { "buildType": "app-bundle" }`.'
          ],
          prompt: 'Configure `eas.json` for [APP_NAME] with development (debug APK with developmentClient: true), preview (internal test APK), and production (release AAB for Play Store) profiles.',
          proof: [
            '`eas.json` exists in root folder.',
            '`build.development.android.buildType` is set to "apk".',
            '`build.development.developmentClient` is set to true.'
          ],
          ifStuck: 'Run `eas config` to validate syntax and inspect the resolved configuration.',
          risk: 'If development profile generates an AAB instead of an APK, you cannot directly sideload and test on your phone.',
          rollback: 'Edit `eas.json` and change `buildType` to `"apk"` under development.',
          cost: '$0',
          xp: 20,
          factCheck: { key: 'eas-json-format', url: 'https://docs.expo.dev/build/eas-json', checkedOn: '2026-11-23' },
          source: { url: 'https://docs.expo.dev/build/eas-json', checked: '2026-11-23', versions: ['EAS Build 2026'] }
        },
        {
          id: 's2-step4',
          stage: 2,
          title: 'Install expo-dev-client and Build Development APK',
          why: 'A development APK includes the native libraries and configuration of your own project. Compatible Expo Go is sufficient for the first local exercise.',
          do: [
            'Run `npx expo install expo-dev-client`.',
            'Run `eas build --platform android --profile development`.',
            'When the EAS cloud build completes, download the `.apk` file.',
            'Install the APK onto your connected Android phone: `adb install <file>.apk`.'
          ],
          prompt: 'Help me install `expo-dev-client` and execute `eas build --platform android --profile development` for [APP_NAME]. Once compiled, help me install the APK onto my connected phone via `adb install`.',
          proof: [
            'EAS build finishes successfully in terminal with a green checkmark.',
            '`adb install ...` prints "Success".',
            'The [APP_NAME] app icon appears on your physical phone launcher.'
          ],
          ifStuck: 'If EAS cloud build queue is slow, you can also build locally if you have Android SDK configured: `npx expo run:android`.',
          risk: 'Build failure if Android SDK licenses are not accepted or package name contains invalid characters.',
          rollback: 'Inspect error logs on expo.dev/accounts/[user]/projects/[app]/builds.',
          cost: '1 free build consumed (15 free Android builds/mo)',
          xp: 20,
          factCheck: { key: 'eas-free-build-quota', url: 'https://expo.dev/pricing', checkedOn: '2026-11-23' },
          source: { url: 'https://docs.expo.dev/develop/development-builds/create-a-build', checked: '2026-11-23', versions: ['Expo SDK 58', 'expo-dev-client'] }
        },
        {
          id: 's2-step5',
          stage: 2,
          title: 'Connect Dev Server to Device & Verify Fast Refresh',
          why: 'Verifying real-time hot-reloading ensures you can write code and see instant updates on your physical device without rebuilding.',
          do: [
            'In project terminal, start Metro bundler: `npx expo start`.',
            'Open the installed dev client on your phone and connect to your computer (enter local IP or scan terminal QR).',
            'If connection fails, connect USB and run `adb reverse tcp:8081 tcp:8081`, then connect to `localhost:8081`.',
            'Edit text in `app/index.tsx` and verify phone updates instantly.'
          ],
          prompt: 'Guide me through connecting my custom Expo dev client on Android to `npx expo start`. If the Wi-Fi connection fails, show me how to use `adb reverse tcp:8081 tcp:8081` to test Fast Refresh over USB.',
          proof: [
            'Modifying text in `app/index.tsx` updates on the phone screen in under 1 second.',
            'Terminal prints "Android Bundled ...ms".'
          ],
          ifStuck: 'Guest Wi-Fi networks block device-to-device communication. Always use USB cable with `adb reverse tcp:8081 tcp:8081` for 100% reliable local networking.',
          risk: 'Firewall blocking port 8081 on your computer.',
          rollback: 'Run `adb reverse tcp:8081 tcp:8081` or allow Node through Windows Defender Firewall.',
          cost: '$0',
          xp: 20,
          factCheck: { key: 'expo-fast-refresh', url: 'https://docs.expo.dev/workflow/development-mode', checkedOn: '2026-11-23' },
          source: { url: 'https://docs.expo.dev/workflow/development-mode', checked: '2026-11-23', versions: ['Metro Bundler 2026'] }
        }
      ],
      boss: {
        question: 'What is the most reliable way to connect your physical Android phone to the local Metro dev server if local Wi-Fi router blocks peer-to-peer device traffic?',
        options: [
          'Upload the project to GitHub and pull it from the phone.',
          'Connect the phone with a USB cable and run `adb reverse tcp:8081 tcp:8081`, then open `localhost:8081` in the dev client.',
          'Turn off the router and restart the computer 3 times.',
          'Convert all TypeScript files to plain CSS.'
        ],
        answer: 1
      }
    },

    // ── STAGE 3: Backend (Supabase) ────────────────────────────────────────
    {
      id: 3,
      title: 'Backend (Supabase)',
      desc: 'Set up separate dev and prod Supabase projects, safely manage publishable keys, link migrations, and enable spend caps.',
      steps: [
        {
          id: 's3-step1',
          stage: 3,
          title: 'Create Separate Dev and Prod Supabase Projects',
          why: 'Testing schema changes or deleting test rows in production causes real user data loss. Supabase free tier allows 2 active projects—ideal for dev and prod.',
          do: [
            'Log into supabase.com.',
            'Create project 1: `[APP_NAME]-dev` (choose a geographic region near your users).',
            'Create project 2: `[APP_NAME]-prod`.',
            'Record database passwords in a secure password manager.'
          ],
          prompt: 'Help me set up two separate Supabase projects for [APP_NAME]: `[APP_NAME]-dev` and `[APP_NAME]-prod`. Explain how to structure environment files to keep dev and production environments strictly separated.',
          proof: [
            'Supabase dashboard lists both `[APP_NAME]-dev` and `[APP_NAME]-prod` with active green status.',
            'Each project has a distinct project reference and URL.'
          ],
          ifStuck: 'If a free project is paused, open it in the Supabase dashboard and follow the restore instructions before retrying.',
          risk: 'Accidentally pointing your local development client to the production database.',
          rollback: 'Maintain separate `.env.development` and `.env.production` files.',
          cost: '$0 (2 free projects included in Supabase free tier)',
          xp: 20,
          factCheck: { key: 'supabase-free-projects', url: 'https://supabase.com/pricing', checkedOn: '2026-11-23' },
          source: { url: 'https://supabase.com/docs/guides/platform/cost-control', checked: '2026-11-23', versions: ['Supabase 2026'] }
        },
        {
          id: 's3-step2',
          stage: 3,
          title: 'Configure Publishable Key (Never Expose Secret Key)',
          why: 'Supabase officially migrated from legacy anon/service_role keys to publishable (`sb_publishable_...`) and secret (`sb_secret_...`). The secret key bypasses all RLS and must NEVER exist in mobile code.',
          do: [
            'In Supabase Dashboard > Project Settings > API, copy the Publishable API Key.',
            'Add to `.env`: `EXPO_PUBLIC_SUPABASE_URL=https://<your-dev-ref>.supabase.co` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`.',
            'Verify that the Secret Key (`sb_secret_...`) is never added to `.env` or any client code.'
          ],
          prompt: 'Configure my [APP_NAME] `.env` file using the new Supabase publishable key format (`sb_publishable_...`). Confirm that secret keys bypassing Row Level Security are never exposed in mobile client bundles.',
          proof: [
            '`.env` has `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.',
            'Searching your repository for `sb_secret_` or `service_role` yields zero matches.'
          ],
          ifStuck: 'If you ever accidentally committed a secret key, go to Supabase Dashboard > Settings > API and click "Rotate secret key" immediately.',
          risk: 'Anyone decompiling your APK can view all strings. Exposing a secret key gives malicious users full unrestricted access to drop or modify all database tables.',
          rollback: 'Rotate the secret key in Supabase Console.',
          cost: '$0',
          xp: 20,
          factCheck: { key: 'supabase-key-names', url: 'https://supabase.com/docs/guides/api/api-keys', checkedOn: '2026-11-23' },
          source: { url: 'https://supabase.com/docs/guides/api/api-keys', checked: '2026-11-23', versions: ['Supabase 2026 API Key Spec'] }
        },
        {
          id: 's3-step3',
          stage: 3,
          title: 'Initialize Supabase CLI and Link Dev Project',
          why: 'Manual schema edits in the web dashboard cause drift that breaks deployments. CLI migrations keep your schema versioned in git.',
          do: [
            'Install Supabase CLI as dev dependency: `npm install -D supabase`.',
            'Initialize configuration: `npx supabase init`.',
            'Log into Supabase: `npx supabase login`.',
            'Link to your dev project: `npx supabase link --project-ref <your-dev-ref>`.'
          ],
          prompt: 'Initialize Supabase CLI in [APP_NAME] and link it to my dev project reference. Check the linked development reference with `npx supabase projects list`. The status command is for the local stack.',
          proof: [
            '`supabase/config.toml` exists in project root.',
            '`npx supabase projects list` marks the intended development project as linked.'
          ],
          ifStuck: 'Find your project reference in your browser URL bar: `supabase.com/dashboard/project/<project-ref>`.',
          risk: 'Linking to your production project by mistake.',
          rollback: 'Re-run `npx supabase link --project-ref <dev-ref>` to switch back to dev.',
          cost: '$0',
          xp: 20,
          factCheck: { key: 'supabase-cli-version', url: 'https://supabase.com/docs/guides/cli', checkedOn: '2026-11-23' },
          source: { url: 'https://supabase.com/docs/guides/deployment/database-migrations', checked: '2026-11-23', versions: ['Supabase CLI 2.x'] }
        },
        {
          id: 's3-step4',
          stage: 3,
          title: 'Create Migration with Strict Row Level Security',
          why: 'Grants allow operations on a table. Row Level Security policies limit which rows each operation can touch. Configure both in the same migration.',
          do: [
            'Create migration: `npx supabase migration new create_initial_schema`.',
            'Define your main table in SQL (e.g. `items` with `id uuid primary key default gen_random_uuid()`, `user_id uuid references auth.users not null`, `created_at timestamptz default now()`).',
            'Enable RLS, review table grants, and give client roles only the operations their policies need. Keep access denied until the owner policies are added.',
            'Verify the linked development ref and preview with `npx supabase db push --dry-run --remote`. Apply the reviewed migration with `npx supabase db push --remote`.'
          ],
          prompt: 'Write a Postgres migration for [APP_NAME] creating an MVP entity table linked to `auth.users(id)`. Include UUID primary key, timestamps, and `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`.',
          proof: [
            'SQL migration file exists in `supabase/migrations/`.',
            '`npx supabase db push` finishes with "Finished supabase db push".',
            'In Supabase Table Editor, the table displays the padlock badge indicating RLS is active.'
          ],
          ifStuck: 'If db push fails due to syntax errors, inspect the exact SQL line error reported in the terminal.',
          risk: 'Missing `ENABLE ROW LEVEL SECURITY` leaves the table publicly open.',
          rollback: 'Stop the rollout and diagnose in development. Revert a migration only before it is applied. For applied changes, review a corrective migration or rehearse an isolated restore.',
          cost: '$0',
          xp: 20,
          factCheck: { key: 'supabase-rls-default', url: 'https://supabase.com/docs/guides/database/postgres/row-level-security', checkedOn: '2026-11-23' },
          source: { url: 'https://supabase.com/docs/guides/database/postgres/row-level-security', checked: '2026-11-23', versions: ['PostgreSQL 15+'] }
        },
        {
          id: 's3-step5',
          stage: 3,
          title: 'Generate TypeScript Types from Database Schema',
          why: 'Manual TypeScript interfaces drift from SQL definitions, causing silent runtime bugs. Supabase CLI generates exact types directly from Postgres.',
          do: [
            'Run `npx supabase gen types typescript --linked > types/database.ts`.',
            'Inspect `types/database.ts` and confirm table definitions match SQL.',
            'Import `Database` into your Supabase client initialization.'
          ],
          prompt: 'Generate TypeScript types from my linked Supabase dev database schema into `types/database.ts` for [APP_NAME]. Show me how to pass `Database` generic to `createClient<Database>()`.',
          proof: [
            '`types/database.ts` exists and contains type definitions for your tables.',
            'Calling `supabase.from(\'items\').select(...)` provides full TypeScript column autocomplete.'
          ],
          ifStuck: 'Ensure you have executed `npx supabase link` before generating types.',
          risk: 'Writing code against outdated types if you update schema without re-generating types.',
          rollback: 'Re-run the type generation command whenever migrations are applied.',
          cost: '$0',
          xp: 20,
          factCheck: { key: 'supabase-gen-types', url: 'https://supabase.com/docs/guides/api/rest/generating-types', checkedOn: '2026-11-23' },
          source: { url: 'https://supabase.com/docs/guides/api/rest/generating-types', checked: '2026-11-23', versions: ['TypeScript 5+'] }
        },
        {
          id: 's3-step6',
          stage: 3,
          title: 'Check your plan and Supabase usage',
          why: 'Free and Pro have different limits. Pro Spend Cap applies to selected usage items, with exclusions such as compute and point-in-time recovery.',
          do: [
            'Open Supabase Dashboard > Organization > Billing > Cost Control.',
            'On Pro, review or enable Spend Cap and record what it excludes. On Free, record your plan limits and review the usage page.',
            'Choose a review cadence for usage and invoices. Spend Cap does not provide custom threshold alerts.'
          ],
          prompt: 'Help me read the billing plan and usage for [APP_NAME]. Explain Spend Cap eligibility, covered usage and exclusions without changing billing settings.',
          proof: [
            'Current plan, relevant limits and Spend Cap status where applicable are recorded.',
            'A usage review date and a response to rising costs are recorded.'
          ],
          ifStuck: 'Use the usage and upcoming invoice pages to distinguish plan charges, included usage and excluded items.',
          risk: 'Compute and other excluded items can contribute charges even with Spend Cap enabled.',
          rollback: 'Pause costly optional work and review usage before changing plans or paid add-ons.',
          cost: '$0',
          xp: 20,
          factCheck: { key: 'supabase-spend-cap', url: 'https://supabase.com/docs/guides/platform/cost-control', checkedOn: '2026-11-23' },
          source: { url: 'https://supabase.com/docs/guides/platform/cost-control', checked: '2026-11-23', versions: ['Billing 2026'] }
        }
      ],
      boss: {
        question: 'What is the consequence of bundling your Supabase secret key (`sb_secret_...` or legacy `service_role`) inside your client-side mobile app?',
        options: [
          'App queries execute 30% faster by caching credentials locally.',
          'Any user who downloads your APK can decompile it in seconds, extract the secret key, and bypass all Row Level Security to read, modify, or erase your entire database.',
          'Google Play will reject your app during automated review for having a long string.',
          'Supabase will automatically upgrade your account to the Enterprise tier.'
        ],
        answer: 1
      }
    },

    // ── STAGE 4: Sign-in ───────────────────────────────────────────────────
    {
      id: 4,
      title: 'Sign-in',
      desc: 'Implement persistent mobile session storage with expo-sqlite, AppState auto-refresh, custom SMTP OTP, and protected routes.',
      steps: [
        {
          id: 's4-step1',
          stage: 4,
          title: 'Install Supabase JS Client with Mobile SQLite Storage',
          why: 'Standard browser localStorage does not exist in React Native. The modern official Supabase Expo configuration uses expo-sqlite to avoid SecureStore size limits.',
          do: [
            'Install dependencies: `npx expo install @supabase/supabase-js expo-sqlite react-native-url-polyfill`.',
            'Create `lib/supabase.ts`.',
            'Configure client using `localStorage` polyfill from `expo-sqlite/localStorage/install` with `autoRefreshToken: true` and `persistSession: true`.'
          ],
          prompt: 'Create a production Supabase client for [APP_NAME] in `lib/supabase.ts` using `expo-sqlite/localStorage/install` for session persistence and `react-native-url-polyfill`. Incorporate types from `types/database.ts`.',
          proof: [
            '`lib/supabase.ts` exports typed `supabase` client.',
            'No warnings or missing module errors when starting the app.'
          ],
          ifStuck: 'The Expo quickstart uses SQLite-backed persistence. The React Native Auth quickstart still shows AsyncStorage. Match one documented adapter and distinguish persistence from encryption.',
          risk: 'Using Expo SecureStore directly without custom chunking fails when Supabase tokens exceed 2048 bytes.',
          rollback: 'Run `npx expo-doctor` to ensure all native module versions match your Expo SDK.',
          cost: '$0',
          xp: 20,
          factCheck: { key: 'supabase-expo-storage', url: 'https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native', checkedOn: '2026-11-23' },
          source: { url: 'https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native', checked: '2026-11-23', versions: ['@supabase/supabase-js 2.x', 'expo-sqlite'] }
        },
        {
          id: 's4-step2',
          stage: 4,
          title: 'Implement Mobile AppState Token Refresh Listener',
          why: 'Mobile apps must stop background network polling when the user switches apps. Otherwise, continuous auth token refresh drains battery and triggers Android OS warnings.',
          do: [
            'In root `app/_layout.tsx`, import `AppState` from `react-native`.',
            'Add an `AppState.addEventListener(\'change\', ...)` listener.',
            'When state becomes "active", call `supabase.auth.startAutoRefresh()`.',
            'When state becomes "background", call `supabase.auth.stopAutoRefresh()`.'
          ],
          prompt: 'Add the official Supabase mobile AppState listener to root `app/_layout.tsx` for [APP_NAME]. Start autoRefresh on active state and stop autoRefresh on background state to preserve mobile battery.',
          proof: [
            'Root layout includes `AppState.addEventListener` listener.',
            'App refreshes tokens only when in foreground.'
          ],
          ifStuck: 'Wrap the AppState listener in a `useEffect` and return the cleanup unsubscribe function.',
          risk: 'Leaving token refresh active in background causes Android OS battery saver to forcibly kill your application.',
          rollback: 'Verify that `supabase.auth.stopAutoRefresh()` is called when app state is not "active".',
          cost: '$0',
          xp: 20,
          factCheck: { key: 'supabase-appstate-refresh', url: 'https://supabase.com/docs/reference/javascript/auth-startautorefresh', checkedOn: '2026-11-23' },
          source: { url: 'https://supabase.com/docs/reference/javascript/auth-startautorefresh', checked: '2026-11-23', versions: ['Supabase Auth JS v2.40+'] }
        },
        {
          id: 's4-step3',
          stage: 4,
          title: 'Configure Custom SMTP & 6-Digit OTP (Avoid 2/hr Trap)',
          why: 'Supabase\'s default email service is capped at only 2 emails per hour project-wide and only sends to project team members! You must connect custom SMTP for real users.',
          do: [
            'Create a free account on Resend (resend.com) or SendGrid and copy your SMTP credentials.',
            'In Supabase Dashboard > Authentication > SMTP Settings: enable Custom SMTP (host: smtp.resend.com, port: 587, user: resend, password: api_key).',
            'In Email Templates > Magic Link / Confirmation: edit template to include `{{ .Token }}` so users receive a simple 6-digit numeric OTP code.',
            'In client code, verify OTP using `supabase.auth.verifyOtp({ email, token, type: \'email\' })`.'
          ],
          prompt: 'Explain the Supabase built-in email rate limit trap (2 emails/hr) for [APP_NAME]. Show me how to configure Resend SMTP and implement 6-digit numeric OTP verification in React Native without fragile deep links.',
          proof: [
            'Supabase dashboard shows Custom SMTP status as active.',
            'Request a code, verify it, and test expired and incorrect codes. Confirm the resend UI respects configured limits.'
          ],
          ifStuck: 'Numeric OTP codes avoid mobile browser redirect issues and deep link scheme mismatches entirely.',
          risk: 'Inviting testers without custom SMTP configured: tester #3 will never receive their sign-in email and testing stalls.',
          rollback: 'Verify SMTP credentials using the "Send test email" button in Supabase console.',
          cost: '$0 (Resend free tier allows 3,000 emails per month)',
          xp: 20,
          factCheck: { key: 'supabase-email-rate-limit', url: 'https://supabase.com/docs/guides/auth/auth-smtp', checkedOn: '2026-11-23' },
          source: { url: 'https://supabase.com/docs/guides/auth/auth-smtp', checked: '2026-11-23', versions: ['Resend SMTP', 'Supabase Auth'] }
        },
        {
          id: 's4-step4',
          stage: 4,
          title: 'Build Protected Routes and Sign-Out Navigation',
          why: 'Unauthenticated users must be prevented from seeing private screens, and signing out must instantly clear credentials and reset navigation.',
          do: [
            'Create an `AuthProvider` with React Context exposing `session`, `user`, and `signOut()`.',
            'In `app/_layout.tsx`, use `useSegments()` to redirect unauthenticated users to `/(auth)/login`.',
            'When session is established, redirect to `/(tabs)`.',
            'Add a sign-out button calling `await supabase.auth.signOut()`.'
          ],
          prompt: 'Create an AuthProvider and protected route structure for [APP_NAME] using Expo Router. Redirect unauthenticated users to `/(auth)/login` and logged-in users to `/(tabs)`. Implement clean sign-out handling.',
          proof: [
            'Opening app when logged out displays login screen.',
            'Logging in immediately transitions to main app tabs.',
            'Tapping Sign Out redirects back to login screen.',
            'Relaunching app maintains active session without flickering login screen.'
          ],
          ifStuck: 'Use `useRootNavigationState().key` to ensure Expo Router navigation is mounted before executing `router.replace()`.',
          risk: 'Executing router redirects before layout mounts leads to unhandled navigation runtime exceptions.',
          rollback: 'Ensure route transitions are wrapped inside `useEffect` watching `session` and `segments`.',
          cost: '$0',
          xp: 20,
          factCheck: { key: 'expo-router-protected-routes', url: 'https://docs.expo.dev/router/reference/authentication', checkedOn: '2026-11-23' },
          source: { url: 'https://docs.expo.dev/router/reference/authentication', checked: '2026-11-23', versions: ['Expo Router v4/v5'] }
        }
      ],
      boss: {
        question: 'What happens if you launch your app with the default Supabase email provider instead of setting up custom SMTP?',
        options: [
          'Email verification will work normally for up to 10,000 sign-ups per day.',
          'The default provider is strictly limited to 2 emails per hour project-wide and delivers ONLY to project team members, causing all external user sign-ups to immediately fail.',
          'Google Play Console will automatically provide an SMTP relay server for your app.',
          'Supabase will charge $0.50 for every email sent.'
        ],
        answer: 1
      }
    },

    // ── STAGE 5: Database and access rules (RLS) ───────────────────────────
    {
      id: 5,
      title: 'Database and access rules (RLS)',
      desc: 'Enforce high-performance Row Level Security with (select auth.uid()), configure security_invoker on views, and pass the 2-user test.',
      steps: [
        {
          id: 's5-step1',
          stage: 5,
          title: 'Verify Row Level Security is Enabled on All Tables',
          why: 'Creating a table in Supabase without enabling RLS leaves it open to public reads, writes, and deletions by anyone holding your publishable key.',
          do: [
            'Query table security in SQL editor: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = \'public\';`.',
            'Ensure every table has `rowsecurity = true`.',
            'For any unconfigured table, run: `ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;`.'
          ],
          prompt: 'Audit all tables in [APP_NAME] Supabase database schema to verify that Row Level Security is enabled on every single table without exception.',
          proof: [
            'Query `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = \'public\';` returns true for all rows.',
            'Table Editor displays padlock badge next to every table name.'
          ],
          ifStuck: 'When RLS is enabled with zero policies, client queries safely return empty results (`data: []`) rather than exposing private data.',
          risk: 'Forgetting RLS on newly created tables exposes data to public scrapers.',
          rollback: 'Run `ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;` immediately.',
          cost: '$0',
          xp: 20,
          factCheck: { key: 'supabase-rls-enabled-check', url: 'https://supabase.com/docs/guides/database/postgres/row-level-security', checkedOn: '2026-11-23' },
          source: { url: 'https://supabase.com/docs/guides/database/postgres/row-level-security', checked: '2026-11-23', versions: ['PostgreSQL 15+'] }
        },
        {
          id: 's5-step2',
          stage: 5,
          title: 'Write High-Performance Policies with (select auth.uid())',
          why: 'Calling `auth.uid()` directly forces Postgres to re-run the function for every row evaluated. Wrapping it in `(select auth.uid())` allows Postgres to cache the value once per statement, speeding queries up by 10x-100x.',
          do: [
            'Create SELECT policy: `CREATE POLICY "Users view own rows" ON items FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);`.',
            'Create INSERT policy: `CREATE POLICY "Users insert own rows" ON items FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);`.',
            'Create UPDATE policy: `CREATE POLICY "Users update own rows" ON items FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);`.',
            'Create DELETE policy: `CREATE POLICY "Users delete own rows" ON items FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);`.',
            'Add index on foreign key: `CREATE INDEX idx_items_user_id ON items(user_id);`.'
          ],
          prompt: 'Write production-grade RLS policies for [APP_NAME] entity tables. Explicitly specify `TO authenticated`, wrap `(select auth.uid())`, and include indexes on `user_id` to prevent query bottlenecks.',
          proof: [
            'Policies are active and listed under Authentication > Policies.',
            'Index `idx_items_user_id` exists on the table.'
          ],
          ifStuck: 'Always specify `TO authenticated` so Postgres skips policy evaluation completely for anonymous requests.',
          risk: 'Missing indexes on `user_id` causes query timeouts as the database grows.',
          rollback: 'Drop and re-create the policy with `(select auth.uid())` optimization.',
          cost: '$0',
          xp: 20,
          factCheck: { key: 'supabase-rls-performance', url: 'https://supabase.com/docs/guides/database/postgres/row-level-security-performance', checkedOn: '2026-11-23' },
          source: { url: 'https://supabase.com/docs/guides/database/postgres/row-level-security-performance', checked: '2026-11-23', versions: ['Postgres RLS Optimization'] }
        },
        {
          id: 's5-step3',
          stage: 5,
          title: 'Add security_invoker = true to All Database Views',
          why: 'In Postgres, views bypass Row Level Security by default and execute with the permissions of the view creator unless `security_invoker = true` is explicitly specified.',
          do: [
            'Check for any database views in your schema.',
            'Define all views with `WITH (security_invoker = true)`: e.g. `CREATE OR REPLACE VIEW user_summary WITH (security_invoker = true) AS SELECT ...;`.',
            'Verify query behavior under authenticated role.'
          ],
          prompt: 'Inspect my database schema for [APP_NAME] to ensure any SQL views are explicitly defined with `WITH (security_invoker = true)` to respect the underlying table RLS policies.',
          proof: [
            'All view DDL statements include `WITH (security_invoker = true)`.',
            'Querying views returns only rows that the querying user is permitted to see.'
          ],
          ifStuck: 'In Postgres 15+, `security_invoker = true` ensures that view queries evaluate Row Level Security as the active querying user rather than the view owner.',
          risk: 'Creating views without this parameter creates a critical security hole where private user rows leak to anyone querying the view.',
          rollback: 'Run `ALTER VIEW [view_name] SET (security_invoker = true);`.',
          cost: '$0',
          xp: 20,
          factCheck: { key: 'postgres-security-invoker', url: 'https://supabase.com/docs/guides/database/postgres/row-level-security', checkedOn: '2026-11-23' },
          source: { url: 'https://supabase.com/docs/guides/database/postgres/row-level-security', checked: '2026-11-23', versions: ['PostgreSQL 15+'] }
        },
        {
          id: 's5-step4',
          stage: 5,
          title: 'Execute the 2-User Security Gate Test',
          why: 'The only reliable proof that your data access rules work is verifying that User A cannot read, edit, or delete records belonging to User B.',
          do: [
            'Register two test accounts: `userA@test.com` and `userB@test.com`.',
            'Log in as User A on your phone, insert a test item named "Secret A Item". Record its ID.',
            'Log in as User B on another browser window.',
            'As User B, query all items: confirm "Secret A Item" does NOT appear.',
            'As User B, attempt direct query by ID: `supabase.from(\'items\').select().eq(\'id\', itemA_id)`: confirm data is empty (`[]`).',
            'As User B, attempt to delete item A: confirm error or 0 rows modified.'
          ],
          prompt: 'Provide a test script or checklist for [APP_NAME] to execute the 2-User security test: sign in User A, insert record, sign in User B, attempt to read and mutate User A\'s record, and verify rejection.',
          proof: [
            'User B cannot see User A\'s records in lists.',
            'Direct fetch of User A\'s record ID by User B returns empty array `data: []`.',
            'Direct update or delete of User A\'s record ID by User B fails with permission denied or 0 modified rows.'
          ],
          ifStuck: 'If User B can see User A\'s data, check if your policy has `USING (true)` or if client code is initialized with a secret/service key.',
          risk: 'Shipping an application where users can view or tamper with other users\' personal information.',
          rollback: 'Re-verify and fix RLS policies in Stage 5 Step 2 before submitting app to closed testing.',
          cost: '$0',
          xp: 20,
          factCheck: { key: 'rls-two-user-test', url: 'https://supabase.com/docs/guides/database/postgres/row-level-security', checkedOn: '2026-11-23' },
          source: { url: 'https://supabase.com/docs/guides/database/postgres/row-level-security', checked: '2026-11-23', versions: ['Security Verification'] }
        }
      ],
      boss: {
        question: 'Why is wrapping `auth.uid()` in `(select auth.uid())` inside Supabase Row Level Security policies considered an essential performance rule?',
        options: [
          'Postgres evaluates `auth.uid()` only once per SQL statement and caches the value, avoiding calling the function thousands of times for every row examined in the table.',
          'It changes the return type from a UUID to a string so JavaScript can read it.',
          'It is required by the React Native bundler to compile without warnings.',
          'Without it, Supabase databases automatically shut down after 24 hours.'
        ],
        answer: 0
      }
    },

    // Stages 6–12: documentation reviewed 2026-11-23; app/device proofs must be performed by the builder.
    {
      "id": 6,
      "title": "Core Screens",
      "desc": "Build the main journey with real data, recoverable forms, and accessible controls.",
      "steps": [
        {
          "id": "s6-step1",
          "stage": 6,
          "title": "Map the core journey and navigation",
          "why": "A small route map keeps the first release usable. Every screen needs a safe way forward and back.",
          "do": [
            "Write the home → list → detail → create/edit route map for your main entity.",
            "Create routes using the existing app or src/app directory; use Link or router.push for navigation.",
            "Open a detail URL directly, then test Android Back and a missing record."
          ],
          "prompt": "Map and implement the core routes for [APP_NAME] using the existing Expo Router structure. Preserve authentication. Handle invalid IDs and missing records with a safe return to the list.",
          "proof": [
            "Every core route opens without a blank screen.",
            "Android Back returns safely; a missing record offers a route home."
          ],
          "ifStuck": "Paste the route tree and error into the AI; ask it to explain the mismatch before changing files.",
          "risk": "Renaming routes can break existing links.",
          "rollback": "Save a Git checkpoint before changing routes; revert that change if navigation breaks.",
          "cost": "$0 locally.",
          "xp": 20,
          "factCheck": {
            "key": "s6-step1",
            "url": "https://docs.expo.dev/router/basics/navigation/",
            "checkedOn": "2026-11-23"
          },
          "source": {
            "url": "https://docs.expo.dev/router/basics/navigation/",
            "checked": "2026-11-23",
            "versions": [
              "Expo SDK 58 docs",
              "Use versions from your app lockfile; not device-tested here"
            ]
          }
        },
        {
          "id": "s6-step2",
          "stage": 6,
          "title": "Load a bounded list and a real detail screen",
          "why": "Lists must distinguish no records from failed loading. Small pages avoid downloading the whole database.",
          "do": [
            "Query only needed columns with select(); use a stable order and bounded range for pagination.",
            "Show loading, empty, success, and error with Retry; fetch details by record ID.",
            "Turn off connectivity and confirm a clear message replaces the spinner."
          ],
          "prompt": "Build the main list and detail screens for [APP_NAME] with Supabase, explicit loading/empty/error/success states, bounded pagination, a request timeout, and safe Retry. Keep RLS enabled.",
          "proof": [
            "An empty account sees a create action.",
            "More records load without duplicates; a failed request shows Retry.",
            "Details match the selected record."
          ],
          "ifStuck": "Ask the AI to inspect the query error and session without logging tokens. Empty data may mean RLS denied access.",
          "risk": "Unbounded reads slow the app and increase data transfer.",
          "rollback": "Revert the query change; keep access policies intact.",
          "cost": "Uses database and network quotas: https://supabase.com/pricing",
          "xp": 20,
          "factCheck": {
            "key": "s6-step2",
            "url": "https://supabase.com/docs/reference/javascript/select",
            "checkedOn": "2026-11-23"
          },
          "source": {
            "url": "https://supabase.com/docs/reference/javascript/select",
            "checked": "2026-11-23",
            "versions": [
              "supabase-js 2.x docs",
              "Use versions from your app lockfile; not device-tested here"
            ]
          }
        },
        {
          "id": "s6-step3",
          "stage": 6,
          "title": "Create, edit, and delete without losing work",
          "why": "A failed save must keep the draft. A repeated tap must not create duplicate records.",
          "do": [
            "Validate required fields, length, and types in the UI and enforce database constraints.",
            "Use a stable operation/record UUID for create retries; disable Save while pending. Check error and reconcile by ID after a timeout.",
            "Update/delete only the selected ID; confirm deletion. Preserve drafts on failure and check the stored result after relaunch."
          ],
          "prompt": "Implement create/edit/delete for [APP_NAME] using existing tables. Keep drafts on error, filter mutations by ID, enforce ownership with RLS, and reconcile uncertain creates by a stable UUID before retrying. Add delete confirmation.",
          "proof": [
            "A double tap or uncertain retry leaves one record.",
            "Saved edits survive relaunch; cancelled deletion changes nothing.",
            "Invalid input stays visible with a useful message."
          ],
          "ifStuck": "Paste the error and redacted payload. Ask whether validation, the SELECT policy for returned rows, or connectivity caused it.",
          "risk": "Timeout does not prove the server rejected a write.",
          "rollback": "Revert UI changes; remove only identified test records in development.",
          "cost": "Uses existing Supabase quotas.",
          "xp": 20,
          "factCheck": {
            "key": "s6-step3",
            "url": "https://supabase.com/docs/reference/javascript/insert",
            "checkedOn": "2026-11-23"
          },
          "source": {
            "url": "https://supabase.com/docs/reference/javascript/insert",
            "checked": "2026-11-23",
            "versions": [
              "supabase-js 2.x docs",
              "Use versions from your app lockfile; not device-tested here"
            ],
            "additionalUrls": [
              "https://supabase.com/docs/reference/javascript/update",
              "https://supabase.com/docs/reference/javascript/delete"
            ]
          }
        },
        {
          "id": "s6-step4",
          "stage": 6,
          "title": "Make the journey usable with TalkBack and large text",
          "why": "Labels and readable layouts help people finish the same journey using different input methods.",
          "do": [
            "Give icon controls accessible labels, roles, and state. Label form fields and errors.",
            "Enable Android TalkBack and complete the core journey without relying on colour alone.",
            "Increase system font size; check scrolling, keyboard visibility, and reachable touch controls on a small phone."
          ],
          "prompt": "Audit the core screens of [APP_NAME] for React Native accessibility. Add meaningful labels, roles, states, and readable errors. Preserve font scaling and ensure the keyboard does not hide Save.",
          "proof": [
            "TalkBack announces each field and action meaningfully.",
            "Large text stays readable and primary actions remain reachable."
          ],
          "ifStuck": "Describe the failing TalkBack announcement or clipped screen; ask for a targeted layout fix.",
          "risk": "Fixed-height text containers can hide essential instructions.",
          "rollback": "Revert the specific layout change and repeat the accessibility check.",
          "cost": "$0 with Android accessibility tools.",
          "xp": 20,
          "factCheck": {
            "key": "s6-step4",
            "url": "https://reactnative.dev/docs/accessibility",
            "checkedOn": "2026-11-23"
          },
          "source": {
            "url": "https://reactnative.dev/docs/accessibility",
            "checked": "2026-11-23",
            "versions": [
              "React Native 0.88 documentation; verify installed version"
            ]
          }
        }
      ],
      "boss": {
        "question": "The Save request times out. What should the app do before retrying?",
        "options": [
          "Immediately insert another record.",
          "Keep the draft and reconcile the original operation ID before retrying.",
          "Show success without checking.",
          "Disable access rules."
        ],
        "answer": 1
      }
    },

    {
      "id": 7,
      "title": "Optional Modules",
      "desc": "Record skip decisions, or prove payments, push, and offline behaviour before relying on them.",
      "steps": [
        {
          "id": "s7-step1",
          "stage": 7,
          "title": "Choose modules and the correct payment route",
          "why": "Optional features add failure modes and cost. Decide whether each is needed before installing anything.",
          "do": [
            "Record include/skip and a reason for payments, push, and offline.",
            "For payments, classify what is sold: digital content/features or physical goods/services. Read the current Play payments policy and applicable regional programmes.",
            "For each skipped module, record why and check the app makes no promise to provide it. For later cards, either perform the work or record the matching skip decision."
          ],
          "prompt": "For [APP_NAME], write an include/skip decision for payments, push, and offline. Classify any purchase under current Google Play payments policy. Do not add packages until the module is selected.",
          "proof": [
            "All three module decisions have reasons.",
            "Payment choice cites current policy or the app has no purchase flow."
          ],
          "ifStuck": "Describe the product and country programme; ask the AI to locate the relevant policy rather than assume an external checkout is allowed.",
          "risk": "Using an unsuitable payment flow can block Play approval.",
          "rollback": "Remove the optional flow before release and update the scope.",
          "cost": "Check provider pricing and Play service fees before enabling payments.",
          "xp": 20,
          "factCheck": {
            "key": "s7-step1",
            "url": "https://support.google.com/googleplay/android-developer/answer/9858738",
            "checkedOn": "2026-11-23"
          },
          "source": {
            "url": "https://support.google.com/googleplay/android-developer/answer/9858738",
            "checked": "2026-11-23",
            "versions": [
              "Google Play payments policy checked 2026-11-23"
            ]
          }
        },
        {
          "id": "s7-step2",
          "stage": 7,
          "title": "Prove a digital purchase and restore in a test track",
          "why": "Digital entitlements need verified purchase state. A success screen alone is not proof of payment.",
          "do": [
            "If payments are skipped, record that decision and verify no paid controls remain. Otherwise choose a documented IAP library and create a development build.",
            "Configure test products and licence testers in Play Console; validate entitlements through a trusted backend/provider.",
            "Test purchase, cancellation, pending state, restore, and refund/revocation; never grant access from a client boolean."
          ],
          "prompt": "For [APP_NAME], follow the payment decision. If included, integrate a supported Expo IAP library in a development build and trusted entitlement verification. Use test purchases; test pending, cancellation, restore, and revocation. Do not run a real charge.",
          "proof": [
            "A recorded skip matches the app, OR test purchases grant only verified access.",
            "If included, cancellation grants nothing and restore recovers the correct account entitlement."
          ],
          "ifStuck": "Paste the test-track/product configuration and redacted error; ask whether build, tester, or entitlement setup is wrong.",
          "risk": "Real purchases and duplicate webhook handling can cause financial mistakes.",
          "rollback": "Disable new purchases; preserve transaction records and existing entitlements while fixing the flow.",
          "cost": "Provider and store fees vary; check the chosen provider and Play pricing.",
          "xp": 20,
          "factCheck": {
            "key": "s7-step2",
            "url": "https://docs.expo.dev/guides/in-app-purchases/",
            "checkedOn": "2026-11-23"
          },
          "source": {
            "url": "https://docs.expo.dev/guides/in-app-purchases/",
            "checked": "2026-11-23",
            "versions": [
              "Expo SDK 58 docs",
              "Use versions from your app lockfile; not device-tested here"
            ]
          }
        },
        {
          "id": "s7-step3",
          "stage": 7,
          "title": "Send push with permission and safe destinations",
          "why": "Notifications require credentials and a user choice. Their contents can appear on a locked phone.",
          "do": [
            "If skipped, record the decision and verify no notification promise remains. Otherwise install compatible expo-notifications, expo-device, and expo-constants packages.",
            "Configure Android FCM v1 credentials and the notifications plugin; rebuild and test on a physical phone. Request permission and associate the token with the signed-in user securely.",
            "Send a test using the Expo notifications tool; test denied permission, sign-out/token reassignment, and tapping into a protected route."
          ],
          "prompt": "Implement push for [APP_NAME] only if selected. Follow Expo setup, configure FCM v1, use a physical Android development build, handle denied permission, and scope stored tokens by user. Keep private content out of notifications.",
          "proof": [
            "Skip is recorded, OR a test push arrives on the phone.",
            "If included, denied permission and sign-out do not break the app or notify the wrong account."
          ],
          "ifStuck": "Paste the redacted receipt/error and build information; ask the AI to check credentials, permission, projectId, and token ownership.",
          "risk": "A reused token can send another account private alerts.",
          "rollback": "Disable sending and revoke stale associations while retaining the permission choice.",
          "cost": "Check Expo and backend quotas: https://expo.dev/pricing",
          "xp": 20,
          "factCheck": {
            "key": "s7-step3",
            "url": "https://docs.expo.dev/push-notifications/push-notifications-setup/",
            "checkedOn": "2026-11-23"
          },
          "source": {
            "url": "https://docs.expo.dev/push-notifications/push-notifications-setup/",
            "checked": "2026-11-23",
            "versions": [
              "Expo SDK 58 docs",
              "Use versions from your app lockfile; not device-tested here"
            ]
          }
        },
        {
          "id": "s7-step4",
          "stage": 7,
          "title": "Choose a safe offline strategy",
          "why": "SQLite stores local data; it does not provide automatic server synchronization.",
          "do": [
            "If skipped, record the decision and verify an offline message appears. Otherwise start with a read-only cache using npx expo install expo-sqlite.",
            "Use bound parameters for user input; separate cached data by user and clear private data on sign-out. Mark cached data as stale.",
            "Keep writes online-only unless an explicit queue, operation IDs, conflict rule, and retry limits have been implemented and tested. Test airplane mode and reconnect."
          ],
          "prompt": "For [APP_NAME], implement the selected offline strategy. Prefer read-only SQLite caching with bound parameters, account isolation, stale indicators, and online-only writes. Do not claim automatic Supabase sync.",
          "proof": [
            "Skip is recorded, OR cached content opens with a stale/offline label.",
            "Switching accounts never reveals the previous user cache.",
            "Reconnect does not duplicate writes."
          ],
          "ifStuck": "Provide the reproduction and redacted local schema; ask whether stale cache, account scope, or a queued write caused it.",
          "risk": "Local caches can leak data or overwrite newer server edits.",
          "rollback": "Disable offline writes and clear only disposable cached data, preserving unsent drafts for recovery.",
          "cost": "$0 local storage; server sync uses backend quotas.",
          "xp": 20,
          "factCheck": {
            "key": "s7-step4",
            "url": "https://docs.expo.dev/versions/latest/sdk/sqlite/",
            "checkedOn": "2026-11-23"
          },
          "source": {
            "url": "https://docs.expo.dev/versions/latest/sdk/sqlite/",
            "checked": "2026-11-23",
            "versions": [
              "Expo SDK 58 docs",
              "Use versions from your app lockfile; not device-tested here"
            ]
          }
        }
      ],
      "boss": {
        "question": "Can a SQLite cache automatically synchronize itself with Supabase?",
        "options": [
          "Yes, installing the package enables sync.",
          "Yes, when the phone restarts.",
          "No. Choose read-only caching or explicitly implement and test synchronization.",
          "Only when RLS is disabled."
        ],
        "answer": 2
      }
    },

    {
      "id": 8,
      "title": "Testing",
      "desc": "Test business rules, routes, real device behaviour, and an installed release candidate.",
      "steps": [
        {
          "id": "s8-step1",
          "stage": 8,
          "title": "Add focused unit and component checks",
          "why": "Automated checks catch regressions before a tester finds them.",
          "do": [
            "Use Expo unit-testing documentation to install jest-expo, Jest, and compatible testing libraries as dev dependencies.",
            "Use the jest-expo preset; place tests outside the route directory.",
            "Test required fields, pending/error/success rendering, and a retry using representative mocked failures. Run npx jest --runInBand --watch=false."
          ],
          "prompt": "Set up compatible jest-expo tests for [APP_NAME]. Cover validation, loading/error/retry, and duplicate-submit prevention through user-visible behaviour. Use the installed package versions and run once without watch mode.",
          "proof": [
            "The focused tests pass in a one-shot run.",
            "Deliberately breaking the validation assertion causes a failure before it is restored."
          ],
          "ifStuck": "Paste the first test failure and package versions; ask for the smallest compatible configuration fix.",
          "risk": "Mocks can hide real SDK and server failures.",
          "rollback": "Revert test configuration changes; retain meaningful reproductions.",
          "cost": "$0 locally; CI providers may charge for execution.",
          "xp": 20,
          "factCheck": {
            "key": "s8-step1",
            "url": "https://docs.expo.dev/develop/unit-testing/",
            "checkedOn": "2026-11-23"
          },
          "source": {
            "url": "https://docs.expo.dev/develop/unit-testing/",
            "checked": "2026-11-23",
            "versions": [
              "Expo SDK 58 docs",
              "Use versions from your app lockfile; not device-tested here"
            ]
          }
        },
        {
          "id": "s8-step2",
          "stage": 8,
          "title": "Check route and session transitions",
          "why": "Navigation errors often appear after deep links, expired sessions, or sign-out.",
          "do": [
            "Use expo-router/testing-library with a compatible React Native Testing Library. Keep fixtures and tests outside app/.",
            "Test direct private links while logged out, sign-in navigation, sign-out, and a missing record.",
            "Await asynchronous navigation helpers before assertions; check visible destination and safe errors."
          ],
          "prompt": "Write Expo Router integration tests for [APP_NAME] covering logged-out deep links, sign-in, sign-out, and missing records. Await router actions and keep tests outside the route tree.",
          "proof": [
            "Tests reach the expected destinations after session changes.",
            "A private deep link while logged out reveals no private content."
          ],
          "ifStuck": "Paste route fixtures and the failing assertion; ask whether async navigation or the auth-loading state is missing.",
          "risk": "A navigation guard is not a substitute for backend authorization.",
          "rollback": "Revert changed fixtures/configuration and keep backend policies enabled.",
          "cost": "$0 locally.",
          "xp": 20,
          "factCheck": {
            "key": "s8-step2",
            "url": "https://docs.expo.dev/router/reference/testing/",
            "checkedOn": "2026-11-23"
          },
          "source": {
            "url": "https://docs.expo.dev/router/reference/testing/",
            "checked": "2026-11-23",
            "versions": [
              "Expo SDK 58 docs",
              "Use versions from your app lockfile; not device-tested here"
            ]
          }
        },
        {
          "id": "s8-step3",
          "stage": 8,
          "title": "Run a real Android journey with Maestro",
          "why": "An installed-app test checks behaviour beyond mocked components.",
          "do": [
            "Follow the Expo Maestro workflow guide; create an Android e2e-test build profile and flows under .maestro.",
            "Use a development backend and dedicated test accounts. Cover sign-in, create, edit, delete confirmation, and sign-out.",
            "Run the documented workflow with the app package ID and retain its result link; investigate failed steps rather than removing assertions."
          ],
          "prompt": "Prepare Android Maestro flows for [APP_NAME] using Expo Workflows and the existing app ID. Use only test accounts and development data. Cover the core journey and report the actual run result; explain any cloud charges before execution.",
          "proof": [
            "The workflow installs the intended Android build and passes the core journey.",
            "The run link identifies the tested build; no real user data was modified."
          ],
          "ifStuck": "Paste the failed job and Maestro step, without credentials; ask whether the app or the test expectation is wrong.",
          "risk": "Automated tests against production can create or delete real records.",
          "rollback": "Stop the run and remove only known test data from development.",
          "cost": "Expo Workflows/build usage: https://expo.dev/pricing",
          "xp": 20,
          "factCheck": {
            "key": "s8-step3",
            "url": "https://docs.expo.dev/eas/workflows/examples/e2e-tests",
            "checkedOn": "2026-11-23"
          },
          "source": {
            "url": "https://docs.expo.dev/eas/workflows/examples/e2e-tests",
            "checked": "2026-11-23",
            "versions": [
              "Expo SDK 58 docs",
              "Use versions from your app lockfile; not device-tested here"
            ]
          }
        },
        {
          "id": "s8-step4",
          "stage": 8,
          "title": "Exercise failure cases on the release candidate",
          "why": "JavaScript tests cannot prove every native interaction. A release build can behave differently from development.",
          "do": [
            "Install a development or preview APK on a physical phone and confirm it uses your test backend. Repeat applicable checks on the Play-installed candidate after Stage 10 upload.",
            "Test airplane mode during Save, reconnect, double tap, cold start, expired session, denied permission, Android Back, and large text.",
            "Repeat the Stage 5 two-user isolation checks against the candidate backend; record build number, expected result, actual result, and any blocker."
          ],
          "prompt": "Create a release-candidate test checklist for [APP_NAME] with network interruption, uncertain saves, session expiry, permissions, Back navigation, and two-user data isolation. Block release on data leaks, lost work, and duplicate writes.",
          "proof": [
            "Each case has a recorded result tied to a build number.",
            "No release-blocking failure remains; affected cases were rerun after fixes."
          ],
          "ifStuck": "Give the AI exact reproduction steps, build number, expected result, and actual result; request one targeted fix with a regression test.",
          "risk": "A green unit suite can miss native crashes and real access failures.",
          "rollback": "Keep the candidate on its test track until failures are fixed.",
          "cost": "$0 for manual testing; devices and network usage may cost.",
          "xp": 20,
          "factCheck": {
            "key": "s8-step4",
            "url": "https://reactnative.dev/docs/testing-overview",
            "checkedOn": "2026-11-23"
          },
          "source": {
            "url": "https://reactnative.dev/docs/testing-overview",
            "checked": "2026-11-23",
            "versions": [
              "React Native 0.88 testing documentation"
            ]
          }
        }
      ],
      "boss": {
        "question": "Do passing mocked JavaScript tests prove the Android release works?",
        "options": [
          "Yes, native behaviour is identical.",
          "Yes, screenshots prove everything.",
          "No. Test the installed build, native integrations, network failures, and user isolation too.",
          "Only if every test is a snapshot."
        ],
        "answer": 2
      }
    },

    {
      "id": 9,
      "title": "Security",
      "desc": "Keep secrets off devices, verify server access, and prove users can request account deletion.",
      "steps": [
        {
          "id": "s9-step1",
          "stage": 9,
          "title": "Check the shipped bundle and repository for secrets",
          "why": "Environment variables used by client JavaScript can become public bundle contents.",
          "do": [
            "Review tracked files and history for secrets without printing values. Allow only the project URL and publishable key in the mobile client.",
            "Inspect build configuration and generated client output for privileged credentials. EXPO_PUBLIC_ values are readable in the bundle.",
            "If a secret leaked, revoke/rotate it first, then remove it from files/history using a reviewed recovery plan."
          ],
          "prompt": "Audit [APP_NAME] for credentials in tracked files, history, client configuration, and bundle output. Report locations and credential types only. Keep Supabase secret/service_role keys server-side and explain rotation if exposed.",
          "proof": [
            "No privileged credential is shipped or tracked.",
            "Any discovered exposed secret has been revoked, not merely deleted from a file."
          ],
          "ifStuck": "Ask the AI to distinguish a publishable identifier from a privileged secret without showing either value.",
          "risk": "Moving a secret to a client environment variable does not protect it.",
          "rollback": "Revert client wiring, revoke exposed credentials, and rebuild with only public configuration.",
          "cost": "$0 for review.",
          "xp": 20,
          "factCheck": {
            "key": "s9-step1",
            "url": "https://docs.expo.dev/guides/environment-variables/",
            "checkedOn": "2026-11-23"
          },
          "source": {
            "url": "https://docs.expo.dev/guides/environment-variables/",
            "checked": "2026-11-23",
            "versions": [
              "Expo SDK 58 docs",
              "Use versions from your app lockfile; not device-tested here"
            ],
            "additionalUrls": [
              "https://supabase.com/docs/guides/getting-started/api-keys"
            ]
          }
        },
        {
          "id": "s9-step2",
          "stage": 9,
          "title": "Authorize every privileged server action",
          "why": "A valid login identifies the caller; it does not grant ownership of every record.",
          "do": [
            "List Edge Functions and privileged operations, including payment and deletion handlers.",
            "Verify the caller token server-side; derive identity from verified claims and check ownership/role plus input limits. Use the user-scoped client where possible.",
            "Try unauthenticated, wrong-user, and malformed requests in development. Keep signed-webhook verification separate from user authentication."
          ],
          "prompt": "Review [APP_NAME] server handlers for verified authentication, authorization, validation, bounded work, and safe errors. Test unauthorized callers. Never disable JWT verification just to remove a 401; verify webhook signatures for provider callbacks.",
          "proof": [
            "Unsigned/wrong-user requests cannot read or change protected resources.",
            "Malformed requests fail safely without internal details."
          ],
          "ifStuck": "Paste a redacted request and status; ask which verification failed before changing authorization settings.",
          "risk": "Admin clients bypass RLS and require explicit authorization.",
          "rollback": "Disable the affected feature while restoring the last secure handler; rotate leaked credentials.",
          "cost": "Function usage may incur charges: https://supabase.com/pricing",
          "xp": 20,
          "factCheck": {
            "key": "s9-step2",
            "url": "https://supabase.com/docs/guides/functions/auth",
            "checkedOn": "2026-11-23"
          },
          "source": {
            "url": "https://supabase.com/docs/guides/functions/auth",
            "checked": "2026-11-23",
            "versions": [
              "supabase-js 2.x docs",
              "Use versions from your app lockfile; not device-tested here"
            ]
          }
        },
        {
          "id": "s9-step3",
          "stage": 9,
          "title": "Repeat the access audit on the release backend",
          "why": "New tables, views, buckets, and functions can reopen gaps after the original access test.",
          "do": [
            "Run Supabase Security Advisor and review each relevant finding. Check exposed tables, views, storage policies, and function privileges.",
            "Use ordinary user sessions for A and B, plus a signed-out client; test reads and mutations by guessed/direct IDs.",
            "Record redacted evidence and fix failures while retaining RLS. Confirm account recovery and team MFA settings."
          ],
          "prompt": "Audit the release backend for [APP_NAME] using Supabase production security guidance. Repeat user A/user B/signed-out reads and mutations across exposed resources. Record evidence and leave RLS enabled.",
          "proof": [
            "User B and signed-out clients cannot access A private resources.",
            "Relevant Advisor findings are fixed or have a documented, reviewed explanation."
          ],
          "ifStuck": "Ask the AI to inspect grants, policies, and privileged clients using redacted results; never test with a secret key as the ordinary user.",
          "risk": "An enabled RLS flag alone does not prove policies are correct.",
          "rollback": "Block release and restore the secure policies through a reviewed migration.",
          "cost": "$0 for review; backend usage remains subject to quotas.",
          "xp": 20,
          "factCheck": {
            "key": "s9-step3",
            "url": "https://supabase.com/docs/guides/security/production-checklist",
            "checkedOn": "2026-11-23"
          },
          "source": {
            "url": "https://supabase.com/docs/guides/security/production-checklist",
            "checked": "2026-11-23",
            "versions": [
              "supabase-js 2.x docs",
              "Use versions from your app lockfile; not device-tested here"
            ]
          }
        },
        {
          "id": "s9-step4",
          "stage": 9,
          "title": "Prove account deletion in the app and on the web",
          "why": "Apps offering in-app account creation need a way to request account deletion and an accessible web route.",
          "do": [
            "If the app creates accounts, add an in-app request and a functional web request page naming the app/developer.",
            "Authorize deletion server-side and explain what is deleted, retained, and when. Verify storage/data cleanup as well as the Auth account.",
            "Use a disposable account to complete both paths; ensure the web page does not require reinstalling the app."
          ],
          "prompt": "Design and test account deletion for [APP_NAME] under current Google Play requirements. Include in-app and web request paths, verified identity, associated-data cleanup, retention disclosures, and safe confirmation. If not applicable, document why.",
          "proof": [
            "A disposable account can request deletion via both required paths, OR applicability is documented.",
            "The declared cleanup/retention outcome matches the test evidence."
          ],
          "ifStuck": "Describe the failed request path and redacted result; ask which data owner or authorization check blocked cleanup.",
          "risk": "Deletion is irreversible and may leave orphaned files without a cleanup plan.",
          "rollback": "Test only disposable accounts; disable a broken deletion handler and use a documented support request path while fixing it.",
          "cost": "Hosting/support costs depend on the chosen service.",
          "xp": 20,
          "factCheck": {
            "key": "s9-step4",
            "url": "https://support.google.com/googleplay/android-developer/answer/13327111",
            "checkedOn": "2026-11-23"
          },
          "source": {
            "url": "https://support.google.com/googleplay/android-developer/answer/13327111",
            "checked": "2026-11-23",
            "versions": [
              "Google Play account deletion policy checked 2026-11-23"
            ]
          }
        }
      ],
      "boss": {
        "question": "A hidden admin button calls an endpoint using a secret key. Is hiding it sufficient?",
        "options": [
          "Yes, users cannot tap it.",
          "No. Authenticate and authorize every server request; secrets must stay on the server.",
          "Yes, if the key is in an EXPO_PUBLIC variable.",
          "Yes, if the endpoint name is unusual."
        ],
        "answer": 1
      }
    },

    {
      "id": 10,
      "title": "Build & Release",
      "desc": "Create a signed bundle, complete Play declarations, run the applicable test, and pass the launch gate.",
      "steps": [
        {
          "id": "s10-step1",
          "stage": 10,
          "title": "Build a signed production Android bundle",
          "why": "The package name, signing setup, and version code identify the app and its updates.",
          "do": [
            "Save a Git checkpoint. Confirm android.package, production backend configuration, and an increasing Android versionCode. Verify the installed SDK supports the required target; API 36 is the current phone-app submission requirement.",
            "Configure EAS with eas build:configure and production settings. Review credentials using eas credentials; protect keystore access and recovery material.",
            "Run eas build --platform android --profile production. Inspect the resulting AAB and target API in Play Console."
          ],
          "prompt": "Prepare [APP_NAME] for a signed EAS Android production AAB. Verify package ID, production environment, versionCode, target API against current Play policy, and signing recovery. Explain usage costs before starting a cloud build.",
          "proof": [
            "EAS reports a successful production AAB.",
            "Play accepts the package/signature/versionCode/target API; the artifact uses the intended backend."
          ],
          "ifStuck": "Paste the failing build phase and redacted logs; ask for the root cause before changing package or signing identity.",
          "risk": "Losing signing access or changing package identity can prevent updates.",
          "rollback": "Keep the last accepted artifact and protected signing recovery; build a corrected candidate with a higher versionCode.",
          "cost": "Build quotas/plans: https://expo.dev/pricing; Play registration is separate.",
          "xp": 20,
          "factCheck": {
            "key": "s10-step1",
            "url": "https://docs.expo.dev/build/setup/",
            "checkedOn": "2026-11-23"
          },
          "source": {
            "url": "https://docs.expo.dev/build/setup/",
            "checked": "2026-11-23",
            "versions": [
              "Expo SDK 58 docs",
              "Use versions from your app lockfile; not device-tested here"
            ],
            "additionalUrls": [
              "https://docs.expo.dev/build-reference/app-versions/",
              "https://support.google.com/googleplay/android-developer/answer/11926878"
            ]
          }
        },
        {
          "id": "s10-step2",
          "stage": 10,
          "title": "Complete store content and accurate data declarations",
          "why": "The listing and privacy statements must match the app and every included SDK.",
          "do": [
            "Inventory collected/shared data, permissions, retention, encryption, and third-party SDK behaviour.",
            "Complete Data safety from that inventory. Publish a working privacy policy and deletion request URL; complete content rating, audience, ads, and reviewer app-access instructions as applicable.",
            "Check listing text and screenshots against the actual release candidate; test all public links."
          ],
          "prompt": "Prepare Play listing and app-content declarations for [APP_NAME] from its actual code, backend, and SDK inventory. Explain any unknown data practice; do not guess Data safety answers. Include reviewer access and working privacy/deletion links.",
          "proof": [
            "Required Play setup tasks are complete and declarations match the candidate.",
            "Privacy/deletion links work and reviewers can reach protected features."
          ],
          "ifStuck": "Name the SDK or unknown data flow; ask the AI to find its official disclosure documentation before answering.",
          "risk": "Incorrect disclosures or inaccessible sign-in can delay review.",
          "rollback": "Correct declarations and links before requesting publication.",
          "cost": "Privacy/support hosting may cost; verify the chosen provider.",
          "xp": 20,
          "factCheck": {
            "key": "s10-step2",
            "url": "https://support.google.com/googleplay/android-developer/answer/10787469",
            "checkedOn": "2026-11-23"
          },
          "source": {
            "url": "https://support.google.com/googleplay/android-developer/answer/10787469",
            "checked": "2026-11-23",
            "versions": [
              "Google Play Data safety guidance checked 2026-11-23"
            ],
            "additionalUrls": [
              "https://support.google.com/googleplay/android-developer/answer/9859152"
            ]
          }
        },
        {
          "id": "s10-step4",
          "stage": 10,
          "title": "Submit to testing and hold the production release",
          "why": "Uploading a bundle does not mean it is live. Prepare the production gate while testing continues.",
          "do": [
            "Use a Play test track first: upload the AAB manually, or use the documented EAS Submit flow with protected service-account access.",
            "Verify the track-installed candidate with sign-in and one core action. Tie its versionCode to Stage 8/9 results. Record closed-test approval after the next step if applicable. Check the candidate backend because the Play track does not change its configuration.",
            "Prepare a production checklist with Stage 11 restore, monitoring, update recovery, and cost-control prerequisites explicitly pending. Hold publication until those checks pass; finish the launch gate in Stage 11."
          ],
          "prompt": "Prepare a test-track submission and held production release for [APP_NAME]. Verify the track-installed candidate. Record Stage 11 operational checks as pending and block production publication until they pass. Require explicit approval before public release.",
          "proof": [
            "The test-track candidate installs and passes sign-in plus one core action.",
            "A versioned production checklist exists with unfinished prerequisites marked blocked; production publication is held."
          ],
          "ifStuck": "Read the exact Play blocking task or review message; submission does not bypass account eligibility.",
          "risk": "Publication exposes the app to real users; setup or submission is not approval.",
          "rollback": "Keep a failing candidate in testing; halt distribution of a faulty update and prepare a corrected higher-version build.",
          "cost": "Submission/build quotas: https://expo.dev/pricing",
          "xp": 20,
          "factCheck": {
            "key": "s10-step4",
            "url": "https://docs.expo.dev/submit/android/",
            "checkedOn": "2026-11-23"
          },
          "source": {
            "url": "https://docs.expo.dev/submit/android/",
            "checked": "2026-11-23",
            "versions": [
              "Expo SDK 58 docs",
              "Use versions from your app lockfile; not device-tested here"
            ],
            "additionalUrls": [
              "https://docs.expo.dev/submit/android-manual/"
            ]
          }
        },
        {
          "id": "s10-step3",
          "stage": 10,
          "title": "Run the closed test that applies to your account",
          "why": "Production access depends on account eligibility and testing evidence, not just elapsed calendar time.",
          "do": [
            "Confirm the testing requirements shown for your Play account. Personal accounts created after November 13, 2023 need at least 12 closed-test opt-ins continuously for the preceding 14 days when applying.",
            "Publish to the closed track, share its opt-in link, and confirm testers can install. Track continuity, real usage feedback, and fixes.",
            "Once eligible, apply for production access with truthful testing evidence. Wait for approval; meeting the minimum does not guarantee acceptance."
          ],
          "prompt": "Plan the applicable closed test for [APP_NAME]. Confirm my account category first. For affected personal accounts, track 12 continuous opt-ins for 14 days, feedback, fixes, and production-access application evidence.",
          "proof": [
            "Console shows the applicable test criteria are met, or documents an exemption.",
            "Production access is approved before public release is attempted."
          ],
          "ifStuck": "Check opt-in continuity and account eligibility in Console; downloads alone do not prove continuous opt-in.",
          "risk": "A tester opting out can reset that tester eligibility window.",
          "rollback": "Keep the app in testing and extend the test while resolving eligibility or engagement gaps.",
          "cost": "Allow at least the required testing period plus review time; tester recruitment costs vary.",
          "xp": 20,
          "factCheck": {
            "key": "s10-step3",
            "url": "https://support.google.com/googleplay/android-developer/answer/14151465",
            "checkedOn": "2026-11-23"
          },
          "source": {
            "url": "https://support.google.com/googleplay/android-developer/answer/14151465",
            "checked": "2026-11-23",
            "versions": [
              "Google Play personal-account testing rules checked 2026-11-23"
            ]
          }
        }
      ],
      "boss": {
        "question": "For a personal Play account created after November 13, 2023, what is required before applying for production access?",
        "options": [
          "Twelve downloads at any time.",
          "An internal test alone.",
          "At least 12 testers opted into closed testing continuously for the preceding 14 days, followed by an application and review.",
          "A successful EAS build automatically publishes the app."
        ],
        "answer": 2
      }
    },

    {
      "id": 11,
      "title": "Run Live",
      "desc": "Prepare these launch prerequisites before publication: crash visibility, safe updates, restore proof, and cost controls.",
      "steps": [
        {
          "id": "s11-step1",
          "stage": 11,
          "title": "Receive a readable crash report",
          "why": "A crash report must identify the release and useful code location without exposing private data.",
          "do": [
            "Follow the Expo Sentry guide and review its setup changes. Keep SENTRY_AUTH_TOKEN in protected build tooling, never client code.",
            "Upload source maps for the build/update; scrub tokens, emails, and sensitive payloads from events.",
            "Trigger a controlled error in a test release, check the mapped stack and release ID, then remove the test trigger. Assign an alert owner."
          ],
          "prompt": "Configure Sentry for [APP_NAME] using current Expo guidance. Protect upload credentials, scrub private data, and prove a controlled test event maps to the correct release. Remove any test crash control before shipping.",
          "proof": [
            "A controlled test event appears with a readable mapped location and release ID.",
            "Event details contain no credentials or private user content."
          ],
          "ifStuck": "Paste redacted event metadata and build/update ID; ask whether the matching source maps were uploaded.",
          "risk": "Crash telemetry can collect personal data if left unreviewed.",
          "rollback": "Disable the faulty integration and revert its configuration while retaining safe local error handling.",
          "cost": "Check chosen monitoring plan plus build usage: https://sentry.io/pricing/",
          "xp": 20,
          "factCheck": {
            "key": "s11-step1",
            "url": "https://docs.expo.dev/guides/using-sentry/",
            "checkedOn": "2026-11-23"
          },
          "source": {
            "url": "https://docs.expo.dev/guides/using-sentry/",
            "checked": "2026-11-23",
            "versions": [
              "Expo SDK 58 docs",
              "Use versions from your app lockfile; not device-tested here"
            ]
          }
        },
        {
          "id": "s11-step2",
          "stage": 11,
          "title": "Rehearse a compatible update and rollback",
          "why": "Over-the-air updates change compatible JavaScript/assets. Native changes require a new binary.",
          "do": [
            "Configure expo-updates, runtime version policy, and separate preview/production channels. Save the known-good build and update IDs.",
            "Publish a harmless preview change using the selected environment; confirm it on an installed compatible build. Changes to native libraries/permissions require a new build and runtime compatibility review.",
            "Rehearse reverting to a known-good compatible update or the embedded update; confirm the result after download/relaunch. Get approval before production update publication."
          ],
          "prompt": "Set up a preview EAS Update rehearsal for [APP_NAME] with explicit channel, environment, and runtime compatibility. Prove one harmless update and rollback. Classify native changes as requiring a new binary; do not publish to production without approval.",
          "proof": [
            "The compatible preview build receives the expected update.",
            "Rollback returns that build to the documented known-good state."
          ],
          "ifStuck": "Provide channel, runtime, build ID, update ID, and redacted logs; ask why this installed binary can or cannot receive it.",
          "risk": "Wrong channel or runtime can send incompatible code or leave users unpatched.",
          "rollback": "Use the rehearsed compatible rollback and verify it on installed devices; native faults need a corrected binary.",
          "cost": "Update quotas and usage: https://expo.dev/pricing",
          "xp": 20,
          "factCheck": {
            "key": "s11-step2",
            "url": "https://docs.expo.dev/eas-update/introduction/",
            "checkedOn": "2026-11-23"
          },
          "source": {
            "url": "https://docs.expo.dev/eas-update/introduction/",
            "checked": "2026-11-23",
            "versions": [
              "Expo SDK 58 docs",
              "Use versions from your app lockfile; not device-tested here"
            ],
            "additionalUrls": [
              "https://docs.expo.dev/eas-update/runtime-versions/",
              "https://docs.expo.dev/eas-update/rollbacks/",
              "https://docs.expo.dev/eas/environment-variables/usage/"
            ]
          }
        },
        {
          "id": "s11-step3",
          "stage": 11,
          "title": "Restore database and files in an isolated rehearsal",
          "why": "A saved backup is useful only when restoration works. Database backups exclude Storage file contents.",
          "do": [
            "Before launch, choose retention and a backup schedule for the plan. Free projects need regular off-site exports; verify managed retention on paid plans.",
            "Back up Storage objects separately and document recovery of configuration, credentials, and external services. Protect backup access.",
            "Restore a known sample into an isolated non-production environment. Verify rows, files, ownership/RLS, sign-in/core journey, elapsed time, and the oldest recoverable data."
          ],
          "prompt": "Write and rehearse the backup/restore runbook for [APP_NAME] in an isolated environment. Include database exports, separate Storage objects, configuration recovery, access checks, recovery time, and acceptable data loss. Never restore over production as a test.",
          "proof": [
            "An isolated restore recovers sample records and file contents.",
            "Recovery time and data-loss window are recorded; access isolation still passes."
          ],
          "ifStuck": "Provide the redacted restore failure and backup type; ask what is missing before attempting another restore.",
          "risk": "Restoring production can overwrite new user work; database-only recovery loses files.",
          "rollback": "Discard only the disposable rehearsal environment after evidence is saved; leave production untouched.",
          "cost": "Backup retention, PITR, and extra environments may cost: https://supabase.com/pricing",
          "xp": 20,
          "factCheck": {
            "key": "s11-step3",
            "url": "https://supabase.com/docs/guides/platform/backups",
            "checkedOn": "2026-11-23"
          },
          "source": {
            "url": "https://supabase.com/docs/guides/platform/backups",
            "checked": "2026-11-23",
            "versions": [
              "supabase-js 2.x docs",
              "Use versions from your app lockfile; not device-tested here"
            ]
          }
        },
        {
          "id": "s11-step4",
          "stage": 11,
          "title": "Set cost controls and an incident owner",
          "why": "Cost controls have limits. Someone needs to notice failures and decide what to pause.",
          "do": [
            "Before launch, review Supabase Cost Control and enable Spend Cap where available. Record excluded items such as compute/PITR and their expected costs.",
            "Review Expo, SMTP, monitoring, and payment provider quotas/alerts separately; set server-side limits on expensive actions.",
            "Write a short incident runbook with owner, support contact, dashboards, budget thresholds, and steps to pause expensive features safely."
          ],
          "prompt": "Prepare an operating budget and incident runbook for [APP_NAME]. Verify Supabase Spend Cap coverage and exclusions, list other provider controls, and assign an owner. Do not describe Spend Cap as a universal budget ceiling or built-in custom alert system.",
          "proof": [
            "Coverage and exclusions are documented and dashboard settings are verified.",
            "The owner can locate failures, pause costly work, and contact users safely."
          ],
          "ifStuck": "Ask the AI to reconcile a redacted usage breakdown with plan/excluded items before changing billing settings.",
          "risk": "Excluded services and third-party providers can still charge.",
          "rollback": "Pause optional costly features and review usage; avoid deleting user data or cancelling essential recovery services.",
          "cost": "Plan/add-on/usage costs vary: https://supabase.com/pricing and https://expo.dev/pricing",
          "xp": 20,
          "factCheck": {
            "key": "s11-step4",
            "url": "https://supabase.com/docs/guides/platform/cost-control",
            "checkedOn": "2026-11-23"
          },
          "source": {
            "url": "https://supabase.com/docs/guides/platform/cost-control",
            "checked": "2026-11-23",
            "versions": [
              "supabase-js 2.x docs",
              "Use versions from your app lockfile; not device-tested here"
            ]
          }
        },
        {
          "id": "s11-step5",
          "stage": 11,
          "title": "Complete the launch gate and verify publication",
          "why": "Publish only after the exact candidate has test, security, and operational evidence.",
          "do": [
            "Collect passing Stage 8/9 checks, applicable closed-test approval, crash-report proof, update recovery plan, isolated restore evidence, and cost-control settings. Recheck after candidate changes.",
            "Confirm the package/versionCode, production backend, store declarations, reviewer access, support owner, and signing recovery. Ask the owner to approve production publication.",
            "After approval, complete the production release in Play Console. Wait for actual availability; install from the store and check sign-in and one core action."
          ],
          "prompt": "Audit the final launch gate for [APP_NAME] against the exact candidate. Mark missing evidence as blocked. Only after all checks and explicit owner approval, proceed with publication. Verify Console status and a store-installed smoke test; never equate upload with live release.",
          "proof": [
            "Every required gate has passing evidence tied to this candidate.",
            "The owner approved publication; Console availability and a store-installed test confirm the intended version."
          ],
          "ifStuck": "Record whether the blocker is readiness, account eligibility, review, or rollout. Resolve it before claiming the app is live.",
          "risk": "Publishing before recovery and access checks exposes real users to avoidable failures.",
          "rollback": "Hold publication when a check fails. For an already-released fault, follow the incident runbook and issue a validated correction; halting distribution does not downgrade installed copies.",
          "cost": "Play registration and any provider/build usage apply; check current account and provider pricing.",
          "xp": 20,
          "factCheck": {
            "key": "s11-step5",
            "url": "https://docs.expo.dev/submit/android-manual/",
            "checkedOn": "2026-11-23"
          },
          "source": {
            "url": "https://docs.expo.dev/submit/android-manual/",
            "checked": "2026-11-23",
            "versions": [
              "Expo SDK 58 submission docs",
              "Google Play Console; verify candidate versionCode"
            ]
          }
        }
      ],
      "boss": {
        "question": "Does a Supabase database backup plus Spend Cap cover all files and every possible bill?",
        "options": [
          "Yes, both provide complete protection.",
          "No. Storage objects need separate backups and opted-in costs such as compute can be outside Spend Cap.",
          "Yes, if backups are daily.",
          "Only if the app is Android."
        ],
        "answer": 1
      }
    },

    {
      "id": 12,
      "title": "Keep Healthy",
      "desc": "Upgrade carefully, preserve database compatibility, control update rollouts, and recheck changing facts.",
      "steps": [
        {
          "id": "s12-step1",
          "stage": 12,
          "title": "Upgrade one SDK at a time on a branch",
          "why": "Dependency changes can affect native code and need a fresh verification cycle.",
          "do": [
            "Save a working checkpoint and create an upgrade branch. Read release notes and target a supported SDK incrementally.",
            "Install the intended Expo version, run npx expo install --fix and npx expo-doctor, and review the dependency/lockfile diff.",
            "Rebuild native development and release candidates; rerun Stage 8 tests and optional-module checks. Review native customizations before regenerating any native directories."
          ],
          "prompt": "Plan one incremental Expo SDK upgrade for [APP_NAME]. Read release notes, align dependencies, run expo-doctor, review native changes, rebuild, and rerun the release checklist. Preserve custom native work.",
          "proof": [
            "Dependency diagnostics and relevant tests pass.",
            "A new installed candidate passes core and selected module checks."
          ],
          "ifStuck": "Provide the first error and old/new package versions; ask which dependency or native change is incompatible.",
          "risk": "Bulk upgrades and native regeneration can remove custom changes.",
          "rollback": "Revert the upgrade branch changes and restore its lockfile; reinstall and rebuild the known-good version.",
          "cost": "Local tooling is free; cloud builds use quotas: https://expo.dev/pricing",
          "xp": 20,
          "factCheck": {
            "key": "s12-step1",
            "url": "https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/",
            "checkedOn": "2026-11-23"
          },
          "source": {
            "url": "https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/",
            "checked": "2026-11-23",
            "versions": [
              "Expo SDK 58 docs",
              "Use versions from your app lockfile; not device-tested here"
            ]
          }
        },
        {
          "id": "s12-step2",
          "stage": 12,
          "title": "Ship migrations that older apps can still use",
          "why": "Installed older app versions can keep calling the database after a release.",
          "do": [
            "Record every schema change in a versioned Supabase migration; test on local/disposable data first.",
            "Prefer additive changes; test both old and new clients plus RLS against the candidate schema.",
            "Back up and review before a production migration. Use one coordinated deployment; remove old columns only after a separately reviewed compatibility plan."
          ],
          "prompt": "Design the next database migration for [APP_NAME] with additive changes and compatibility for installed old clients. Test on disposable data, verify RLS, record restore/forward-fix steps, and require approval before destructive or production execution.",
          "proof": [
            "Migration applies cleanly to a disposable copy.",
            "Old and new client core operations work and isolation tests pass."
          ],
          "ifStuck": "Compare migration files and recorded remote history; do not use repair commands blindly.",
          "risk": "Dropping/renaming a live column can break all older installed apps.",
          "rollback": "Prefer a reviewed forward fix; restoration requires a data-loss assessment and approval.",
          "cost": "Extra environments/backups may cost: https://supabase.com/pricing",
          "xp": 20,
          "factCheck": {
            "key": "s12-step2",
            "url": "https://supabase.com/docs/guides/deployment/database-migrations",
            "checkedOn": "2026-11-23"
          },
          "source": {
            "url": "https://supabase.com/docs/guides/deployment/database-migrations",
            "checked": "2026-11-23",
            "versions": [
              "supabase-js 2.x docs",
              "Use versions from your app lockfile; not device-tested here"
            ]
          }
        },
        {
          "id": "s12-step3",
          "stage": 12,
          "title": "Roll out updates gradually and watch the results",
          "why": "Staged rollouts limit how many users get an update. They do not downgrade users already affected.",
          "do": [
            "For an update to an existing app, choose a staged rollout percentage in Play Console after test-track validation. First publication does not support staged rollout.",
            "Assign an owner to watch crashes, sign-in, core-action errors, and feedback before increasing the percentage.",
            "If failure rises, halt rollout; prepare and test a corrected higher-versionCode build. Use OTA only when the fix is runtime-compatible."
          ],
          "prompt": "Write the update rollout and stop criteria for [APP_NAME]. Distinguish first publication from app updates. Explain that halting stops additional distribution but leaves already-updated users on that version, and prepare a corrected release path.",
          "proof": [
            "An update has an owner, observation window, and explicit stop criteria.",
            "A rehearsal identifies the halt control and corrected-build procedure."
          ],
          "ifStuck": "Paste redacted version-specific failure metrics; ask whether to halt and which installed users still need a fix.",
          "risk": "A halted rollout leaves affected users with the faulty version.",
          "rollback": "Halt further distribution, support affected users, and release a validated correction with a higher versionCode.",
          "cost": "Monitoring and new builds may use paid quotas.",
          "xp": 20,
          "factCheck": {
            "key": "s12-step3",
            "url": "https://support.google.com/googleplay/android-developer/answer/6346149",
            "checkedOn": "2026-11-23"
          },
          "source": {
            "url": "https://support.google.com/googleplay/android-developer/answer/6346149",
            "checked": "2026-11-23",
            "versions": [
              "Google Play staged rollout guidance checked 2026-11-23"
            ]
          }
        },
        {
          "id": "s12-step4",
          "stage": 12,
          "title": "Review changing facts and repeat the recovery drill",
          "why": "Store rules, quotas, and SDK support change. A checked date is a reminder to review, not a permanent guarantee.",
          "do": [
            "Schedule a monthly review and another before each release for Play target API/testing/privacy rules, SDK support, provider costs, and source links.",
            "Record the URL, checked date, installed versions, and which cards need updating. Recheck security/performance advisors and support feedback.",
            "Repeat the isolated restore drill and access tests after relevant changes; record the next owner/date and update the release checklist."
          ],
          "prompt": "Create a maintenance checklist for [APP_NAME] covering changing policy/version/cost facts, source links, security/performance findings, support feedback, backup restoration, and ownership. Record actual results and dates; never claim a device test from a documentation review.",
          "proof": [
            "Review log identifies each changed fact and affected card.",
            "Recovery/access checks have recent evidence and the next review has an owner/date."
          ],
          "ifStuck": "Ask the AI to compare the saved claim with the current official page and distinguish documentation review from executed testing.",
          "risk": "Stale guidance can block release or leave recovery assumptions untested.",
          "rollback": "Pause a release dependent on an unverified fact; correct the guidance and repeat the affected gate.",
          "cost": "Review time plus any rehearsal infrastructure: https://supabase.com/pricing",
          "xp": 20,
          "factCheck": {
            "key": "s12-step4",
            "url": "https://supabase.com/docs/guides/deployment/going-into-prod",
            "checkedOn": "2026-11-23"
          },
          "source": {
            "url": "https://supabase.com/docs/guides/deployment/going-into-prod",
            "checked": "2026-11-23",
            "versions": [
              "supabase-js 2.x docs",
              "Use versions from your app lockfile; not device-tested here"
            ]
          }
        }
      ],
      "boss": {
        "question": "Can halting a Play staged rollout undo the update already installed by affected users?",
        "options": [
          "Yes, it downgrades everyone.",
          "Yes, after a restart.",
          "No. It stops further distribution; affected users need a corrected higher-version release or a compatible fix.",
          "Yes, deleting the release restores user data."
        ],
        "answer": 2
      }
    },
  ]
};
