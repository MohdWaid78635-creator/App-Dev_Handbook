# BuildWisp for Android

BuildWisp is an Expo React Native app for learning and building first Android projects. It includes the mission map, Start Here, Lesson Detail, Practice games, Knowledge Checks with boss questions, Mission Results, and a Review room. It imports 13 missions, 15 lesson modules including Testing, and 55 build cards. Setup checks, the latest opened mission, quiz progress, and review dates are saved locally with Expo SQLite.

## Run the first screen

From this directory, run `npm ci`, then `npm start`. Open a compatible Expo Go build on a physical Android phone or use an Android emulator. See [Expo Go compatibility](https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/) and the [Android emulator setup](https://docs.expo.dev/workflow/android-studio-emulator/).

Run `npm test`, `npm run typecheck`, and `npm run check:bundle` to verify this increment. Curriculum JSON is regenerated from the handbook for type checking, bundling, and local startup.

## Approved splash and home design

The home screen uses the approved powder lilac, violet, mint, and porcelain clay palette. It reads saved XP and mastery, offers setup for new learners, resumes an unfinished mission, advances after mastery, and offers Review when all missions are mastered. The bottom navigation opens Home, the existing Mission Map, Projects, and Review. The workshop options button opens setup, Help, and Backup and Restore.

Device checks still required: cold-start an installed Android build; follow every home action; reopen after earning XP; test 375px and landscape layouts, TalkBack, large system text, and reduced motion. The home layout stacks cards at larger text sizes and does not add looping animation or an artificial splash delay.

## Mission Map redesign device check

Open **Missions** from Home. Verify all 13 missions are listed in curriculum order, the XP and mastery count match Home, and the highlighted mission matches Home's learning action. Open an available mission, revisit a mastered one, and finish a knowledge check; confirm the map refreshes with a mint mastery check and highlights the next unfinished mission without awarding extra XP. After all missions are mastered, confirm Review is offered and every lesson remains available. On a new profile, verify **Start Here** opens setup.

Check Help and each bottom navigation action, Android Back, TalkBack labels, 375px and landscape layouts, larger text, and reduced motion. These native device checks are pending; automated tests and bundling do not verify visual appearance.

## Setup device check

The approved clay layout expands the first unchecked step on entry. Each checkpoint header controls its instructions; the checkbox inside controls saved evidence independently. Checked steps can be reopened and unchecked. The first-edit commands are selectable in a dedicated block. The first-mission action stays enabled regardless of checked count, docked on taller screens and inline for short windows or above 1.5× font scaling. Check Home, Help, the capstone guide, resource errors, and the last checkpoint above the dock. Native rendering, disclosure/checkbox announcements, large text, and landscape checks remain pending.

1. Open **Start Here** from Home, expand each of the four checkpoints, and confirm its instructions and expected results are available. Open the capstone guide.
2. Mark a checkpoint and open a mission. Use Android Back to return to the map. Confirm the mission is marked **Opened** and that **Resume mission** opens the same mission.
3. Fully close and reopen BuildWisp. Confirm the saved check and latest mission are restored. Uncheck the milestone, reopen BuildWisp, and verify it remains unchecked.
4. Repeat the main interactions with TalkBack and a larger system font. Confirm the checkbox announces its state and no required text or control is clipped.

Setup checkmarks record the learner’s own evidence. Answering all questions in a mission’s knowledge check earns mastery.

## Lesson Detail device check

The approved clay layout opens the first concept and places each worked example behind **See an example**. Concept and example controls expose their expanded state. All glossary meanings, safety notes, source links, AI checks, explain-back prompts, and build instructions remain available. **Start practice** and **Knowledge check** sit below the scroll area on a tall portrait screen; at less than 600 logical pixels of height or above 1.5× font scaling, they move after the lesson content so the reading area remains usable. Check the final build card can scroll fully above the dock, the fallback actions remain reachable, and Help is scoped to this mission. The Missions header link opens `/missions`.

Native disclosure interaction, portrait/landscape appearance, TalkBack, and larger-text checks remain pending.

Open **How apps work**, expand a concept and its glossary terms, read the example, and open **Check the AI’s work**. Find **Explain it back**, then expand a card under **Apply it to your app** and check its instructions, proof, and source link. Open **Catch a bug before users do** to see the testing lesson. Use Android Back to return to the same map. Repeat with TalkBack and larger text to verify the expand controls announce their state.

## Practice device check

The approved clay layout uses a focused Practice header, large answer buttons, pair progress, amber retry selection, mint completion feedback, and a knowledge-check link. Ordering uses the same surfaces and feedback. Practice still awards no XP. Verify the wrong choice is marked without exposing the correct answer, retrying clears the old marker, Play again resets progress, and changing exercises resets the attempt. Check the lesson and mission-specific Help links, Android Back, and return to the Mission Map on an invalid route. Device appearance, TalkBack announcements, and large-text/landscape layouts remain pending.

Open **How apps work → Start practice**. Choose a wrong match and confirm the same pair stays open. Complete the pairs and check that the explanation appears. Select the ordering exercise, build an order, undo the last choice, and verify both an incorrect and a correct order. Try Play again, move to another exercise, and use Android Back to return to the lesson. Repeat with TalkBack and large text. Practice attempts reset when you leave the exercise and do not award XP.

## Knowledge Check device check

The approved clay layout includes question/boss stage markers, mint correct selections, amber incorrect selections, explanation feedback, and explicit Next question / Try again / See results actions. Verify the current stage changes only after advancing, replay resets the stage markers, and the saved-answer footer is hidden when saving fails. Check the lesson and mission-specific Help links and invalid-route recovery to `/missions`. Native appearance, TalkBack, larger text, and landscape checks remain pending.

Open **Knowledge check** from a lesson or practice. Pick a wrong answer, read or listen to the feedback, and retry. Answer the first question correctly, leave the screen, and reopen it to confirm that the second question is next. Confirm that TalkBack announces response feedback.

## Mission Results device check

The approved clay layout shows the trophy only for a mastered mission. Verify unfinished results show their earned XP, pending rows, and **Continue knowledge check**. Confirm completed results show actual mission and total XP, mastery progress, the next lesson, and milestone recording only for eligible missions. The final mission uses **Return to Mission Map** as its primary action. Help is scoped to the mission. All map-return and invalid-result paths open `/missions`.

`assets/clay-trophy.png` is a transparent asset prepared with the built-in image-generation tool by isolating the violet trophy and mint star from the approved Results prototype. Native appearance, TalkBack, larger text, and landscape checks remain pending.

1. Finish the boss and tap **See results**. Confirm **Mission mastered**, **30 XP** for the mission, two correct knowledge answers, and **Boss challenge cleared**.
2. Use Android Back to return to the lesson. Open **Knowledge check**, tap **Replay knowledge check**, and finish it again. Confirm the mission and total XP stay the same.
3. Follow **Next mission** and confirm it opens the adjacent lesson. Return to the map and confirm total XP and the **Mastered** marker. Complete the final mission and confirm its primary action returns to the map.
4. Fully close and reopen BuildWisp to verify that XP and mastery persist. Repeat the results navigation with TalkBack and a larger system font.

## Review room device check

The approved clay layout shows the next missed/due question directly, with a live queue count and a Daily Practice and Flashcards entry below. Global Review uses the shared navigation bar. Review opened from Results stays scoped to that mission and returns to its results; invalid mission IDs show a recovery link to `/missions`. Verify wrong answers show amber retry feedback and correct answers show mint feedback, while Continue removes a question only after a successful save. A caught-up queue shows **No questions due** with the 24-hour reminder. Native appearance, TalkBack, navigation, larger text, and landscape checks remain pending.

1. Miss an answer, finish the knowledge check, then open **Review this mission** from Mission Results. Confirm the missed question appears even if you corrected it in the quiz.
2. Pick a wrong answer in Review, read the explanation, then retry. Choose the correct answer and tap **Continue**. Check that the question clears from the queue and that a previously correct answer adds no XP.
3. Restart BuildWisp and open **Review room** from the mission map. Verify that a reviewed question stays cleared until it comes due again after 24 hours. Check that the mission map entry includes due questions from all missions, while Mission Results opens Review for that mission.
4. Repeat with TalkBack and larger text. Confirm the answer feedback is announced and the answer choices and Continue button are reachable.

## Project Setup device check

The approved clay list uses expandable project tool menus, visible Edit actions, and shared navigation on the global list. Saved plan platforms provide app/website icons; undecided projects use a folder. Plan Mode dropdown headers and choices now include bundled technology/platform icons: brand glyphs where available and labeled category icons for other providers. This icon update does not redesign Plan Mode or change its choices.

The three-field editor keeps required-name validation, field limits, duplicate-save protection, and drafts after failed saves. Navigation hides while editing; Back/Cancel returns to the list, and keyboard avoidance keeps the form scrollable. Returning from Plan Mode refreshes saved project details. Verify mission/milestone parameters still reach the selected project tool. Native menus, keyboard behavior, Back, icon rendering, TalkBack, large text, and landscape checks remain pending.

1. Open **Your projects** from the mission map and tap **New project**. Try saving with an empty name. Confirm the inline error and focus on the name field.
2. Save an app name with an optional audience and goal. Confirm the project appears in the list. Create a second project, reopen the first, edit it, and confirm only the first project changes.
3. Restart BuildWisp and reopen both projects. Confirm the details and learning progress are still present. Repeat with TalkBack, larger text, and the keyboard open to check that every field and action is reachable.

## Plan Mode device check

The approved clay redesign uses the four stages **Idea**, **Tools**, **Security**, and **Review**. The current stage is highlighted; visiting a stage does not mark it validated. Every existing field, recommendation, description, cost label, official link, conflict, recorded decision, and prompt remains available. Expo choices combine language and React icons. Platform/computer fields share a row only when width and font size allow it. Next, Previous, and Save draft are docked on taller screens, or placed after the content on short windows and above 1.5× font scaling. Next changes the stage without claiming to save; Save draft explicitly stores the draft. Save/copy feedback stays with the action area.

Native form/dropdown appearance, keyboard and dock behavior, TalkBack, large text, landscape, source opening, copy, and navigation checks remain pending.

1. Open **Your projects → Open Plan Mode**. Confirm the draft starts with the saved project’s audience and goal. Enter a first user journey and save the draft. Reopen it after restarting BuildWisp.
2. Choose **Android** and **No** for device sync. Compare language, storage, and sign-in options. Confirm the recommended Expo, SQLite, and no-account choices, along with descriptions, cost labels, and official links.
3. Combine local-only storage with cross-device sync and open **Review decisions**. Confirm the conflict appears and the draft prompt asks the coding agent to resolve it before setup. Fix the choices and verify the prompt includes your first-build proof, install checks, and security decisions.
4. Tap **Copy foundation prompt** and paste it into a local note to check the contents. Open another project and confirm it has its own draft. Repeat the flow with TalkBack and larger text.

## Build Workspace device check

The approved clay layout shows saved proof totals, a mission dropdown, and expandable build cards. The first card opens on entry or mission change; its proof section starts expanded, while instructions and recovery/source guidance expand separately. Copy/Preview actions follow the open card and disappear when no card is open. Preview reveals selectable project-specific text and scrolls to the card. On short windows or above 1.5× text scaling, actions flow after the content instead of docking. Copy results from a previously open card are ignored after switching cards. Optional-card reasons, Resume, saved checkmarks, unchecking, source details, and failed-save handling remain available.

Native disclosure and checkbox interactions, prompt scrolling/copy, clipboard fallback, optional-card editing, keyboard/dock behavior, TalkBack, large text, and landscape checks remain pending.

1. Choose **Your projects → Open Build Workspace**. Select a mission and expand a card. Check that the instructions, official source, and proof checklist match the handbook. Preview and copy the prompt, then paste it into a local note to confirm it uses the project name.
2. Check all the proof items for a card. Confirm that it shows **Proof recorded** and the project total increases. Restart BuildWisp, reopen the project, and confirm those checks are saved. Uncheck an item and verify the count decreases.
3. Switch to another project and check that it has separate proof. Open the workspace from a lesson and confirm it starts on that mission after you choose a project.
4. On an optional card, enter a reason and mark it **Not applicable**. Confirm it is counted separately. Resume the card and verify any previous checks return. Repeat with TalkBack, larger text, and offline mode.

## Project Milestones device check

The approved clay layout shows the four milestones, actual saved count, and distinct **Evidence recorded**, **Evidence needed**, and **Unsaved changes** states. Expansion stays separate from saving. Each editor has a visible evidence label, Save/Clear action, and related build-card link; Release readiness also opens Production Readiness. Summary preview uses saved notes. A visible warning appears for unsaved edits, and Copy/Share remain hidden until those edits are saved. Keyboard avoidance keeps the form scrollable. Native note/disclosure behavior, keyboard handling, summary selection/copy/sharing, contextual links, TalkBack, large text, and landscape checks remain pending.

1. Open **Your projects → Project Milestones**. Save evidence for **Problem and audience**. Restart BuildWisp and verify the note and recorded count. Edit the note, then clear it and verify the count decreases.
2. Open a second project and confirm its notes are separate. Finish a milestone mission and use **Record project milestone** from its results to open the matching note in the chosen project.
3. Open the saved summary preview. Check the brief, plan choices, milestone notes, and build proof against the project. Leave an edit unsaved and confirm export asks you to save it. Save the note, then copy and paste the summary into a local note and open the Android share sheet.
4. From a milestone, open its build cards and check an item. Return and confirm the preview reflects the new proof. Repeat with TalkBack and larger text.

## Production Readiness device check

The approved clay overview and check editor use a build selector, four saved-status counts, section rows, and separate copy/preview controls. Draft edits show **Unsaved changes**; status counts reflect saved results only. Passed, Blocked, and Not applicable still require evidence or a reason before saving. Existing per-project/build storage, failure handling, and prompt generation remain intact. Native appearance, keyboard/navigation behavior, TalkBack, large-text, and landscape checks remain pending.

1. Open **Your projects → Production Readiness** and enter a build number or commit. Confirm the overview lists 133 checks across 17 sections.
2. Open a section and a check. Preview and copy its prompt. Confirm the text names the project, build, and selected check. Return to the overview and compare it with the full read-only audit prompt.
3. Try saving **Passed** without evidence. Add a redacted result or reason, save, and verify the status and counts. Restart BuildWisp and reopen the same build. Open another build and another project to confirm each has separate results.
4. Open related build cards and a source link where available. Repeat the important interactions offline and with TalkBack and a larger system font.

## Security Tools device check

1. Open **Secure the release → Security Tools**. Expand the tool cards and open an official source. In **Start practice**, match the three sample findings to their tools, then order the steps for verifying the permission finding.
2. Search **MobSF** in the Resource Library and open its guide. In **Production Readiness → Android release artifact checks**, open the static report check and preview its prompt. Confirm the prompt names the build and requests redacted evidence and a verification result.

## Help and Resource Library device check

1. Open **Help and Resource Library** from the mission map. Search `login` and filter to **Glossary** or **Prompts**. Open a result, clear the search, and verify an unmatched query shows a recovery hint.
2. From a lesson, tap **Troubleshoot this mission**. Confirm the library starts with that mission’s fixes and **Show all missions** removes the restriction.
3. Open a prompt and copy it into a local note. In airplane mode, repeat search and open a handbook article to confirm the library content is available offline. External sources and the separate Kotlin/Compose course require a connection.
4. Repeat search, category selection, and opening results with TalkBack and a larger system font.

## Daily Practice and Flashcards device check

Both approved study modes use the shared clay tab rail and Review header link. Daily Practice shows the real streak and lesson title, marks the correct answer and any incorrect saved selection, and offers **Review this lesson** after the first saved attempt. Flashcards show real due and recalled counts, the glossary term, **Reveal meaning**, then **I knew it** / **Show again** after reveal. The card face expands to fit longer definitions and text scaling. Caught-up, load-failure, and save-failure states remain available; a failed grade keeps the current card and meaning visible. Native appearance, tab/reveal interactions, TalkBack announcements, and large-text/landscape checks remain pending.

1. Open **Review room → Daily Practice and Flashcards**. Answer today’s question, read the explanation, and open the related lesson. Restart BuildWisp and verify that the first answer is still recorded and the choices are disabled.
2. Use a test device or emulator to advance the local date and verify that another question is available. Answer it and confirm the streak increments. Leave a day unanswered and confirm the streak restarts when you next answer.
3. Switch to **Flashcards**. Reveal a term and tap **Show again**. Verify that it returns after the other due terms. Tap **I knew it** on a different card and verify that it leaves today’s queue, including after a restart.
4. Repeat offline with TalkBack and larger text. Confirm the selected mode, answer feedback, and revealed meanings are announced.

## Backup and Restore device check

1. On a test install, create a project with a plan, build proof, a milestone note, and one release review. Earn quiz XP and complete a daily question and a flashcard.
2. Open **Backup and Restore → Save or share backup** from the mission map. Save the JSON file with the Android share sheet. Change some local data, then select the saved JSON using **Choose backup file**.
3. Verify the file preview and counts. Cancel the confirmation and confirm local data stays unchanged. Repeat and choose **Replace and restore**. Verify the mission map refreshes immediately and the saved project, review, and practice state are restored after reopening the app.
4. Select a non-backup file and a malformed backup. Confirm both are rejected with local progress intact. Repeat with a local file in airplane mode and check the labels and confirmation with TalkBack and larger text.

## Splash screen

The native Expo splash plugin uses `assets/clay-logo.png` on the approved powder lilac (`#E8DFF5`) background. `assets/clay-mark.png` is the home header mark and `assets/clay-workshop.png` is its decorative workshop illustration. These transparent PNGs were prepared with the built-in image-generation tool from the approved prototypes: preserve the logo identity and remove its background; isolate the mint toolbox and violet phone; isolate the logo mark for the header. After changing the asset or plugin settings, rebuild and verify a cold start in an installed preview or release build. Android controls native splash sizing and masking, so verify the lockup on the target OS. Expo Go does not reproduce the same launch screen. [Expo splash guide](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/)

Expo is pinned to 58.0.26 and React Native to 0.88.1. Use the npm lockfile for reproducible installs and check upgrades separately. The preview package identifier is for local development.
