# App Builder's Handbook – Interactive Guide

A searchable, gamified web companion to *The App Builder's Handbook*, built from the PDFs with no server required.

## Live site
Deployed on Vercel → [app-dev-handbook.vercel.app](https://app-dev-handbook.vercel.app)

## What's inside

| Feature | Description |
|---|---|
| 📖 Reader | All 24 chapters, searchable with synonym matching |
| 🚀 Quest | 16 gamified levels from idea to live app (XP, badges, boss gates) |
| 🧪 Learn Lab | 14 short interactive modules with mini-games and quizzes |
| 🛠 Help Desk | Step-by-step troubleshooting for 10 common crises |
| 📋 My App Sheets | App info, decisions log, cost table |
| ✅ Check My Project | Scans your folder for the book's required files |
| 🔍 A–Z Index | 336 topics across all features, filterable |
| 🃏 Flashcards | The 85 glossary words as flip cards with spaced repetition |
| 📅 Daily challenge | One question a day that keeps your streak going |
| 📈 My progress | XP chart, activity grid, reading time |
| ⚔️ Boss fights | 5-question gate at the end of each quest level (3 right to pass, optional timer) |
| 🏆 Scores and sharing | Scores for every app on the device, plus a shareable progress card (PNG) |
| 🗂 Feature board | Must / Should / Could / Won't board with print layout |
| 🧭 Pick my stack | 5 questions, then a recommendation taken from the book's own advice |
| 🌙 Dark mode, reading time, offline install | Settings → Colours; works offline once installed (needs https) |

## Build Quest
Build Quest covers all 13 stages (0–12) with 55 step cards and 13 boss fights for the Expo + Supabase Android track. Each card includes actions, an AI prompt, observable proof, recovery guidance, and dated sources. Optional modules include explicit skip decisions. Stage 10 prepares a test-track release and holds production; Stage 11 completes the operational prerequisites and final production launch gate.

Run `node guide/check-game.mjs` to validate book coverage, offline assets, complete playbook stages, card metadata, and boss answers. The content research and validation record for Stages 6–12 is in `research/STAGES_6-12_NOTES.md`. Documentation review does not mean the example Expo app was built or tested on a device.

## Run locally

Just double-click `guide/index.html` — no install, no server needed. (Offline install and the service worker need http(s), so they only work on the deployed site or a local server.)

## Rebuild data from PDFs
```bash
# Requires Node.js and pdftotext (bundled with Git for Windows)
node guide/build.mjs
```
This reads `App_Builders_Handbook_Book1.pdf` and `App_Builders_Handbook_Book2_Print_Pack.pdf` and writes `guide/data.js`.

> **Note:** PDFs are excluded from this repo (`.gitignore`). Keep them in the same folder locally to rebuild.

## Deploy to Vercel
```bash
npx vercel
```
Or connect this GitHub repo in the Vercel dashboard — it auto-deploys on every push.

## Tech stack
Vanilla JS · No frameworks · No build step for end users · All data saved in browser `localStorage`
