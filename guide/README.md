# My App Guide (prototype)

A searchable web version of *The App Builder's Handbook*, made from the PDFs in the folder above.

## Use it
Double-click `index.html`. It opens in your browser. Nothing to install and no internet needed.

- **Easy on the eyes:** the app uses one calm paper look. The sliders button (top right) sets text size and Focus mode, which hides the chapter list. Choices are remembered.
- **Reading helpers:** a thin bar shows how far you are through a chapter, "On this page" follows you, sections fold with their arrow, and chapters you finished reading get a green mark. On a phone, the chapter list opens from the menu button.
- **Search box:** suggestions appear as you type (arrow keys + Enter). Press `/` or Ctrl+K to jump to it. Type any word or plain question. Everyday words also find the book's words: "login" finds sign-in and OTP, and "hacked" finds security. If a word is in the glossary, its meaning shows first in a green box.
- **Purple boxes:** "Tell the AI" prompts. Press **Copy** and paste them into your AI builder.
- **Quest (the game):** name your app, tick what kind of app it is, and play 16 levels (Basecamp plus the book's 15 stages) from planning to a live app and keeping it healthy. Each level has missions (what it is, the exact prompt to copy for your AI, and proof boxes to tick), an optional quiz built from the book's own stories, a boss gate (the book's "done means" proofs), and bonus quests. Points (XP), ranks, badges and the unlocking of the next level all come from your ticks, so they always match your real progress. Each app has its own save.
- **Journey map:** on the Quest page, a winding trail through all 16 levels. Finished stops turn green, a marker shows "You are here", and a trophy waits at the finish. The left sidebar also shows a small tracker with one dot per level.
- **Chapter list on/off:** the button at the top left hides or shows the left sidebar on a computer (it is remembered), and opens it as a slide-in list on a phone.
- **My app details (fill-in prompts):** type your idea, who it is for, your business name and your feature lists once (the "My app details" link, or the idea box when you start). Every prompt with a blank for them is filled in, the filled parts are shown in green, and any blank still open is shown in orange with a note. Each level also gets a ready "Start this level" prompt with the stage already filled in. Format examples inside prompts, like "As a [type of user]", are left alone on purpose.
- **Check my project:** pick your project folder and it tells you which of the book's 15 notes files (CLAUDE.md, DATA_MAP.md and so on) are there, which are missing, which are almost empty, and which are due by your current level. It also checks the book's secrets rule (7.4): a `.env` or key file in the folder needs a `.gitignore` that blocks it. It only reads file names and the words in `.gitignore`, never your code, and nothing is sent anywhere. It does not tick boxes for you.
- **Next small step and streak:** the Quest page opens with one card: the single next thing to do (the first unfinished mission and the exact proof to look for), and a count of days in a row. A day counts when you tick a box, copy a prompt or answer a quiz question. Missing a day resets the streak but your best run is kept, and unticking never removes a day. The week dots show the last 7 days. There are two streak badges. It does not send reminders (a web page cannot do that without being installed as an app), so put a repeating note in your phone's calendar.
- **Proof next to each tick box:** under every proof box press **Add proof** to save a note, a link or a picture (a screenshot, for example). Pictures are shrunk to about 100 KB and at most 12 are kept per app, because the browser only allows about 5 MB for the whole site. Notes and pictures are included in your backup file. The **My proof** page lists everything you saved, with a Print button, to show a human expert. A badge rewards saving proof for 5 boxes.
- **My app sheets:** the book's Print Pack sheets typed in the app instead of on paper. The **App info sheet** (promise, users, MUST and NOT-now features, user-talk notes, budget, accounts, expert advice), the **Decisions log** (date, decision, why, options rejected) and the **Cost table**, which starts with the book's own list of common costs and has no prices on purpose: you type what the official page says and link to it. Money is added in whole paise/cents, so there are no rounding errors. The cost table compares your cost at 1,000 users with your monthly budget and shows the book's four checks from section 3.5 (it only reports them, you still tick the boxes). Everything saves as you type, can be copied as text (the decisions log is formatted for PROJECT_LOG.md) or printed, and is in your backup. The accounts field refuses anything that looks like a password or key.
- **Facts that change:** every "check the date" box in the book (17 of them: Google Play rules, India's DPDP law, Supabase plans, security standards) in one list, with when the book read each one and when you last checked it. Press **I checked this today** after you have opened the official page yourself. Facts older than your chosen number of days (30, 60, 90 or 180; the book gives no number, 90 is this guide's suggestion) show as due, a banner appears on the Quest page, and Level 13 reminds you to re-check everything before launch. Five facts also show the official page this guide cross-checked them against on 22 Nov 2026. The app cannot look anything up for you or know that a fact changed.
- **Something broke? (help desk):** pick what is going wrong (hacked or a key leaked, a bad update is live, crashes, a jumping bill, wrong money, the AI broke something, you do not trust "done", stuck in circles, slow, unknown state, Play rejection) and get the book's own steps for it in the book's order: stop the damage, find out, fix, prevent. Each step shows the exact prompt to copy and the proof to demand. Nothing is invented: every step is a section of the book, and `check-game.mjs` fails if a section number stops matching its title.
- **Real tables:** the 11 edge-case groups (A to K, 58 rows) in Chapter 11 are real tables with a "Tested?" box per row, and stack as cards on a phone. The build checks every group's row count against the tick boxes in the PDF and stops if they differ. Other tables in the book are still plain text, because reading them safely needs the PDF's drawing lines, which the text tool cannot see.
- **Learn Lab:** 14 short modules (how apps work, planning, design, frontend, backend, databases, APIs, security, mobile security, Google Play, payments, shipping, after launch, directing the AI) with examples, small games (put steps in order, match terms), a quiz, a "check the AI" tip and an "explain it back" box. Built from your own `builder_docs` files, reworded in plain English. Each build level links to the modules it uses. Progress and points are yours, not per app. The plan, what was missing, and where your documents disagree with the Handbook are in `LEARNING_GAME_PLAN.md`.
- **Bonus quests from your own documents:** six extra quests (market research, pricing, the critical "will it break?" checks, ASO, analytics events, week 1). Each is labelled as coming from your documents and not checked against official sources.
- **Loading skeletons:** while the app starts (a fraction of a second on a fast computer, longer on a slow one), every kind of page shows a grey outline of its own shape: reader, home, search results, quest, level, Learn Lab, help, facts, forms, A to Z index. The chapter list shows grey lines too. They stay still if you ask your computer for reduced motion. If the app never starts, a plain message replaces the skeleton after 15 seconds, so you are never left on an endless loading screen. The Check my project page shows one while it reads a big folder. Moving between pages after the app has loaded is instant, so it does not flash a skeleton.
- **One search for everything (the index):** the search box now also finds Learn Lab modules, help desk problems, facts that change, bonus quests, quest levels and tools, each with a label saying what it is. The **A to Z index** page lists all of it (336 topics) alphabetically, with a filter box, a kind filter and letter jumps. The index is rebuilt from the app's own data each time, so it can never be out of date.
- **All prompts:** every prompt in the book on one page, with a filter.
- **Open page N in the PDF:** shows the original page, which is useful for tables.

## Update it when the PDFs change
```
node build.mjs
```
This reads `../App_Builders_Handbook_Book1.pdf` and `../App_Builders_Handbook_Book2_Print_Pack.pdf`, then writes `data.js`.
It stops with `BUILD CHECK FAILED` if chapters or prompts go missing.
It needs Node and `pdftotext`, which comes with Git for Windows.

The `Handbook_Review_Group*.pdf` files are older drafts of the same chapters, so the build skips them.

## Files
| File | Job |
|---|---|
| `build.mjs` | PDF → `data.js` (pull step + self-check) |
| `data.js` | generated content, do not edit |
| `synonyms.js` | everyday word → book words for search. Add your own words here. |
| `journey.js` | the 15 stages and their "done means" proofs (the boss gates), typed by hand from Chapter 2 |
| `game-data.js` | the levels, which book sections each one plays, the app-type table, and the bonus quests. Each bonus quest says if it comes from the book or was added by this guide, with a source and the date checked |
| `game.js`, `game.css` | the game screens |
| `backup.js` | save progress to a file and load it back |
| `check.js` | "Check my project" (the file list it uses is `projectFiles` in `game-data.js`) |
| `evidence.js` | notes and pictures saved with proofs, and the My proof page |
| `myapp.js` | My app sheets: App info sheet, Decisions log, Cost table (the starting cost rows are `costItems` in `game-data.js`) |
| `facts.js` | the Facts that change page. Short titles and the cross-check notes are `factInfo` and `verifiedFacts` in `game-data.js`; `check-game.mjs` fails if the book gains a "check the date" box that has no title |
| `help.js` | the Something broke? help desk (the problems are `helpTopics` in `game-data.js`) |
| `learn-data.js`, `learn.js` | the Learn Lab (the modules are in `learn-data.js`; `check-game.mjs` validates them) |
| `search-index.js` | the search index for non-Handbook pages and the A to Z page |
| `fill.js` | "My app details" and the filling of prompt blanks. To change which blanks are filled, edit `USER_BLANKS` and `value()` there |
| `check-game.mjs` | run `node check-game.mjs` after changing levels: it fails if any section of the book is left out of the game |
| `index.html`, `app.js`, `style.css` | the app |

## Saved progress, one save per app
Each app you create in the Quest has its own ticks, points, quiz answers and badges. The "Your app" box at the top of the left list switches between them, and **Delete** removes one app's save.
Everything is saved in this browser only. It does not move to another browser or computer, and clearing your browser data deletes it.

**Back it up.** Open the sliders button (top right) and press "Save to a file". It makes one small `.json` file with every app's progress. "Load from a file" puts it back, on this or another computer or browser. Loading REPLACES what is saved in that browser, so it asks first, and it refuses files that are not a backup from this app. The Quest page reminds you if you have progress but no backup in the last 7 days.

## Added by this guide, not in your PDF
Five bonus quests are not in the book. Each says so on screen. Two have facts checked against Google's own pages on 22 Nov 2026 (the permanent application ID, and the store listing sizes), and three are plain guidance with no hard rules. A sixth, "Start your Google Play developer account now", is only a reminder moved earlier from Chapter 15.
