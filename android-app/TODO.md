# BuildWisp to-do

## Current session · 27 November 2026

The **Plan Mode**, **Build Workspace**, **Project Milestones**, **Production Readiness**, and **Help and Resource Library** prototypes were approved and their clay redesigns implemented. Next: show the **Backup and Restore prototype** for approval before changing that screen.

Approved screens are implemented through Help and Resource Library. Native Android appearance, navigation, TalkBack, large text, and landscape checks remain pending. Validation details are recorded in `docs/home-design.tdd.md`.

## 25 November 2026 · Approved design session

- [x] Approve the colour card: violet, mint, lilac, porcelain, and plum ink.
- [x] Approve the clay B and mint wisp logo.
- [x] Approve the powder lilac splash prototype.
- [x] Approve the returning-learner home prototype.
- [x] Implement splash configuration and the home screen, including saved progress and new, returning, mastered, and completed learner states.
- [ ] Check installed Android cold start, TalkBack, larger text, small-screen and landscape layouts, and every navigation action.
- [x] Prototype and approve the Mission Map.
- [x] Implement the Mission Map journey layout with real mastery, XP, a current mission, and shared navigation.
- [x] Prototype and approve Practice.
- [x] Implement the Practice clay layout for matching and ordering, with retry and completion feedback.
- [x] Prototype and approve Knowledge Check.
- [x] Implement Knowledge Check with stage progress, selected-answer feedback, retries, and saved-answer handling.
- [x] Prototype and approve Mission Results.
- [x] Implement Mission Results with the clay trophy, saved XP, completion rows, next mission, and milestone actions.
- [x] Prototype and approve Lesson Detail.
- [x] Implement Lesson Detail with clay disclosures, expandable examples, full lesson/build content, and accessible Practice actions.
- [x] Prototype and approve Review room.
- [x] Implement Review room with the clay question card, saved queue, answer feedback, study entry, and shared navigation.
- [x] Prototype and approve Daily Practice and Flashcards.
- [x] Implement both study modes with clay tabs, daily feedback, revealed cards, saved counts, and recall actions.
- [x] Prototype and approve Start Here / setup checkpoints.
- [x] Implement Start Here with expandable checkpoints, expected results, saved checkmarks, and the first-mission action.
- [x] Prototype and approve Your Projects and the project editor.
- [x] Implement the clay project list/editor, expandable tool menus, project-platform icons, and technology icons in Plan Mode choices.
- [x] Prototype and approve Plan Mode.
- [x] Implement Plan Mode’s four-stage clay form, technology dropdowns, and draft/navigation actions.
- [x] Prototype and approve Build Workspace.
- [x] Implement Build Workspace with the mission selector, proof progress, disclosures, and active-card prompt actions.
- [x] Prototype and approve Project Milestones.
- [x] Implement Project Milestones with evidence states, saved counts, note editing, and guarded summary preview/export.
- [x] Prototype and approve Production Readiness overview and check editor.
- [x] Implement Production Readiness with build selection, saved status counts, evidence validation, and unsaved-edit feedback.
- [x] Prototype and approve Help and Resource Library.
- [x] Implement the clay library with search, labeled category icons, expandable resources, and contextual help.
- [ ] Prototype Backup and Restore for review before redesigning it.

The approved Mission Map is at `/missions`; the remaining screens are awaiting their own prototypes and approvals.

## 26 November 2026 · Redesign the Android app

- [ ] Redesign the home screen first. Make **Continue learning**, the next mission, and project progress easy to find. Show how it looks for a new learner, a returning learner, and someone who just mastered a mission.
- [ ] Use the home prototype to establish the visual style for the whole app. Review navigation, typography, spacing, cards, progress indicators, and original workshop artwork before applying them to other screens.
- [ ] Carry the approved design through the app one screen at a time. Start with the Mission Map, Practice, Knowledge Check, and Results. Then update Lessons, Review and Flashcards, the project and build tools, Production Readiness, Help, and Backup and Restore.
- [ ] Add motion alongside each redesigned screen. Show progress when a mission is mastered, reveal answer feedback in Practice, celebrate the first boss clear, reveal flashcard meanings, and confirm successful saves in the build tools. Use short effects and honor Android’s reduced-motion setting.
- [ ] Compare the current home screen with the redesigned prototype before changing the rest of the app. Verify that navigation, saved progress, and XP still work, and check the new design on Android with TalkBack, larger text, and reduced motion.
