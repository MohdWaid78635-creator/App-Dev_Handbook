# UI Plan — 13 new features (calm-paper design, unchanged for existing screens)

Rules from the ui-ux-pro-max checks: contrast 4.5:1 text / 3:1 UI, 44px targets, every drag has a button alternative (WCAG 2.2 dragging), `prefers-reduced-motion` honoured, 1–2 animated elements per view, progress shown for multi-step flows, icon buttons always labelled.

## Dark palette (`[data-theme="dark"]`, same token names as `:root` in style.css)
Contrast measured with a script, not guessed.

| Token | Value | Check |
|---|---|---|
| --bg | #1b1915 | |
| --surface | #23201b | |
| --surface-2 | #2c2822 | |
| --ink | #ece6da | 14.1:1 on bg |
| --muted | #b3aa9a | 7.6:1 on bg, 6.4:1 on surface-2 |
| --line | #7f7666 | 3.9:1 on bg, 3.6:1 on surface (borders need 3:1; first tries #6b6354 and #756c5c were measured too low on one surface) |
| --accent / --accent-ink | #5fc2b9 / #7fd4cb | 10.2:1 on bg |
| --on-accent | #0f2a28 | 7.2:1 on accent |
| --accent-soft | #1f3a37 | ink on it 9.8:1 |
| --warm / --good / --info | #e59a73 / #7fc496 / #8fb7e3 | 7.1–7.9:1 on surface |
| --mark | #5c4d17 | ink on it 6.7:1 |

Switching: `data-theme` on `<html>`, set by the inline head script before paint (no flash). Choices: Auto (follows phone) / Light / Dark, stored in `guide.prefs`. `color-scheme` meta follows the choice. Chart and canvas colours read the CSS tokens, never hard-coded.

## Where each page links from
Top nav stays at 4 links (Quest, Learn, Help, Prompts). New pages go in the side list ("Tools" group) and on the Learn page; on phones they appear in the chapter drawer.

| Page | Route | Side-list label |
|---|---|---|
| Flashcards | #/cards | Flashcards |
| Daily challenge | #/daily | Daily challenge |
| Stats | #/stats | My progress |
| Feature board | #/moscow | Feature board |
| Stack picker | #/stack | Pick my stack |
| Cost calculator | #/cost | Cost calculator |
| Leaderboard + share card | #/scores | Scores & sharing |

Dark-mode toggle lives in the existing settings panel (a 3-way segmented control like Text size). Markdown export is a button on My App Sheets. Install prompt is a dismissible bar, shown only when the browser offers it.

## Components and states

**Reading time + ring (chapter header).** Text "~8 min read" plus a 40px SVG ring that fills with scroll. Ring has a text alternative ("42% read"). Replaces nothing else; the thin top bar stays. Reduced motion: no transition.

**Flashcards.** Single card centred, max 520px wide, 3D flip (200 ms). Whole card is one button (Enter/Space flips). Below it two 48px buttons: "Show again" and "I know this". Header: mastery ring "X / 85". States: loading (skeleton card), empty-deck-done ("All 85 mastered, review again?"), error (storage blocked message). Reduced motion: cross-fade instead of flip. Badge toast "Glossary Master".

**Daily challenge.** One question card using the existing quiz style. States: unanswered, correct, wrong (shows the answer and why), already-done-today (shows streak and countdown to tomorrow). Comeback card above it if a day was missed.

**Stats.** Stacked cards: 3 stat tiles (streak, best day, % of book), 30-day XP bar chart (canvas, 1px-gap bars, axis labels, a visually hidden data table for screen readers), 52×7 heatmap (scrolls horizontally inside its own box on phones, never the page). Empty state: "Earn your first XP to see this." Colour is never the only signal (values in the table and on tap).

**Boss fight (overlay).** Full-screen dialog (focus trapped, Esc asks "quit the fight?"). Top: level name, question n/5, 60 s timer ring that also shows the number. Large answer buttons (min 56px). Result screen: score, pass/fail, "Try again" / "Next level". Timer motion off under reduced motion (number only). Pass mark ≥3/5, attempt count shown.

**Scores & sharing.** Profile list as a table (Name · Rank · XP · Levels · Streak), add/rename/delete with confirm. "Share my progress" draws a 1080×1080 canvas card (app name, rank, XP, levels, date), downloads PNG, preview shown first.

**Feature board.** Phone (≤700px): columns stacked, each collapsible. Desktop: 4 columns. Every card has a "Move to…" menu (Must/Should/Could/Won't) plus up/down buttons, drag is an extra, not the only way. Print: 2×2 grid, no controls. Empty column: dashed "Nothing here yet".

**Stack picker.** One question per screen, "Step 2 of 5" with a progress bar, large option buttons, Back always available, answers kept on refresh. Result card: stack name, "why this fits", links to book sections, "Copy to My App Details" with confirmation toast.

**Cost calculator.** Form (labelled inputs, numeric keypad on phones) → live totals in ₹ and $, 4 budget checks as pass/fail rows with icon + text, "check the official pricing page" links. Invalid or empty numbers show the error beside the field.

**PWA install bar.** One line + "Install" and "Not now" buttons; "Not now" is remembered for 14 days. Offline: small "You are offline, saved data still works" notice.

## Layout and motion
- Breakpoints stay as existing (860px drawer, 700px for new grids); everything works at 320px with no sideways page scroll.
- One shared set of durations: 120 ms press feedback, 200 ms flip/fade, 300 ms ring fill. Exit faster than enter.
- Every new interactive element gets the existing focus ring; tap targets ≥44px; dark and light both tested.

## Changes made while building (the code plan and real code won out)
- **Stats:** plain HTML/CSS bars and grid instead of canvas, so dark mode and screen readers work for free. A "show as a table" fallback is included.
- **Cost calculator:** no new page. The existing Cost table (section 3.5 checks, whole-paise maths) got a "show dollars too" rate box. The book gives no prices on purpose, so none were preloaded.
- **Leaderboard "profiles":** each app already is its own quest, so the table lists apps. No separate profile editor.
- **Progress ring:** the thin top bar stays; the ring is a small fixed circle on chapter pages, plus "~N min read" under the title.
- **Stack picker:** answers map to the book's own backend (5.3), sign-in (5.4) and spending-limit (5.7) advice. iPhone and website answers say plainly that the book does not cover them.
- **Boss fight:** a required gate (user's choice) with "Practice without the timer", and levels finished earlier are counted as passed so nobody is locked out.
