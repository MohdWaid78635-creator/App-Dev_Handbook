# App Guide — Interactive Learning Upgrade Plan

A prioritised roadmap of features to add on top of the existing
Quest, Learn Lab, Help Desk, Search, My App Sheets, Check My Project, and A–Z Index.

---

## Priority Tiers

| Tier | Label | Effort | Reward |
|---|---|---|---|
| 🥇 | **Quick Win** | < 2 hrs | Big practical impact |
| 🥈 | **High Value** | 2–6 hrs | Deepens learning |
| 🥉 | **Polish** | 1–3 hrs | Better UX / retention |
| 🏆 | **Big Feature** | 1–2 days | Major new capability |

---

## 🔥 High Impact — Learning & Engagement

### 1. PWA / Offline Mode 🥇
**Files to add:** `guide/manifest.json`, `guide/sw.js`  
**Edit:** `guide/index.html` (add `<link rel="manifest">` + SW registration script)

- Add `manifest.json` with app name, icons, theme colour
- Register a service worker that caches all `guide/` files on first load
- Users get "Install App" prompt on Android (Chrome) and iPhone (Safari → Add to Home Screen)
- Works fully offline after first visit — no internet needed ever again

**Done when:** Lighthouse PWA score ≥ 90, install prompt appears on Android Chrome.

---

### 2. Flashcard Mode 🥈
**New file:** `guide/flashcards.js`  
**Edit:** `guide/index.html`, `guide/style.css`, `guide/app.js` (add `#/cards` route + nav link)

- Source: the 85 glossary words already in `data.js`
- Card flips on tap/click (CSS 3D transform)
- Spaced repetition: wrong cards reappear sooner (simple SM-2 bucket system stored in `localStorage`)
- Buttons: **I know this ✓** / **Show again ↩**
- Progress ring: "X / 85 mastered"
- Badge: "Glossary Master" when all 85 mastered once

**Done when:** All 85 words cycle correctly and state persists across page reloads.

---

### 3. Daily Challenge 🥈
**New file:** `guide/daily.js`  
**Edit:** `guide/app.js` (add `#/daily` route), `guide/index.html`

- One quiz question per calendar day, seeded from today's date so everyone gets the same question
- Sources questions from Learn Lab quizzes + chapter quizzes already in `learn-data.js` and `game-data.js`
- Ties into the existing streak system: answering counts as a streak day
- "Comeback challenge": if streak was broken, show the missed day's question too
- Badge: "7-Day Streak", "30-Day Streak"

**Done when:** Question changes at midnight, correct answer increments streak, badge awarded.

---

### 4. Chapter Audio (Text-to-Speech) 🥉
**Edit:** `guide/app.js` (reader view), `guide/style.css`

- Play / Pause / Stop button in the chapter header
- Uses `window.speechSynthesis` — zero cost, zero internet, built into every modern browser
- Reads the visible chapter text aloud
- Speed control: 0.75× / 1× / 1.25× / 1.5×
- Saves speed preference to `localStorage`

**Done when:** Button reads chapter text aloud, pause/resume works, speed saves.

---

### 5. Progress Dashboard / Stats Page 🥈
**New file:** `guide/stats.js`  
**Edit:** `guide/app.js` (add `#/stats` route), `guide/index.html`

- XP earned per day — bar chart for last 30 days (pure `<canvas>`, no library)
- Time spent reading per chapter (track `visibilitychange` + page unload)
- GitHub-style contribution heatmap (52 weeks × 7 days grid, colour = XP that day)
- "You are X% through the whole book" (sections read ÷ 191)
- Personal bests: longest streak, most XP in a day

**Done when:** Dashboard shows real data from `localStorage`, chart renders on mobile.

---

## 🎮 Gamification Upgrades

### 6. Boss Fight Mode 🏆
**Edit:** `guide/game.js`, `guide/game-data.js`, `guide/game.css`

- Triggered when the user clicks "Complete Level" on any Quest level
- 5 questions from that level's chapters, 60-second timer
- Must score ≥ 3/5 to unlock the next level (retries allowed, attempt count shown)
- Score badge shown on the Journey map stop for that level
- Dramatic UI: dark overlay, timer ring, score reveal animation

**Done when:** Boss fight blocks level completion, score persists on Journey map.

---

### 7. Local Leaderboard / Score Card 🥉
**Edit:** `guide/backup.js` or new `guide/scorecard.js`

- Multiple named profiles can be saved on the same device (family, study group)
- Leaderboard table: Name · Rank · XP · Levels done · Streak
- "Export Score Card" → generates a PNG via `<canvas>` with rank, XP, app name, date
- Download or long-press to share on WhatsApp / social

**Done when:** Two profiles show different XP, PNG downloads correctly.

---

## 🛠 Practical Builder Tools

### 8. Feature Prioritizer — MoSCoW Board 🥈
**New file:** `guide/moscow.js`  
**Edit:** `guide/app.js` (add `#/moscow` route), `guide/index.html`

- Four columns: **Must · Should · Could · Won't**
- Add feature cards (name + 1-line note), drag between columns (HTML5 drag-and-drop)
- Saves to the current app's `localStorage` slot
- Print-ready: hides drag handles, shows clean 2×2 grid
- Included in the backup file

**Done when:** Cards drag between columns, survive reload, print cleanly.

---

### 9. Tech Stack Picker 🥈
**New file:** `guide/stackpicker.js`  
**Edit:** `guide/app.js` (add `#/stack` route), `guide/index.html`

5-question wizard:
1. What type of app? (mobile / web / both)
2. Team size? (just me / 2–3 / bigger)
3. Monthly budget? (free / < ₹2k / more)
4. Deadline? (< 1 month / 1–3 months / flexible)
5. Tech comfort? (beginner / some coding / developer)

Output: recommended stack card (e.g. "Supabase + React Native + Expo") with:
- Why this fits your answers
- Links to the exact book sections that explain each tool
- One-click "Copy stack to My App Details"

**Done when:** All 32 answer combinations produce a sensible, book-linked recommendation.

---

### 10. Cost Calculator 🥈
**New file:** `guide/cost.js`  
**Edit:** `guide/app.js` (add `#/cost` route), `guide/index.html`

- Pre-loaded with common services: Supabase, Firebase, Expo EAS, Razorpay, Cloudflare, Vercel, etc.
- User enters: expected users/month, features used (auth, DB, storage, notifications, payments)
- Auto-totals monthly cost in ₹ and $
- Runs the book's 4 budget checks (section 3.5) and flags any that fail
- Links to official pricing pages (user must verify — same rule as the Facts page)
- Saves to current app's data, included in backup

**Done when:** Calculator shows correct totals, budget checks flag correctly, saves persist.

---

## 📱 Mobile / UX Polish

### 11. Dark Mode 🥉
**Edit:** `guide/style.css`, `guide/game.css`, `guide/app.js`

- Toggle button in the settings panel (the sliders button, top right)
- CSS custom properties already used → add a `[data-theme="dark"]` block
- Respects `prefers-color-scheme: dark` on first visit
- Saves preference to `localStorage` alongside text size and focus mode

**Done when:** Toggle switches all pages, preference saved, no FOUC on reload.

---

### 12. Reading Time Estimate 🥉
**Edit:** `guide/app.js` (reader view), `guide/style.css`

- Calculate: word count ÷ 200 wpm → round up to nearest minute
- Show "~8 min read" in the chapter header
- Replace the flat progress bar with a circular progress ring (SVG, no library)
- Ring fills as the user scrolls through the chapter

**Done when:** Estimate shows on every chapter, ring tracks scroll position.

---

## 📤 Sharing & Export

### 13. Share My Progress Card 🥉
**Edit:** `guide/backup.js` or new `guide/scorecard.js`

- Button on the Quest page: "Share my progress"
- Draws on a hidden `<canvas>`: app name, rank badge icon, XP number, levels done, today's date, "Built with App Builder's Handbook"
- Download as PNG (mobile: long-press → Save Image)

**Done when:** PNG downloads, looks good on a phone screen at 1080 px wide.

---

### 14. Export to Markdown / Notion 🥉
**Edit:** `guide/backup.js`

- New button on the My App Sheets page and Decisions Log: "Export as Markdown"
- Formats App Info, Decisions Log, and Cost Table as clean `.md`
- Ready to paste into Notion, Obsidian, or `PROJECT_LOG.md` / `CLAUDE.md`
- File downloads as `my-app-export-YYYY-MM-DD.md`

**Done when:** Exported file opens correctly in Notion and Obsidian.

---

## Build Order (Suggested)

```
Phase 1 — Ship fast (this week)
  11. Dark Mode
  12. Reading Time + Progress Ring
   4. Chapter Audio (TTS)
  11. PWA / Offline

Phase 2 — Deepen learning (next week)
   2. Flashcard Mode
   3. Daily Challenge
   5. Progress Dashboard

Phase 3 — Power tools (week 3)
   8. MoSCoW Board
   9. Tech Stack Picker
  10. Cost Calculator

Phase 4 — Gamification & sharing (week 4)
   6. Boss Fight Mode
   7. Local Leaderboard
  13. Share Progress Card
  14. Export to Markdown
```

---

## Checklist

- [ ] 1. PWA / Offline Mode
- [ ] 2. Flashcard Mode
- [ ] 3. Daily Challenge
- [ ] 4. Chapter Audio (TTS)
- [ ] 5. Progress Dashboard / Stats
- [ ] 6. Boss Fight Mode
- [ ] 7. Local Leaderboard / Score Card
- [ ] 8. Feature Prioritizer (MoSCoW Board)
- [ ] 9. Tech Stack Picker
- [ ] 10. Cost Calculator
- [ ] 11. Dark Mode
- [ ] 12. Reading Time Estimate + Progress Ring
- [ ] 13. Share My Progress Card
- [ ] 14. Export to Markdown / Notion
