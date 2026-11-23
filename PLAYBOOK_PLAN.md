# Vibe Coder Playbook — Expo + Supabase edition (plan)

**Promise:** from zero to a live Android app, one step at a time. Every step says what to do, what to paste, how you know it worked, and what to do when it breaks.

**"Industrial" means:** every claim has a source and a checked-on date, every step has a proof, every risky step has a rollback, and nothing launches past a gate until its checks pass. No step is written from memory: Expo, Supabase and Play Store rules change often, so each step is written from the official docs read on the day.

## Who it is for
A first-time builder who uses an AI tool (Claude Code, Cursor, ChatGPT) to write the code and does not read it. Their question is "what do I do right now, and how do I know it worked?"

## The step card (one format for all steps)
| Part | Content |
|---|---|
| Why | 2 plain lines |
| Do | numbered actions, one thing each |
| Prompt | copy-ready, filled from the user's own app answers |
| Proof | "you should see…" checks the user can confirm without reading code |
| If stuck | prompt that wraps the pasted error and asks the AI to explain before fixing |
| Risk and rollback | what can go wrong, how to undo (git commit before, how to revert) |
| Cost | money or limits, with the official price page |
| Source | official doc link + checked-on date + tool versions used |

## Stages (Expo + Supabase, Android first)
0 Set up the workshop · 1 Idea check and scope · 2 Project skeleton (Expo Router, strict TypeScript, rules file, git, env files) · 3 Backend (Supabase, separate dev and prod) · 4 Sign-in · 5 Database and access rules (RLS) · 6 Core screens · 7 Optional modules (payments, push, offline) · 8 Testing · 9 Security pass · 10 Build and release (EAS, signing keys, Play Console, 14-day closed test) · 11 Run live (crash reports, OTA updates, backups, spend caps) · 12 Keep it healthy.
iPhone is a later module. The existing Android/Kotlin chapters stay as a separate track.

## Quality gates
- A stage is done only when every proof is ticked (existing proof and evidence tools are reused).
- Launch gate: no secrets in the repo, access rules tested with two users, spend cap on, backup restore tried once, closed test finished.
- Every step carries the tool versions it was tested with. When a tool changes, the "Facts that change" page flags the step as due for review.

## How it gets built
1. **Engine (about a week):** step data file + one renderer, step states `todo / doing / done / stuck`, "I'm stuck" prompt builder, per-app progress. Vanilla JS, same as now.
2. **Content, stages 0 to 5, then 6 to 12:** each step drafted from official docs, source and date recorded.
3. **Tests:** extend `check-game.mjs` so the build fails if any step lacks a prompt, proof, stuck prompt, source or date, or points at a missing section.
4. **Real-user test:** 5 first-time builders attempt stages 0 to 5 while watched. Fix wherever they stop, then repeat.

## Open decisions
1. Name and tone: keep "App Guide" or rename (for example "Vibe Coder Playbook") and drop the playful rank names for professional ones.
2. Keep XP, badges and the boss fight, or tone them down for a more professional feel.
3. Go ahead with researching official docs for stages 0 to 5 first.
