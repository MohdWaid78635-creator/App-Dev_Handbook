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

## Run locally
Just double-click `guide/index.html` — no install, no server needed.

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
