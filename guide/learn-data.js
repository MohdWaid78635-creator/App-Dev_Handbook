// learn-data.js: the Learn Lab. 14 short modules that teach the ideas behind building an app, so you can understand
// what the AI builds instead of depending on it. Built from YOUR documents in builder_docs (the Master Course,
// the AI Builder Playbook, the Mobile App Security Guide, the Dev Prompt Toolkit and the Prompt Engineering module),
// reworded in plain English with examples. Every module follows the course's own pattern:
//   UNDERSTAND IT, SEE IT (example), KNOW THE TERMS, TRY IT (small games), CHECK THE AI, EXPLAIN IT BACK.
// Numbers that change over time (fees, percentages, review times) are deliberately left out: see "Facts that change".
// Where your documents disagree with the Handbook or with Google, the module says so in a "note" and uses the safer source.
//
// Question types:  choice {q, options, answer (index), why}
//                  order  {q, items (in the CORRECT order, shown shuffled), why}
//                  match  {q, pairs [[left, right], ...], why}   (right sides may repeat: that makes a sorting game)
// levels = build-quest levels that use this; sections = Handbook sections that go with it (checked by check-game.mjs).
window.LEARN = {
  sources: [
    { file: 'AppBuildersMasterCourse-1.docx', what: 'the 13-chapter Master Course (the base of modules 1 to 8, 10, 11, 12)' },
    { file: 'AI_Builder_Master_Playbook.docx', what: 'planning steps, launch channels, week 1, the 25 signs of breaking, golden rules' },
    { file: 'APP_SECURITY_GUIDE.md', what: 'the mobile security guide (module 9)' },
    { file: 'dev-prompt-toolkit.html', what: 'the master prompt formula (module 14)' },
    { file: 'prompt-engineering-module.html', what: 'the genie story and prompt recipe (module 14)' },
  ],
  modules: [
    { id: 'how-apps-work', title: 'How apps really work', blurb: 'The one picture every builder needs: a restaurant.', src: 'Master Course ch. 1', levels: [0, 5], sections: ['5.1', '5.2'],
      cards: [
        { h: 'Every app is a restaurant', body: 'The dining room is what you see and tap (the frontend). The kitchen is where the real work happens (the backend). The recipe book is where everything is kept (the database). The waiter carries orders between them (the API).', ex: 'You open a bill-splitting app and tap “Split”. The screen is the dining room. A waiter (API) carries your order to the kitchen (backend). The kitchen checks the recipe book (database) and sends the answer back, and your screen updates.' },
        { h: 'The three layers', body: 'Frontend: what people see. It has no real power of its own, it only shows things and passes taps on. Backend: the hidden engine with the rules. Database: permanent storage. The frontend can call a data API, such as Supabase, under the signed-in user’s permissions. The server enforces the rules.', ex: 'The rule “you cannot book a ride if you have unpaid bills” lives in the backend. If it lived only on the screen, anyone could skip it.', note: 'Never keep passwords or payment details in the frontend. Anyone who knows where to look can read it.' },
        { h: 'Request and response', body: 'A client (your phone) sends a request (“give me my bills”). A server answers with a response (the data, an error, or a confirmation). They talk in HTTP, and HTTPS is the secure version. On your own computer while building, the “server” is called localhost.', terms: [['Client', 'The device making a request. Your phone is a client.'], ['Server', 'A computer in the cloud that answers requests.'], ['HTTPS', 'The secure way clients and servers talk.'], ['Localhost', 'Your own computer acting as a server while you build.'], ['Environment', 'Local (your computer), staging (a test copy), production (live for real users).']] },
        { h: 'Web app or mobile app?', body: 'A web app lives in a browser and updates the moment you redeploy. A mobile app lives in the Play Store, needs store approval to update, can use the camera, GPS and other device features, and users must install it.', ex: 'Fixing a typo on a website: redeploy and it is live. Fixing it in a Play Store app: build, submit, wait for approval, then users update.', note: 'The store takes a cut of in-app payments. The exact percentage changes, so check the official page.' },
      ],
      try: [
        { type: 'match', q: 'Match each part of the restaurant to its part of an app.', pairs: [['Dining room', 'Frontend'], ['Kitchen', 'Backend'], ['Recipe book', 'Database'], ['Waiter', 'API']], why: 'Whatever app you meet, from Instagram to WhatsApp, it is the same structure. Only the size changes.' },
        { type: 'order', q: 'Put what happens when you tap “Split bill” in the right order.', items: ['The screen sends a request', 'The backend checks the rules', 'The backend reads and writes the database', 'The backend sends a response', 'The screen updates'], why: 'The screen asks, the backend decides, the database remembers, the screen shows the result.' },
      ],
      quiz: [
        { q: 'Where should a rule like “a user cannot book with unpaid bills” live?', options: ['Only on the screen', 'In the backend', 'In the app’s icon file'], answer: 1, why: 'The screen can be changed or skipped by anyone. The backend is the place that enforces rules.' },
        { q: 'Why is it risky to keep a payment secret in the frontend?', options: ['It makes the screen slow', 'Anyone who knows where to look can read it', 'The database will delete it'], answer: 1, why: 'Everything in the frontend is visible to the person using it.' },
        { q: 'What is “localhost”?', options: ['A city', 'Your own computer acting as a server while you build', 'A store for apps'], answer: 1, why: 'It lets you test without putting anything on the internet.' },
      ],
      ai: ['Ask your AI: “Draw a simple diagram of my app in words: the frontend, the backend, the database, and every request between them.”', 'Check the answer: does every piece of data have one home, the database? Does the backend (not the screen) enforce every rule?'],
      explain: 'In your own words: what happens, step by step, when you tap a button in an app that shows your data?' },

    { id: 'plan-first', title: 'Plan before you build', blurb: 'Prove people want it, then build the smallest useful version.', src: 'Master Course ch. 2 and Playbook phase 1', levels: [1, 2, 4], sections: ['3.1', '3.2', '3.3', '3.4'],
      cards: [
        { h: 'A confused plan makes confused code', body: 'Most failed apps fail before any code is written, because the builder did not know what they were building. AI cannot rescue a vague brief: it confidently builds the wrong thing.', ex: '“Build me a social app” gets you a random app. “A bill splitter for groups of friends in India, where one person adds a bill and everyone sees what they owe” gets you something real.' },
        { h: 'Five questions before you build', body: 'Who exactly has this problem? How do they solve it today? Would they pay for a better way? How many of them are there? Who else is solving it? If there is no workaround today, the problem may not be real. If nobody would pay, you have a hobby, not a business.', ex: 'Free ways to check: Google Trends (is interest growing?), Reddit (are people complaining?), 1-star reviews of competing apps (those are your features), a free Tally survey, or a one-day waitlist page.' },
        { h: 'A one-page plan (PRD)', body: 'A PRD says: the problem, the target user, user stories, the feature list with a NOT-in-scope list, how you will know it works, your limits (money, time) and what you do not know yet.', ex: 'User story: “As a pet owner in Hyderabad, I want to see verified rehoming listings near me, so that I do not scroll through listings from other cities.”' },
        { h: 'The MVP test', body: 'MVP means the smallest version that delivers real value. For each feature ask: would users leave without it? Would removing it break the core value? Is it just nice to have? Can you do it by hand first? Write everything down, then cross off about 60%.', ex: 'Airbnb’s early version reportedly had no online payments: the founders collected cash by hand. They proved the idea before building the hard part (this is the Master Course’s example).' },
      ],
      try: [
        { type: 'match', q: 'Bill-splitter app, version 1. Keep or cut each feature?', pairs: [['Split one bill between friends', 'Keep'], ['Simple login', 'Keep'], ['Referral rewards', 'Cut'], ['Dark mode and 5 themes', 'Cut'], ['Admin dashboard', 'Cut'], ['Data saves and loads correctly', 'Keep']], why: 'Keep only what the app is useless without. Everything else waits for version 2.' },
      ],
      quiz: [
        { q: 'There is no workaround today for the problem. What does the course say?', options: ['Great, no competition', 'A possible red flag: the problem may not be real', 'It proves people will pay'], answer: 1, why: 'If nobody has bothered to work around the problem, ask whether it really hurts.' },
        { q: 'Which question is better to ask a possible user?', options: ['“Would you use this?”', '“Would you pay for this?”', '“Do you like blue?”'], answer: 1, why: 'Polite people say yes to “would you use it”. Paying shows real demand.' },
        { q: 'A feature is “nice to have”. For version 1 you…', options: ['Build it first', 'Cut it', 'Hide it behind a menu'], answer: 1, why: 'A feature you did not build cannot be a bug.' },
      ],
      ai: ['Ask your AI: “Act as a strict investor. Give me 5 reasons my idea could fail and 5 questions to ask real users.” (The Handbook has this exact prompt in section 3.1.)', 'Check the answer: did it make you write the NOT-in-scope list? A plan with no “not now” list is not finished.'],
      explain: 'Explain why “would you pay for this?” tells you more than “would you use this?”, using your own app idea.' },

    { id: 'design-basics', title: 'Design that people understand', blurb: 'Eight rules that make an app feel professional.', src: 'Master Course ch. 3 and Playbook phase 2', levels: [4], sections: ['4.1', '4.2', '4.3', '4.4', '4.6'],
      cards: [
        { h: 'UI is how it looks. UX is how it feels.', body: 'A beautiful screen that confuses people is a car with a gorgeous body and no steering wheel. A clear app that looks plain keeps users but does not get shared. You need both.', ex: 'Pretty button, but nothing happens when you tap it for two seconds: good UI, poor UX.' },
        { h: 'Eight rules of good UI', body: 'Hierarchy (the most important thing is the biggest). Spacing (empty space is breathing room). Typography (no more than 2 fonts). Colour (one main colour, one accent, one neutral). Consistency (same things look the same). Feedback (every tap gets a response). Accessibility (readable contrast, big touch targets, never colour alone). Mobile first (design the small screen first).', ex: 'If the back arrow is top-left on screen 1, it must be top-left on every screen. Inconsistency destroys trust.', note: 'Your Handbook says tap targets of at least 48 x 48 dp on Android. Use that number, it is the one Google gives (see the dated fact on accessibility).' },
        { h: 'Draw before you design', body: 'A wireframe is a black-and-white sketch of a screen: grey boxes for pictures, wavy lines for text, rectangles for buttons. Colour is a distraction at this stage. Every screen has ONE job, and you draw all its states: empty, loading, error, success.', ex: 'The “My bills” screen with no bills yet should show a friendly picture and a button “Add your first bill”, never a blank page.' },
        { h: 'Patterns users already know', body: 'Bottom navigation with at most five items. A short welcome tour before sign-up. An empty state with a clear next action. Pull down to refresh. Grey placeholders while content loads. A small message at the bottom (“Saved!”). A panel that slides up for quick actions.', ex: 'A skeleton (grey animated boxes) feels faster than a spinner because the screen already looks like its final shape.' },
      ],
      try: [
        { type: 'match', q: 'Which rule does each example follow?', pairs: [['Tapping Pay shows a spinner, then “Payment done”', 'Feedback'], ['The back arrow is in the same place on every screen', 'Consistency'], ['Text is readable by someone with weak eyesight', 'Accessibility'], ['The “Pay” button is the biggest thing on the screen', 'Hierarchy']], why: 'Name the rule and you can tell the AI exactly what is wrong with a screen.' },
      ],
      quiz: [
        { q: 'A list screen has no data yet. What should it show?', options: ['A blank white page', 'An empty state: a picture and a clear next action', 'An error message'], answer: 1, why: 'Never leave users on a blank screen. Tell them what to do next.' },
        { q: 'How many fonts should one app use at most?', options: ['2', '5', 'As many as you like'], answer: 0, why: 'Use size and weight, not more fonts, to show importance.' },
        { q: 'Why wireframe in black and white?', options: ['Colour costs more', 'Colour distracts you from the layout', 'Phones cannot show colour'], answer: 1, why: 'First decide what goes where. Make it pretty second.' },
      ],
      ai: ['Ask your AI: “Draw wireframes in words for these 5 screens, and list the empty, loading, error and offline state of each.”', 'Check the answer: does every screen have its four states, and does each screen have only ONE main job?'],
      explain: 'Pick one screen of an app you use. Which two of the eight rules does it follow best, and how can you tell?' },

    { id: 'frontend', title: 'What users see: the frontend', blurb: 'Components, state and routing in plain English.', src: 'Master Course ch. 4', levels: [4, 7], sections: ['5.2', '4.4'],
      cards: [
        { h: 'Structure, style, behaviour', body: 'Every frontend is made of three things: structure (what elements exist), style (how they look) and behaviour (what happens when you tap). Modern tools such as React or, on Android, Jetpack Compose, take care of the plumbing.', note: 'Your documents teach the web and React Native world. The Handbook builds Android in Kotlin with Jetpack Compose. The ideas below are the same in both: only the names differ.' },
        { h: 'Components are LEGO blocks', body: 'A component is a reusable piece of screen: a button, a card, a navigation bar. You build one great steering wheel and reuse it in every car, not a new one each time.', ex: 'A UserCard that shows a name and photo is used on the profile screen, the friends list and the bill details. Change it once and it changes everywhere.' },
        { h: 'State is the screen’s memory', body: 'State is data that changes over time and makes the screen update. Local state belongs to one component (is this menu open?). Global state is shared (who is logged in?). Server state is data fetched from the backend (the list of bills). Most frontend bugs come from state, so keep it as local as you can.', ex: 'Whether a menu is open is local state. The logged-in user is global state. Your list of bills is server state.' },
        { h: 'Routing: which screen to show', body: 'Routing decides which screen appears for a given action. A stack of screens (tap a bill, go deeper, Back pops one). Tabs (Home, Search, Profile). Parameters tell a screen which item to open. Protected routes send you to login if you are not signed in.', ex: 'Opening “bill 123” passes 123 to the details screen. Opening it when logged out sends you to login first.' },
      ],
      try: [
        { type: 'match', q: 'Which kind of state is each?', pairs: [['Is this dropdown open?', 'Local state'], ['The logged-in user’s profile', 'Global state'], ['The list of products from the database', 'Server state']], why: 'Keep state as local as you can. Share it only when several parts really need it.' },
      ],
      quiz: [
        { q: 'A component is…', options: ['A reusable piece of screen', 'A kind of database', 'A password rule'], answer: 0, why: 'Reuse is the whole point: change once, fixed everywhere.' },
        { q: 'A user opens a private screen while logged out. A “protected route” should…', options: ['Show it anyway', 'Send them to login', 'Crash'], answer: 1, why: 'Protected routes check sign-in before showing a screen. (The backend must check too.)' },
        { q: 'Why is “state” the source of most frontend bugs?', options: ['It is new every year', 'Several parts of the screen can disagree about the same data', 'It is stored in the cloud'], answer: 1, why: 'When two parts hold different copies of the truth, the screen shows nonsense.' },
      ],
      ai: ['Ask your AI: “Which parts of my app are local state, global state and server state? List them.”', 'Check the answer: is anything important kept only on the screen? If so, ask why it is not in the backend.'],
      explain: 'Explain “state” to a friend using a shopping cart as the example.' },

    { id: 'backend', title: 'The engine room: the backend', blurb: 'What happens on the server, and why secrets stay there.', src: 'Master Course ch. 5', levels: [5, 8], sections: ['5.4', '5.5', '7.4', '8.4'],
      cards: [
        { h: 'What the backend is for', body: 'The backend lives on a server, never on the user’s phone. It does everything that must not happen in the user’s hands: checking who you are and what you may do, applying the app’s rules, cleaning data before it reaches the database, talking to outside services (payments, email, AI), and security checks such as rate limiting.', ex: 'Charging a card, sending a receipt email and checking “is this user an admin?” all happen in the backend.' },
        { h: 'A login, step by step', body: 'Tap Login: the screen sends the email and password to the backend. The backend checks the input is sensible, looks the email up in the database, compares the password with its stored scrambled (hashed) version, and if it matches sends back a token. The screen keeps the token and sends it with every later request.', ex: 'The whole round trip usually takes a fraction of a second, which is why server location matters for speed.' },
        { h: 'Where does the backend run?', body: 'An always-on server (you pay even with no visitors). Serverless functions (code that runs only when asked, you pay per request). Edge functions (serverless close to the user). Or a ready-made backend service (like Supabase or Firebase) that already includes login, a database and file storage.', ex: 'A solo builder on free plans often picks a ready-made backend, so there is no server to look after.' },
        { h: 'Secrets stay out of your code', body: 'API keys, database passwords and tokens must never be written into the code. Keep them in environment variables or the service’s secret settings. Never commit a .env file to Git. If a key lands on GitHub, bots find it within minutes and run up charges.', ex: 'Keys with a “public” prefix are visible to everyone. Never put a secret key behind a public name.', note: 'Your Handbook adds: the service-role key ignores all access rules and must never reach an app or a website (sections 7.4 and 14.2).' },
      ],
      try: [
        { type: 'order', q: 'Put the login steps in the right order.', items: ['Screen sends email and password', 'Backend checks the input is sensible', 'Backend looks the user up and compares the hashed password', 'Backend sends back a token', 'Screen stores the token for later requests'], why: 'The password is checked on the server, never on the phone.' },
        { type: 'match', q: 'Safe or dangerous?', pairs: [['API key in a .env file that is in .gitignore', 'Safe'], ['Secret key typed straight into a code file', 'Dangerous'], ['Secret key in the host’s secret settings', 'Safe'], ['Secret key committed to GitHub', 'Dangerous']], why: 'Secrets live outside the code and outside Git.' },
      ],
      quiz: [
        { q: 'You push a secret key to GitHub by mistake. What is the right reaction?', options: ['Delete the file, that is enough', 'Rotate the key: make a new one and stop the old one', 'Wait and see'], answer: 1, why: 'Bots copy keys within minutes. Deleting the file does not remove it from history. The old key must be killed.' },
        { q: 'What does “middleware” do?', options: ['Runs between a request arriving and your code, as a checkpoint', 'Stores photos', 'Draws buttons'], answer: 0, why: 'Typical checkpoints: is this token valid, has this user asked too many times, is the data the right shape.' },
        { q: 'Why is a ready-made backend (like Supabase) good for a solo builder?', options: ['It needs no database', 'Login, database and storage are already built', 'It is always free'], answer: 1, why: 'Less to build means less to get wrong. Free plans have limits, so check the pricing.' },
      ],
      ai: ['Ask your AI: “List every secret my app uses, where each one is stored, and prove none is in the code or the Git history.”', 'Check the answer: ask to see the search it ran. “I checked” is not proof (the Handbook, section 7.4).'],
      explain: 'Explain why a login password is checked on the server and not on the phone.' },

    { id: 'databases', title: 'Where everything is kept: databases', blurb: 'Tables, relationships and why the design must come first.', src: 'Master Course ch. 6', levels: [6], sections: ['6.1', '6.2', '6.3', '6.4', '6.6'],
      cards: [
        { h: 'A database is permanent memory', body: 'A variable in code disappears when the server restarts. A database keeps data until you delete it: accounts, orders, messages. The costliest mistake is changing its structure after real users have put data in it, so design it before launch.', ex: 'Rename a column on a live app and the old app version, still using the old name, crashes for everyone who has not updated.' },
        { h: 'SQL or NoSQL?', body: 'SQL databases (like PostgreSQL) store tables with fixed columns, like a spreadsheet, and link them with relationships. NoSQL databases store flexible documents, like JSON files, and you manage relationships yourself. For most business apps, SQL is the right default.', ex: 'Orders belong to customers and contain products: that is a web of relationships, which SQL handles for you.' },
        { h: 'Tables, columns, rows, keys', body: 'Each table is one kind of thing (users, bills). Each column is one detail (name, created_at). Each row is one record. Every row has a unique id (the primary key). A foreign key is a column that points to another table’s id, like user_id on a bill.', ex: 'Good habit: table names plural and lowercase (users, bills), a created_at and updated_at on every table.' },
        { h: 'How tables connect', body: 'One-to-one: a user has one profile. One-to-many: a user has many listings (most common). Many-to-many: many users like many posts, which needs a small “junction” table that holds pairs (user_id, post_id).', ex: 'A user creates many bills; each bill belongs to one user, so the bills table has a user_id.' },
        { h: 'Indexes and rules', body: 'An index is like the index of a book: finding things is fast, but every write has to update it, so index only what you search by often (foreign keys and the columns you filter on). Row Level Security (RLS) rules decide which user may see which row.', note: 'Your course says Supabase backups are automatic. Your Handbook (section 6.4, a dated fact) says the Free plan has NO automatic backups and Pro keeps 7 days. Believe the Handbook, and prove a restore yourself.' },
      ],
      try: [
        { type: 'match', q: 'Which relationship is each?', pairs: [['One user, one profile', 'One-to-one'], ['One user, many bills', 'One-to-many'], ['Many users like many posts', 'Many-to-many']], why: 'Many-to-many always needs a junction table between the two.' },
        { type: 'match', q: 'Index it or not?', pairs: [['A column you filter by in most searches', 'Index it'], ['Every foreign key column', 'Index it'], ['A note field nobody searches', 'Skip it']], why: 'Indexes speed up reading but slow down writing, so use them where they pay.' },
      ],
      quiz: [
        { q: 'You have a many-to-many link between users and posts. You need…', options: ['A junction table', 'A second database', 'Nothing'], answer: 0, why: 'A table like likes (user_id, post_id) stores the pairs.' },
        { q: 'What does Row Level Security (RLS) do?', options: ['Makes queries faster', 'Controls which user can see which row', 'Encrypts the app'], answer: 1, why: 'It is the lock on your data, and the Handbook’s most important database rule.' },
        { q: 'When is the worst time to change the structure of the database?', options: ['Before any users', 'After real users have data in it', 'On a Monday'], answer: 1, why: 'Changes on live data are risky. Use migrations: saved, tested, reversible steps.' },
      ],
      ai: ['Ask your AI: “Write DATA_MAP.md: every piece of data we store, why, who can see it, and how long we keep it.” (Handbook section 6.1.)', 'Check the answer: is there data you do not really need? Data you never collect cannot leak.'],
      explain: 'Describe the tables you would need for a bill-splitting app, and how they connect.' },

    { id: 'apis', title: 'How software talks: APIs', blurb: 'Requests, status codes, webhooks and limits.', src: 'Master Course ch. 7', levels: [5, 8], sections: ['8.9', '9.1'],
      cards: [
        { h: 'An API is a contract', body: 'An API (Application Programming Interface) is an agreement between two pieces of software: “if you ask me in this format, I answer in that format.” Every service you will use, such as payments, maps, AI or Supabase, has one.', ex: 'A weather app asks a weather API for “Hyderabad, today” and gets back temperature data it can show.' },
        { h: 'REST: nouns and verbs', body: 'A REST API is built around things (bills, users) and actions on them: GET reads, POST creates, PUT replaces, PATCH changes part, DELETE removes. A request has a URL, headers (like your token), sometimes a body of data, and optional filters in the address.', ex: 'GET /bills?limit=20 reads 20 bills. POST /bills with a body creates one.' },
        { h: 'Status codes are the language of errors', body: '2xx means it worked (200 OK, 201 Created). 4xx means YOU asked wrongly (400 bad input, 401 not logged in, 403 not allowed, 404 not found, 429 too many requests). 5xx means the SERVER failed (500 crashed, 503 unavailable).', ex: 'A 401 means “log in first”. A 403 means “you are logged in, but this is not yours”.' },
        { h: 'Webhooks and limits', body: 'With a normal API you call and wait. With a webhook, the other service calls YOU when something happens, such as a payment finishing. Every API also limits how often you may call it, and replies 429 when you go too fast, which is why caching matters.', ex: 'A payment service sends your server “payment captured”. Your server must verify it is real before marking the order paid.' },
      ],
      try: [
        { type: 'match', q: 'What does each status code mean?', pairs: [['200', 'It worked'], ['401', 'Not logged in'], ['403', 'Logged in but not allowed'], ['404', 'Not found'], ['429', 'Too many requests'], ['500', 'The server failed']], why: 'Reading the code first tells you whether the mistake is yours, the user’s or the server’s.' },
        { type: 'match', q: 'Which method fits?', pairs: [['Read my bills', 'GET'], ['Create a new bill', 'POST'], ['Delete a bill', 'DELETE']], why: 'The method is the verb, the address is the noun.' },
      ],
      quiz: [
        { q: 'The app gets a 403. What is most likely wrong?', options: ['The server crashed', 'The user is logged in but is not allowed to do this', 'The internet is off'], answer: 1, why: '403 means “I know who you are, and no.” 401 means “I do not know who you are.”' },
        { q: 'A webhook is…', options: ['A call from the other service to you when something happens', 'A website you design', 'A kind of password'], answer: 0, why: 'You must always check it is genuine before trusting it.' },
        { q: 'You get a 500. Whose problem is it first?', options: ['The user’s', 'The server’s: look at the logs', 'The phone’s'], answer: 1, why: '5xx means the server failed. 4xx means the request was wrong.' },
      ],
      ai: ['Ask your AI: “List every API call my app makes, with method, address, what it sends, what it returns and which error codes it can give.”', 'Check the answer: for every call, does it say who may make it and what happens on a 401, 403 and 429?'],
      explain: 'Explain the difference between a 401 and a 403 to someone who has never heard of either.' },

    { id: 'security-basics', title: 'Keep users safe: security basics', blurb: 'Who are you, what may you do, and the common attacks.', src: 'Master Course ch. 8', levels: [3, 8], sections: ['8.1', '8.2', '8.3', '8.4', '8.5'],
      cards: [
        { h: 'Authentication and authorisation', body: 'Authentication: WHO are you (login, OTP, Google sign-in). Authorisation: WHAT may you do after that. Both must be checked on every protected request. Without authorisation, any logged-in person can read anyone else’s data.', ex: 'You log in as Asha. You change the address in a link from bill 456 to bill 789 and see someone else’s bill. Authentication passed, authorisation was missing.' },
        { h: 'Tokens (JWT) in one minute', body: 'After login the backend gives your app a signed token that proves who you are. The app sends it with every request, and the backend checks the signature each time.', note: 'Your course says never keep the token in the browser’s localStorage: that is advice for websites. On Android your Handbook (section 8.2) and the mobile security module use secure storage. The ideas are the same: keep tokens where other apps and scripts cannot read them.' },
        { h: 'Six attacks to know', body: 'Injection: an attacker types database commands into a form. XSS: an attacker slips a script into a page other people open. Weak login: no limits, no expiry. IDOR: change an id in the address to see someone else’s data. Misconfiguration: debug mode left on, default passwords, open storage. Sensitive data exposure: returning passwords or full card numbers in a response.', ex: 'The fix for injection is parameterised queries or a trusted library, never gluing user text into a query.' },
        { h: 'Passwords and limits', body: 'Never store passwords in plain text. Store a slow, salted one-way hash (bcrypt is the standard). Fast hashes such as MD5 or SHA-1 are not for passwords. Reset links are single-use and time-limited, and you never email a password. Rate limits stop guessing: for example, a few login attempts, then a temporary lock. HTTPS encrypts everything in transit.', ex: 'If you use a managed login (Supabase Auth, Clerk), password hashing is handled for you. That is one strong reason to use one.' },
      ],
      try: [
        { type: 'match', q: 'Which fix goes with which attack?', pairs: [['Injection', 'Parameterised queries or a trusted library'], ['IDOR (changing an id)', 'Check that the user owns the item'], ['Brute-force login', 'Rate limit and lock out'], ['Leaked password list', 'Salted slow hash such as bcrypt']], why: 'Each attack has a boring, standard fix. Know them and you can ask for them by name.' },
      ],
      quiz: [
        { q: 'A user changes /bills/456 to /bills/789 and sees another person’s bill. Which check is missing?', options: ['Authentication', 'Authorisation: does this user own bill 789?', 'HTTPS'], answer: 1, why: 'They were logged in (authenticated) but nothing checked they owned it.' },
        { q: 'Which is the right way to store passwords?', options: ['Plain text, it is simpler', 'A slow, salted one-way hash', 'Encrypted, with the key beside it'], answer: 1, why: 'If the database leaks, hashes cannot be turned back into passwords.' },
        { q: 'Why does a small app still need security?', options: ['It does not, nobody cares', 'Bots scan everything for exposed keys and open data', 'Google requires a trophy'], answer: 1, why: 'Attackers automate. App size is irrelevant to a bot.' },
      ],
      ai: ['Ask your AI: “Run a user A versus user B test: log in as A and try to read B’s data. Show me the results.” (Handbook sections 6.3 and 8.3.)', 'Check the answer: it must show real test output. “I made it secure” is not proof.'],
      explain: 'Explain the difference between “who are you” and “what may you do”, with an example from a shopping app.' },

    { id: 'lock-mobile', title: 'Lock down your mobile app', blurb: 'The practical checks, in the order to fix them.', src: 'APP_SECURITY_GUIDE.md', levels: [8, 10], sections: ['8.4', '8.6', '8.7', '12.4', '12.7'],
      cards: [
        { h: 'Ask for specific checks', body: 'Never tell the AI “make my app secure”. That tells it nothing. Say “audit my app for hardcoded secrets and fix them” or “check what my app saves on the phone”. Specific asks get specific results.', ex: 'Bad: “make it secure”. Good: “search my code and built app for API keys and show me what you found”.' },
        { h: 'Data on the phone and secrets in the app', body: 'Plain key-value storage keeps data as ordinary readable files. Never put tokens or personal data there: use the phone’s secure storage. Anything bundled into the app can be unpacked with free tools, so API keys in the app file are in plain sight. A bot will find a key within hours of your listing going live.', ex: 'Your guide’s rule: keys that can cost money live on a server, and the app calls your server.', note: 'The guide is written for React Native with Expo. The Handbook’s Kotlin version of the same rules is in sections 8.4 and 8.6.' },
        { h: 'Sign-in links, logs and error messages', body: 'On Android, another app can register for a custom link scheme and steal sign-in tokens, so use verified app links instead. Leftover debug logs can leak data to anyone with a cable and a laptop. Detailed error messages tell an attacker how your database is built: show users a generic message and keep the detail in your logs.', ex: 'Instead of “column email not found in table users”, show “Something went wrong. Try again.”' },
        { h: 'Fix in this order', body: 'Before the first user: access rules on every table, no sensitive data in plain storage, no keys in the app, checks on every API call, a login check on every protected call. Before 100 users: limits on login and OTP, generic errors, fix high-severity library warnings, remove debug logs, force HTTPS. Later: certificate pinning and signed updates.', ex: 'Use the audit list before every release, and do not hand the whole job to the AI.' },
      ],
      try: [
        { type: 'order', q: 'Put these in the order to fix them (most urgent first).', items: ['Access rules on every database table', 'No privileged secrets inside the app', 'Rate limits on login and OTP', 'Remove debug logs', 'Certificate pinning'], why: 'The first two can expose every user today. Pinning is a later polish.' },
        { type: 'match', q: 'Safe or risky?', pairs: [['Auth token in the phone’s secure storage', 'Safe'], ['Auth token in plain key-value storage', 'Risky'], ['“Something went wrong, try again”', 'Safe'], ['“Column email not found in table users”', 'Risky']], why: 'Never hand an attacker a map of your system.' },
      ],
      quiz: [
        { q: 'Why can’t you keep an API key safe by putting it in the app?', options: ['The app is too small', 'Anyone can unpack the app and read it', 'Keys expire in a day'], answer: 1, why: 'The app file is on every user’s phone. Treat everything in it as public.' },
        { q: 'Which instruction is best to give the AI?', options: ['“Make my app secure”', '“Search for hardcoded secrets and show me the results”', '“Fix everything”'], answer: 1, why: 'Specific questions get checkable answers.' },
        { q: 'Which is “fix before the first user”?', options: ['Certificate pinning', 'Access rules on every database table', 'App icon colour'], answer: 1, why: 'A table anyone can read is the most common serious leak in AI-built apps (Handbook chapter 6).' },
      ],
      ai: ['Ask your AI: “Audit my app for [ONE area, for example hardcoded secrets] and show the evidence.”', 'Check the answer: run the search yourself or ask a fresh AI chat to check it (the Handbook’s second-AI audit, section 12.7).'],
      explain: 'Explain why “my app is too small to be a target” is the most dangerous thing a builder can believe.' },

    { id: 'mobile-store', title: 'Getting onto Google Play', blurb: 'From build to store listing, and how to be found.', src: 'Master Course ch. 9', levels: [13], sections: ['15.1', '15.2', '15.3', '15.4', '15.5'],
      cards: [
        { h: 'Phones are different from websites', body: 'Mobile apps move between screens in stacks (go deeper, Back returns) and tabs. They must ask permission before using the camera, location, notifications or contacts, and must still work if the user says no. They can store data on the phone so they work offline.', ex: 'Ask for the camera only when the user taps “Scan”, with one sentence on why. If they refuse, show a way to type instead.' },
        { h: 'Push notifications', body: 'Your server can message a phone even when the app is closed: the app registers with the device and gets a token, you save the token, and your server sends it with a message through the notification service. Send them only with a clear purpose and consent. Spam gets apps uninstalled.', ex: 'Good: “Asha paid you ₹200.” Bad: “We miss you!” every day.' },
        { h: 'The submission path', body: 'Create a Play developer account (a one-time registration, and a new personal account needs a closed test first: see the Handbook, chapter 15). Build a release bundle (AAB). Sign it with a key you must back up. Fill the store listing, the content rating questionnaire (answer honestly) and the Data safety and privacy policy forms. Install and test the uploaded candidate before requesting public release. Use a staged rollout for updates when appropriate.', note: 'Your course says the icon must have no transparency. Google’s own listing page says the app icon is a 512 x 512 PNG with alpha. Follow Google (this is the page the Handbook’s bonus quest uses). It also says the course’s review times and fees can change: see Facts that change.' },
        { h: 'ASO: being found', body: 'ASO is SEO for the Play Store. Put your main keyword in the title. Use the description naturally. Pick the most specific category. Ratings matter, so ask happy users to rate. Regular updates help ranking, and so does how fast you collect installs.', ex: '“Bill Splitter: Split Expenses” can be found by people searching “bill splitter”.' },
      ],
      try: [
        { type: 'order', q: 'Put the launch path in order.', items: ['Build a signed release bundle', 'Set up the listing and required declarations', 'Upload the bundle to a Play test track', 'Verify the installed build and complete applicable closed testing', 'Request review and production release'], why: 'Verify the same candidate you intend to release. Staged rollouts apply to updates after the initial publication.' },
        { type: 'match', q: 'Which is the right way to ask for permission?', pairs: [['Ask for the camera when the user taps Scan, with a reason', 'Good'], ['Ask for five permissions on the first screen', 'Bad'], ['Show a way to type when the user refuses', 'Good']], why: 'Ask at the moment you need it, and always have a plan for “no”.' },
      ],
      quiz: [
        { q: 'A user refuses the camera permission. Your app should…', options: ['Crash', 'Keep working and offer another way', 'Ask again every second'], answer: 1, why: 'Handling “no” is part of the app, not an error.' },
        { q: 'What must you do with the app signing key?', options: ['Post it in your README', 'Back it up safely, offline and in a password manager', 'Email it to the AI'], answer: 1, why: 'Protect both keys. With Play App Signing, a lost upload key can be reset without changing the app signing key.' },
        { q: 'Which helps your Play ranking?', options: ['Your main keyword in the title', 'A longer app name with emojis', 'Never updating'], answer: 0, why: 'Titles are limited in length, so make each word count.' },
      ],
      ai: ['Ask your AI: “Draft my store listing: honest short and full descriptions, a plan for 4 to 8 screenshots from the real release build, and every form I must complete.” (Handbook section 15.4.)', 'Check the answer: does every claim and screenshot match the app as it is today? “Coming soon” features get listings flagged.'],
      explain: 'Explain what you would say to a user to make them happy to allow notifications.' },

    { id: 'money', title: 'Getting paid', blurb: 'Payment flows, pricing models and subscriptions.', src: 'Master Course ch. 10', levels: [2, 8], sections: ['8.9', '3.5'],
      cards: [
        { h: 'Two kinds of payment tools', body: 'Payment gateways (such as Razorpay or Stripe) take cards, UPI and wallets for goods and services. Store billing (Google Play Billing) is the store’s own system. Google requires Play Billing for digital goods and subscriptions sold inside an Android app, with different rules by country.', note: 'Fees and percentages in your course change. Check each official pricing page and the dated fact on payment rules before you decide.' },
        { h: 'A subscription payment, step by step', body: 'The user taps Subscribe. Your backend creates the subscription with the payment service. The screen opens the payment sheet. The payment service tells your backend (a webhook) that it succeeded. Your backend verifies the webhook is genuine and marks the user subscribed. The screen then asks your backend, not the payment sheet, whether it worked.', ex: 'The classic mistake is marking someone as paid because the screen said so. Screens and callbacks can be faked: only a verified message to your server counts.' },
        { h: 'Pick a pricing model', body: 'Free tier plus paid upgrade (freemium). Free trial then pay. One flat price. Tiers (Free, Starter, Pro). Pay per use. One-time purchase. Pricing is a product decision: the free version must be genuinely useful, and local payment habits matter (in India, UPI support is key).', ex: 'AI tools often charge per use, so the cost to you and the price to the user move together.' },
        { h: 'The whole subscription life', body: 'Upgrades mid-month need a fair split of the price. Cancelling should keep access until the period ends. Failed payments need reminders, retries and a grace period before downgrading. Have a clear refund policy and process refunds through the payment dashboard, never by hand. Offering a pause reduces cancellations.', ex: 'A card expires. You send a friendly note, retry the charge, and only after a grace period move the user to the free plan.' },
      ],
      try: [
        { type: 'order', q: 'Put the subscription payment steps in the right order.', items: ['User taps Subscribe', 'Backend creates the subscription', 'Payment sheet opens on the screen', 'Payment service sends a webhook to the backend', 'Backend verifies the webhook and marks the user subscribed'], why: 'The last step is the only one that can be trusted.' },
        { type: 'match', q: 'Trust it or not?', pairs: [['“Payment done” shown on the phone screen', 'Do not trust alone'], ['A webhook whose signature your server verified', 'Trust'], ['A user saying “I paid”', 'Do not trust alone']], why: 'Money decisions are made on your server, from verified messages.' },
      ],
      quiz: [
        { q: 'When should a user be marked “subscribed”?', options: ['When the screen says success', 'When your backend verifies the payment service’s webhook', 'When they tap Subscribe'], answer: 1, why: 'Only a verified server-side message is proof.' },
        { q: 'A user cancels a monthly plan on day 10. What is best?', options: ['Cut access immediately', 'Keep access until the period ends', 'Charge a fee'], answer: 1, why: 'It is fairer and gives a better experience.' },
        { q: 'Why does the Handbook say to see a human expert for payments?', options: ['Payments are boring', 'Mistakes lose real money and break laws', 'The AI cannot read'], answer: 1, why: 'Use a licensed gateway, never store card data, and get expert review before real payouts.' },
      ],
      ai: ['Ask your AI: “Show the full payment flow, step by step, and where my server verifies the payment before granting anything.” (Handbook section 8.9.)', 'Check the answer: is anything granted before a verified server-side confirmation? Is a double-tap on Pay safe?'],
      explain: 'Explain why the phone screen saying “payment done” is not enough to unlock a paid feature.' },

    { id: 'ship-and-run', title: 'Shipping and keeping it running', blurb: 'Save points, environments, automatic checks and monitoring.', src: 'Master Course ch. 11', levels: [7, 13, 14], sections: ['7.1', '7.5', '5.6', '16.1', '16.2'],
      cards: [
        { h: 'Three environments', body: 'Local is your own computer. Staging is a safe copy for testing, using test payment keys. Production is live for real users. Skipping staging is how builders delete real data while testing.', ex: 'Even a free preview copy of every change counts as a staging environment.' },
        { h: 'Git: undo for your whole project', body: 'Git records every change. A repository is the tracked folder. A commit is a saved snapshot with a message saying what changed. A branch is a separate line of work, merged back when it is good. A .gitignore lists what Git must NOT track, such as .env and build folders. Push sends your commits to GitHub.', ex: 'Commit early and often. A commit is free. Losing four hours of work is not.' },
        { h: 'CI/CD: robots that check', body: 'Continuous integration runs your tests and a build on every save. Continuous deployment can then release automatically. This catches mistakes before users see them. For a solo project a simple automatic check on every push is a great start.', ex: 'You push a change that breaks the login test. The robot turns red, and the change never reaches users.' },
        { h: 'Know when it breaks', body: 'Your app will break in production. Find out from monitoring, not from an angry user: error tracking (every crash, with details), uptime checks (alerts if the app is down), and performance and user analytics. Look at the dashboards on a schedule.', ex: 'The Playbook’s rhythm: 15 minutes to start the day (new errors, yesterday’s activity, one goal) and 15 to end it (commit, test on a phone, note what broke).' },
      ],
      try: [
        { type: 'order', q: 'Put a safe release in order.', items: ['Save your work with a commit', 'Automatic checks run on the change', 'Try it on a staging copy', 'Release to a few users first', 'Release to everyone'], why: 'Each step catches mistakes while they are still cheap.' },
        { type: 'match', q: 'Should Git track it?', pairs: [['Your source code', 'Yes'], ['The .env file with secrets', 'No'], ['Generated build folders', 'No']], why: 'Secrets and generated files stay out of Git.' },
      ],
      quiz: [
        { q: 'Why have a staging copy?', options: ['To look professional', 'To test safely without touching real users’ data', 'Because Git needs it'], answer: 1, why: 'Mistakes in staging hurt nobody.' },
        { q: 'What is a commit?', options: ['A saved snapshot with a message', 'A password', 'A paid plan'], answer: 0, why: 'It is a save point you can return to.' },
        { q: 'How should you first hear that your app crashed?', options: ['From a user review', 'From your error tracker’s alert', 'Never'], answer: 1, why: 'Alerts to your phone are part of the Handbook’s running-it chapter (16.3).' },
      ],
      ai: ['Ask your AI: “After every change, make a save point and tell me what it contains and how to go back to it.”', 'Check the answer: can you see the save point list yourself? If you cannot go back, you do not have a save point.'],
      explain: 'Explain to a friend why you should commit your work very often.' },

    { id: 'after-launch', title: 'After launch: learn and grow', blurb: 'What to measure, how to listen, and how apps grow.', src: 'Master Course ch. 12 and Playbook phases 5 and 6', levels: [14, 15], sections: ['16.4', '17.1', '17.2', '16.5'],
      cards: [
        { h: 'Launch is the starting gun', body: 'Most products fail because founders launch and wait. The goal for the first month is to talk to real users: call them, message them, sit with them. Do not add new features in week 1. Fix what is broken first.', ex: 'The Playbook’s week 1: check errors daily, watch where users get stuck, answer every piece of feedback within a day, and track one core number daily.' },
        { h: 'Measure what matters', body: 'Vanity numbers (downloads, page views) look good in screenshots and say little. Look at retention: of the people who signed up, how many are still using it after a day, a week, a month? Set up analytics BEFORE launch, and track the key actions from day one, such as bill created, payment completed.', ex: 'A funnel: Sign up, then Create a bill, then Invite friends, then Settle the bill. The biggest drop shows what to fix first.', note: 'Your Handbook (section 16.4) adds a rule your course does not stress: analytics must follow the user’s consent choice, and never record personal data such as email addresses.' },
        { h: 'Growth loops', body: 'A growth loop is when your existing users bring in new ones. User creates value, shares it, others join, they create value. Examples: a shared bill link that non-users can see; content users make that attracts new users; a referral that rewards both sides, which only works if the product is already good.', ex: 'Someone splits a bill and sends the link to friends who have not got the app yet. That link is the loop.' },
        { h: 'Feedback systems', body: 'In the first 60 days, feedback is your most valuable resource. Make it easy: a Send Feedback button, an error tracker you check weekly, a place where requests are logged, and short monthly calls with a few power users, which beat 100 survey answers.', ex: 'Weekly: ship one small improvement and write one update. Monthly: review pricing and talk to three active users. Quarterly: security audit and update libraries.' },
      ],
      try: [
        { type: 'match', q: 'Vanity metric or useful metric?', pairs: [['Total downloads', 'Vanity'], ['Users still active after 7 days', 'Useful'], ['Page views', 'Vanity'], ['Signup to first bill created', 'Useful']], why: 'Useful numbers tell you whether people get value.' },
        { type: 'order', q: 'Put the funnel in order.', items: ['Sign up', 'Create a bill', 'Invite friends', 'Settle the bill'], why: 'Count how many people drop out at each step.' },
      ],
      quiz: [
        { q: 'What should you do in week 1 after launch?', options: ['Add many new features', 'Fix what is broken and listen to users', 'Stop checking'], answer: 1, why: 'Real users find problems you cannot.' },
        { q: 'Why set up analytics before launch?', options: ['It looks good', 'You cannot improve what you did not measure', 'It is required by Google'], answer: 1, why: 'You only get one first week.' },
        { q: 'Analytics and privacy: your Handbook says…', options: ['Record everything', 'Follow the user’s consent and never record personal data', 'Analytics is illegal'], answer: 1, why: 'Section 16.4: an analytics library that recorded emails and shared them was a breach waiting to happen.' },
      ],
      ai: ['Ask your AI: “List 8 events to track from day one, what each tells me, and confirm none contains personal data and all follow consent.”', 'Check the answer: could any event identify a person without their consent?'],
      explain: 'Describe one growth loop that could work for your app.' },

    { id: 'direct-the-ai', title: 'Direct the AI like a builder', blurb: 'Write prompts that work, and check what comes back.', src: 'Master Course ch. 13, Dev Prompt Toolkit, Prompt Engineering module', levels: [0, 7], sections: ['0-5', '19.4', '7.3', '1-4'],
      cards: [
        { h: 'The AI is a genie', body: 'The AI does exactly what you SAY, not what you mean. “Make me something nice” gets a random thing. “Make a blue button that says Buy Now and shows a success message when tapped” gets exactly that. The better your wish, the better your result.', ex: 'Vague: “make me a login page”. Specific: the screen, the fields, the error message, the colour, the components to use.' },
        { h: 'The prompt recipe', body: 'Role (who the AI should act as). Context (what you are building, with what, and what exists already). Task (one clear action). Constraints (what it must and must NOT do). Format (how to answer). Then ask it to check its own work.', ex: 'Role: you are a security engineer. Context: I am building a bill splitter with these tables. Task: write the rule that lets users read only their own bills. Constraints: do not change other tables. Format: explain first, then the change.' },
        { h: 'Habits that save hours', body: 'One task per prompt. Always give context, because the AI remembers nothing between chats. State what NOT to do. Paste the real code or the exact error, not a description. End with “check your answer for…”. The more your prompt names the architecture, the better the result.', ex: 'Weak: “it is not working”. Strong: the full error message, the code, and what you already tried.' },
        { h: 'Review like an architect', body: 'Never ship what you do not understand. Check security (inputs cleaned, secrets safe, login and ownership checked). Check structure (right layer, errors handled, works with 10,000 users). Check quality (simple enough?). And demand proof: test results, a screenshot, anything temporary listed. If you cannot explain it, ask the AI to explain it until you can.', ex: 'The Handbook’s six questions (section 0-5) and “demand proof” prompt (19.4) do exactly this.', note: 'AI fails in five known ways (invents facts, fakes passing tests, forgets decisions, takes shortcuts, over-builds). Handbook chapter 1 shows how to catch each one.' },
      ],
      try: [
        { type: 'order', q: 'Put the prompt recipe in order.', items: ['Role', 'Context', 'Task', 'Constraints', 'Format'], why: 'Role and context first, so the AI knows who it is and what it is working on.' },
        { type: 'match', q: 'Strong or weak prompt?', pairs: [['“Make me a login page”', 'Weak'], ['“Here is my exact error and the code. What have I missed?”', 'Strong'], ['“Fix everything”', 'Weak'], ['“Change only the Pay button. Do NOT touch login.”', 'Strong']], why: 'Specific, bounded, with the real material pasted in.' },
      ],
      quiz: [
        { q: 'Why paste the real error and code instead of describing them?', options: ['It looks neater', 'The AI fixes actual code and only guesses at descriptions', 'It is shorter'], answer: 1, why: 'Descriptions lose the one detail that mattered.' },
        { q: 'The AI says “done”. What is the builder’s next move?', options: ['Ship it', 'Ask for proof: tests, a screenshot, anything unfinished', 'Ask it to say it again'], answer: 1, why: 'Done means proof, not words (Handbook, golden rule 1).' },
        { q: 'You do not understand the code the AI wrote. You should…', options: ['Ship it anyway', 'Ask it to explain until you do, and never ship what you cannot explain', 'Delete the project'], answer: 1, why: 'If the AI wrote it, YOU are responsible for understanding it (the Playbook’s golden rule).' },
      ],
      ai: ['Try this yourself: take any prompt you wrote today and rewrite it with Role, Context, Task, Constraints, Format. Compare the two answers.', 'Check the answer: ask the AI “what did you assume?” (question 4 in the Handbook’s six questions).'],
      explain: 'Rewrite one of your own vague requests as a strong prompt, and explain what you added.' },
  ],
};
