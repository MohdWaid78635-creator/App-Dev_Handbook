# Habit Check-in

Build one small habit app through four checkpoints. The companion Academy works in a browser. To run and edit this sample, use a computer with Node.js LTS, Git, a code editor, and an Android phone or emulator.

## Checkpoint 1 — Run and change one screen

Open a terminal **in this folder**. On Windows, open the folder in Explorer, click the address bar, type `powershell`, and press Enter. Run `Get-ChildItem` to check that you see `package.json`. On macOS or Linux, use `ls`.

1. Run `node -v`, `npm -v`, and `git --version` to check your tools. Use a Node LTS version supported by [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/).
2. Run `npm ci` once and `npm start` when you want to open the app. With a [compatible Expo Go build](https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/) on the same network, scan the terminal QR code. For an [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/), start the emulator first and press **a**.
3. You should see **Habit Check-in** and the **First screen** exercise. Tap **Check in** and **Undo check-in**. Open `Starter.tsx` and change “My first habit” to “My daily habit”. Save the file and check that your change appears on the phone. The value set by `useState` changes the label when you tap. Reload resets this first exercise.
4. In your own extracted copy, run `git init`, then `git add Starter.tsx` and `git commit -m "Checkpoint first screen"`. Change the title again and run `git diff -- Starter.tsx`. Practise using the diff to put the title back manually. `git status --short` should no longer show a modification for that file. If Git asks for a name and email, configure your own identity for this repository and retry.

**If stuck:** A missing package usually means the terminal is in the wrong folder or installation failed. SDK mismatch means the Expo Go build and project use different SDKs. Read the first error and compare it with the [Expo setup guide](https://docs.expo.dev/tutorial/build-with-ai/set-up-your-tools/). For a network issue, try a trusted shared network or an emulator. Use a project development build when your chosen native libraries require one.

### Read the code you just changed

- A **component** is a function that describes part of the screen. Find the `Starter` function and the `<Text>` labels it returns. This syntax is called JSX.
- **Props** are values passed to a component. In `App.tsx`, follow the `label` prop into `Action` and predict which text it displays.
- **State** is a component’s memory. Predict the button label after two taps, then check it on the phone. Edit the starting value in `Starter.tsx`, reload, and explain the difference.
- A **type** describes what a value may contain. In the `Habit` type in `storage.ts`, `done` must be a boolean. Try giving it a text value in a temporary experiment and read the first TypeScript error, then undo the experiment.
- **Async and await** let the app wait for storage or the network. Find the line in `App.tsx` that waits for a save. Trace the paths that clear the draft, keep it, or ask the learner to refresh.

[React Quick Start](https://react.dev/learn) · [TypeScript for new programmers](https://www.typescriptlang.org/docs/handbook/typescript-from-scratch.html)

## Checkpoint 2 — Persist a habit and recover a failed save

Open **Local lab**. Submit an empty title and check the validation message. Add “Walk for five minutes”, tap the row to complete it, then close and reopen the app. Return to Local lab and confirm that the habit and completion are saved. In `App.tsx`, the view shows pending state and keeps the draft on failure. In `storage.ts`, SQLite saves rows on the device.

1. Type “Read one page”. Tap **Simulate next save failure**, then **Add habit**.
2. The draft should still say “Read one page” and the list should contain no new row. The simulation stops the write before storage.
3. Tap **Add habit** again. Verify exactly one “Read one page” entry appears.
4. Try an independent change. Add a completed-habit count or a filter for unfinished items. Explain which data it reads and show that it updates after you toggle a habit.

Run `npm run typecheck` to catch TypeScript errors. Run `npm run check:bundle` to check that Metro can export the Android bundle. Use TalkBack to check that it announces each habit and whether it is complete. A bundle export is a compilation check. The device checks above supply runtime evidence.

## Checkpoint 3 — Connect a disposable Supabase development project

Use test data and a disposable development project. The sample uses manual development-account sign-in and keeps the cloud session in memory. You sign in again when you restart. Public registration, durable credential storage, and production account deletion are separate lessons. Review the [React Native Auth guide](https://supabase.com/docs/guides/auth/quickstarts/react-native) before adapting it for real users.

1. In the development project’s SQL Editor, run the included `supabase/migrations/20261123000000_habits.sql` once. This is a one-time sandbox exercise. For a project managed by migrations, use the [linked development workflow](https://supabase.com/docs/guides/local-development/cli-workflows) so the schema and migration history agree.
2. Create two disposable email/password accounts in **Auth → Users** and confirm them for the sandbox. Use separate test passwords.
3. Copy `.env.example` to `.env`. Fill in the development project URL and **publishable** key from Supabase Connect. Restart Expo. Both variables are public in the app bundle. Keep account passwords and privileged keys out of the source, prompts, screenshots, and learner notes.
4. Open **Cloud lab**, sign in as test user A, and create a distinctive test habit. Verify the habit appears after refresh. Sign out and sign in as B. B should see only their own rows and should be able to add a separate habit. Return to A and confirm that A’s data is intact and B’s is absent. Inspect the SQL migration to see the roles and owner policies that enforce that result. [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)

**If stuck:** If a user can sign in but cannot work with their own habit, check the development URL, migration, grants, and policy. If B sees A’s records, stop the exercise and fix the development project’s access rules before continuing. A hidden screen is a navigation control. The policy is what protects records.

## Checkpoint 4 — Rehearse an Android test release

1. With permission to use the team’s Play account, choose a package identifier you control in `app.json`. Keep the sample package ID for local learning only. Follow [Expo Build](https://docs.expo.dev/build/setup/) to configure an Android app bundle. The upload key signs the bundle you send to Play, and Play App Signing signs what users install. Check Play Console for account and device verification, target API, and native compatibility before submitting. [Android app signing](https://developer.android.com/studio/publish/app-signing) · [16 KB compatibility](https://developer.android.com/guide/practices/page-sizes)
2. This training example contains a practice-failure button and disposable account flow. Keep the sample on private testing tracks with sandbox data. Note the package identifier, version code, and backend the build contains. Selecting a test track does not change that backend.
3. Follow [Expo Android submission](https://docs.expo.dev/submit/android/) to upload to a Play test track. Install the candidate from the track and repeat the sign-in and add-habit checks that apply. Record the build identifier, what you tried, and what actually happened. Complete [applicable closed-testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465) for a separate production-ready app.

For a pilot without access to Play Console, stop after the installed app checks and have the facilitator show the release sequence. Treat Play upload and production publishing as separate milestones.
