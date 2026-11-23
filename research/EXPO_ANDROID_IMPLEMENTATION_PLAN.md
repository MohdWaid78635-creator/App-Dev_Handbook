# Implementation Plan: Build Quest Academy for Android

## Overview

Build an Android app for first-time builders using Expo, React Native, and TypeScript. The learner studies a concept, practises it in a short game, and applies it to one app project. The clickable prototype establishes the screen structure and shows how the learning and building paths connect.

## Requirements & Scope

- **Path.** Give learners a clear place to resume across 13 missions. Each mission opens a lesson, a matching or ordering game, a knowledge check, a boss challenge, and the related build steps.
- **Build.** Bring over all 55 Expo and Supabase build tasks with copyable prompts, evidence checklists, sources, and recovery steps. Let learners resume a project and work offline with the packaged curriculum.
- **Review.** Show missed questions with immediate explanations, keep XP from being awarded twice, and support repeat practice. Add a delayed review schedule in the native app.
- **Project.** Carry the same app through a problem statement, core journey, test evidence, and release readiness. Support separate project profiles and export in the native app.
- **Library and help.** Bring the website’s reader, search, glossary, troubleshooting, and prompt library into a searchable Help area. Keep the Kotlin handbook route clearly marked as a separate track. Fold flashcards, daily practice, and progress into Review. Bring planning tools such as scope, stack choice, and costs into Project.
- Android is the first native target. Native implementation follows design review. Account sync and social features can be evaluated after the offline learning loop works.

## Architecture & Surface Changes

Paths below are relative to the App Builder’s Handbook repository. The proposed Expo app lives in `android-app/` and reads a typed version of the current curriculum.

| Surface | Planned files | Responsibility |
|---|---|---|
| Curriculum | `android-app/src/content/curriculum.ts`, `android-app/scripts/import-curriculum.mjs` | Reuse Learn Lab and Build Quest data. Map concept lessons and games to stage IDs, validate references, and preserve source dates. |
| Navigation and design | `android-app/app/(tabs)/_layout.tsx`, `android-app/src/theme/tokens.ts` | Path, Build, Review, Project, Help. Use the prototype’s violet and mint palette, tile states, artwork, and accessible native controls. |
| Learning and results | `android-app/app/mission/[id].tsx`, `android-app/app/challenge/[id].tsx` | Teach one idea at a time. Offer matching and tap-to-order games, boss results, and a route back to the related project task. |
| Build and project | `android-app/app/build/[id].tsx`, `android-app/app/(tabs)/project.tsx` | Separate evidence and drafts by project. Make the release readiness checklist visible before publication. |
| Progress and review | `android-app/src/progress/reducer.ts`, `android-app/src/progress/repository.ts`, `android-app/app/(tabs)/review.tsx` | Persist local progress, queue missed questions, schedule review, and derive XP from unique achievements. |
| Website parity | `android-app/app/(tabs)/help.tsx`, `android-app/app/article/[id].tsx` | Put full text search, glossary, official links, prompts, and troubleshooting one tap away from relevant missions. |

## Implementation Steps

### Phase 1: Curriculum and app foundation

1. **Create the Expo TypeScript app** (`android-app/app/(tabs)/_layout.tsx`). Establish typed routes and the shared components from the prototype. Depends on design review. Risk: low.
2. **Import and validate curriculum** (`android-app/scripts/import-curriculum.mjs`). Check every stage, question, answer, source, and build reference. Keep material that describes changing platform rules linked to its dated source. Depends on step 1. Risk: medium.

### Phase 2: Play the first mission end to end

3. **Implement lesson, practice, quiz, and boss** (`android-app/app/mission/[id].tsx`, `android-app/app/challenge/[id].tsx`). Start with one complete vertical slice. Give explanations after answers and keep skipped exercises reachable. Depends on step 2. Risk: medium.
4. **Save progress and schedule review** (`android-app/src/progress/repository.ts`). Persist answers, separate mastery from build evidence, and test retries, resuming, and data recovery after an upgrade. Depends on step 3. Risk: medium.

### Phase 3: Complete building and handbook parity

5. **Add all build cards and project evidence** (`android-app/app/build/[id].tsx`, `android-app/app/(tabs)/project.tsx`). Add multiple profiles, draft saving, capstone milestones, and export. Prove that switching projects keeps their evidence separate. Depends on steps 2 and 4. Risk: medium.
6. **Integrate the website’s reference and planning tools** (`android-app/app/(tabs)/help.tsx`, `android-app/app/article/[id].tsx`). Add search, glossary, troubleshooting, and prompts. Bring daily practice and flashcards into Review. Keep long reference material out of the core mission flow. Depends on steps 2 and 4. Risk: medium.

### Phase 4: Android field test

7. **Validate with beginners on Android** (`android-app/docs/acceptance.md`). Ask learners to finish the first mission, answer a question wrong, review it, and record evidence for their own idea. Observe where they stop or need help. Check TalkBack, larger text, system Back, offline access, and restarting mid-session. Depends on steps 3–6. Risk: medium.

## Testing & Verification Strategy

- Test duplicate XP, review scheduling, per-project isolation, content imports, and recovery after interrupted writes.
- Follow all core journeys on a physical Android phone and an emulator. Check the narrowest supported layout, large fonts, TalkBack, and airplane mode.
- Verify that a release candidate can resume lessons, review questions, and build tasks across app restarts. Rehearse export and restore before shipping.
- Keep native work in `android-app/` and use release versions so the previous build remains available during testing.

## Risks & Mitigations

- **Quiz progress can overstate build readiness.** Track mastery and recorded project evidence separately.
- **A full handbook can overwhelm the home screen.** Put the next mission on Path and make reference material searchable from Help.
- **Curriculum may drift between web and native.** Keep stable IDs, source dates, an import check, and a review process for policy changes.
- **Local progress can be lost when the app is removed.** Add an export and restore flow before release.

## Success Criteria

- [ ] All 13 missions and 55 build cards open on Android and work offline.
- [ ] A learner can play a practice game, complete a boss, review a miss, and resume after restarting.
- [ ] Two projects keep separate evidence and can be exported.
- [ ] Beginners can find help and complete the first learning and building loop on their own.
- [ ] Physical-device accessibility, recovery, and release-candidate checks pass.
