# Learning game plan: from your `builder_docs` folder

Goal: so you keep learning and are not dependent on the AI. A learning game, easy to understand, with examples.
This plan records what I checked, what was missing, what I built, and what is next.
Nothing in your `builder_docs` folder was changed. I only read it.

## 1. What is in `builder_docs` (5 files, about 28,000 words)

| File | What it is | Used for |
|---|---|---|
| `AppBuildersMasterCourse-1.docx` | 13-chapter course. Each chapter: understand it, see it, know the terms, practice it, direct the AI | The base of Learn Lab modules 1 to 8, 10, 11, 12 |
| `AI_Builder_Master_Playbook.docx` | Stack, planning steps, launch channels, week 1, "25 signs your app will break at 500 users", golden rules | Build-quest bonus quests, Learn Lab modules 2 and 14 |
| `APP_SECURITY_GUIDE.md` | Mobile app security teaching guide, with a fix-in-this-order list | Learn Lab module 9 |
| `dev-prompt-toolkit.html` | 50+ prompts and the master prompt formula | Learn Lab module 14 |
| `prompt-engineering-module.html` | "Talk to AI": the genie story and the prompt recipe | Learn Lab module 14 |

## 2. What the building game already had, and what was missing

The Handbook-based quest is a **process**: what to do, in what order, with proof. It does not teach the ideas behind it.
That was the biggest gap, and the Learn Lab fills it.

| Topic | Building game (Handbook) | Your docs | What I did |
|---|---|---|---|
| How apps work (frontend, backend, database, API) | Assumed, glossary only | Chapter 1 | New module 1 |
| Planning, validation, PRD, MVP | Yes (levels 1 and 2) | Chapter 2, Playbook phase 1 | Module 2. New bonus quest: two hours of market research |
| UI/UX principles | Levels 4 (process, states, accessibility) | Chapter 3 | Module 3 |
| Frontend: components, state, routing | Not taught | Chapter 4 | Module 4 |
| Backend, middleware, secrets | Partly (secrets, keys) | Chapter 5 | Module 5 |
| Databases: SQL, relationships, indexes | Level 6 (data map, access rules, backups) | Chapter 6 | Module 6 |
| APIs, HTTP status codes, webhooks | Not taught | Chapter 7 | Module 7 |
| Security basics, auth, OWASP | Level 8 (full list) | Chapter 8 | Module 8 |
| Mobile security, what to fix first | Level 8 (Kotlin version) | Security guide | Module 9 |
| Play Store submission and ASO | Level 13 (no ASO) | Chapter 9 | Module 10. New bonus quest: ASO |
| Payments, pricing, subscription life | Payment safety (8.9), no pricing | Chapter 10 | Module 11. New bonus quest: pricing model |
| Git, environments, CI, monitoring | Levels 7, 14 | Chapter 11 | Module 12 |
| Analytics, growth, feedback | Privacy-safe analytics (16.4) | Chapter 12 | Module 13. New bonus quests: analytics events, first week after launch |
| Prompting and reviewing AI work | Chapter 1 and 19 (process) | Chapter 13, toolkit, prompt module | Module 14 |
| "Will it break at 500 users?" | Load tests, rate limits, alerts in separate chapters | Playbook part 5 | New bonus quest pulling the critical ones together |

## 3. Where your documents disagree with the Handbook or with Google

These are the places I did NOT copy your documents blindly:

1. **Backups.** Your course and Playbook say Supabase backups are automatic. The Handbook (6.4, a dated fact) says the Free plan has no automatic backups and Pro keeps 7 days. Learn Lab module 6 says so, and tells you to prove a restore yourself.
2. **App icon.** The course says no transparency. Google's own listing page says a 512 x 512 PNG with alpha. Module 10 follows Google.
3. **Tap size.** The course says 44 px. Your Handbook says 48 x 48 dp for Android. Module 3 uses 48.
4. **Stack.** The course and Playbook use Next.js, React Native and Expo (and Clerk, Drizzle, Stripe in the Playbook). The Handbook builds native Android in Kotlin with Supabase Auth. The modules teach the ideas, which are the same, and say where the names differ. Choose one stack and tell the AI.
5. **Numbers that change.** Fees, percentage cuts, price points, review times and free-plan limits in the docs are left out of the lessons on purpose. They live in **Facts that change**.
6. **One-off claims I could not check.** For example a specific fintech leak in 2021. I did not include these.
7. **JWT in localStorage.** True advice for websites. For Android the Handbook's storage rules apply. Module 8 says so.

## 4. The learning game: design

**Learn Lab** is a second game beside the building quest. 14 modules, one idea each, about ten minutes.

Every module has the same shape (your course's own method):

1. **Understand it:** 4 to 5 short cards in plain English, each with a real **example**, and a **terms** list where it helps.
2. **Try it:** small games. Sorting steps into order, matching terms to meanings, keep-or-cut games. Retry as often as you like.
3. **Check yourself:** a 3-question quiz. A wrong answer says "look again", a right one explains why.
4. **Check the AI:** the exact thing to ask the AI about this topic, and what to check in its answer.
5. **Explain it back:** write the idea in your own words (at least 25 letters). This is the part that makes you independent: if you can explain it, you understand it.

Scoring (always worked out from what you did, never stored): 10 XP per right answer, 20 XP for your explanation, 30 XP when the module is complete. Ranks: Curious, Student, Practitioner, Builder, Architect.
It also counts toward your daily streak.

**How it connects to the building quest**
- Every build level shows "Learn the basics for this level" with the modules that go with it.
- Every module shows which levels use it and the Handbook sections that go with it.
- Learn progress is yours, not per app (what you understand does not belong to one app).

## 5. What was added to the building game from your documents

Six new bonus quests. Each one says on screen that it comes from your own documents and has not been checked against official sources:
- Level 1: two hours of market research
- Level 2: choose a pricing model and plan the subscription life
- Level 9: the five most critical "will it break?" checks (plus timeouts, transactions, runbook)
- Level 13: help people find your app (ASO)
- Level 14: plan analytics events before launch; plan your first week after launch

## 6. Next steps (not built yet, in order)

1. **Spaced review.** Bring a question back after 3 and 14 days so it sticks.
2. **Real examples.** Short, safe code and data snippets next to each idea (a tiny table, a real request and response), with "what to notice".
3. **The prompt toolkit as a game.** Your 50+ prompts as a library with a "which prompt fits this situation?" game.
4. **A stack track.** If you choose React Native or Next.js instead of Kotlin, a track that teaches those names.
5. **Guided practice projects.** The course's 13 projects (bill splitter and others) as step-by-step tasks.
6. **Search across the Learn Lab.** Today it is not in the search box.

## 7. Things I could not check

- Whether your documents are up to date: I checked them against the Handbook, not the whole internet.
- I wrote the lessons from my reading of your documents. I did not verify every sentence against an outside source. Facts that change are excluded or flagged.
