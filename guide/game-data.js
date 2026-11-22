// The game: worlds, levels and the extra quests. Everything else (missions, proofs, prompts, quiz) is built
// from data.js, which comes straight from your PDFs, so the game cannot drift from the book.
// Level n = stage n of the book's journey (Chapter 2). Level 0 "Basecamp" is the book's "how to use this book" part.
//
// sections: the book's sections played in this level, in order. A section becomes a MISSION if it has a prompt or
//   tick boxes (or is marked manual). Other sections are "read first" pages with no points.
//   Use { id, title, manual: true } to rename a section or to force a single "I did this" tick, or { id, read: true } to keep it a read-only page.
// intro: chapter intro sections shown as "what the book says" at the top of the level.
// extras: bonus quests (below). Each one says clearly if it comes from the book or was added by this guide.
window.GAME = {
  version: 1,
  checked: '22 Nov 2026', // the date the added quests and the book's dated facts were cross-checked
  worlds: [
    { id: 1, name: 'Idea Island', blurb: 'Decide what to build, and what NOT to build.' },
    { id: 2, name: 'Blueprint Bay', blurb: 'Plan the safe, simple shape of your app.' },
    { id: 3, name: 'The Builder’s Forge', blurb: 'Build with the AI, lock it, speed it up, break it.' },
    { id: 4, name: 'Launch Pad', blurb: 'Make it legal, make it manageable, make it live.' },
    { id: 5, name: 'Live City', blurb: 'Your app is live. Keep it healthy.' },
  ],
  levels: [
    { n: 0, world: 1, name: 'Basecamp', stage: 'Learn the rules',
      story: 'Before you build anything, learn how to drive the AI. You decide, the AI builds, and you demand proof.',
      intro: ['0', '1', '2'],
      sections: ['0-1', '0-2', { id: '0-3', read: true }, '0-4', '0-5', '0-6', '1-1', '1-2', '1-3', '1-4', '1-5', '1-6', '1-7', '1-8', '1-9', '2-1', '2-3', '18.4', '19.1', '19.3', '19.4', { id: 'P.2', manual: true }],
      boss: ['I copied the “6 questions” prompt into my notes app.', 'The project memory files (CLAUDE.md, PROJECT_BRIEF.md, PROJECT_LOG.md, TODO_NEXT.md, GLOSSARY.md) exist in my project.'],
      extras: [] },
    { n: 1, world: 1, name: 'Idea Spark', stage: 'Idea',
      story: 'Is this worth building? Talk to real people first. A great idea nobody wants is only a hobby.',
      intro: ['3'], sections: ['3.1', { id: 'P.1', manual: true }], extras: ['x-play', 'x-research'] },
    { n: 2, world: 1, name: 'The Blueprint', stage: 'Requirements',
      story: 'Write exactly what version 1 does, and what it does NOT do. Changing a sentence is free. Changing a built feature costs days.',
      sections: ['3.2', '3.3', '3.4', '3.5'], extras: ['x-earn', 'x-pricing'] },
    { n: 3, world: 2, name: 'Thief’s Eye', stage: 'Threat model',
      story: 'Think like a thief first. Who could attack or misuse your app, and which door would they try?',
      sections: ['8.1', { id: 'P.3', manual: true }], extras: [] },
    { n: 4, world: 2, name: 'Screen Studio', stage: 'Design (UX/UI)',
      story: 'Draw every screen before the AI builds anything, including the empty, loading, error and offline versions.',
      intro: ['4'], sections: ['4.1', '4.2', '4.3', '4.4', '4.5', '4.6', '4.7'], extras: ['x-onboard'] },
    { n: 5, world: 2, name: 'The Map Room', stage: 'Architecture',
      story: 'Choose the parts of your app and the tools behind it, and know what each one costs and how to leave it.',
      intro: ['5'], sections: ['5.1', '5.2', '5.3', '5.4', '5.5', '5.6', '5.7'], extras: ['x-appid'] },
    { n: 6, world: 2, name: 'The Vault', stage: 'Database',
      story: 'Your database is the storeroom of your business. Decide what you keep, who can see it, and prove you can restore it.',
      intro: ['6'], sections: ['6.1', '6.2', '6.3', '6.4', '6.5', '6.6'], extras: [] },
    { n: 7, world: 3, name: 'The Forge', stage: 'Build',
      story: 'Now the AI builds, in small steps, with a save point after each one. You check the proof, not the code.',
      intro: ['7', '18'], sections: ['7.1', '7.2', '7.3', '7.4', '7.5', '7.6', '18.1', '18.2', '18.3'], extras: [] },
    { n: 8, world: 3, name: 'The Fortress', stage: 'Security',
      story: 'Put locks on every door: logins, secrets, payments, abuse limits. This is the longest level, so take it one mission at a time.',
      intro: ['8', '9'],
      sections: ['8.2', '8.3', '8.4', '8.5', '8.6', '8.7', '8.8', '8.9', '8.10', '8.11', '8.11-1', '8.11-2', '8.11-3', '9.1', '9.2', '9.3', '9.4', '9.5', '9.6', '9.7', 'P.4'], extras: [] },
    { n: 9, world: 3, name: 'Speed Track', stage: 'Speed',
      story: 'Make the app fast and smooth on cheap phones and slow internet, with before-and-after numbers as proof.',
      intro: ['10'], sections: ['10.1', '10.2', '10.3', '10.4', '10.5', '10.6', { id: 'P.5', manual: true }], extras: ['x-scale'] },
    { n: 10, world: 3, name: 'Test Arena', stage: 'Testing',
      story: 'Try to break it before your users do: edge cases, automatic tests, a second AI as auditor, and your own real phone.',
      intro: ['11', '12'],
      sections: ['11.1', '11.1-1', '11.1-2', '11.1-3', '11.1-4', '11.1-5', '11.1-6', '11.1-7', '11.1-8', '11.1-9', '11.1-10', '11.1-11', '12.1', '12.2', '12.3', '12.4', '12.5', '12.6', '12.7', '12.8', 'P.6'], extras: [] },
    { n: 11, world: 4, name: 'The Rule Book', stage: 'Privacy & policy',
      story: 'Legal pages, user rights, the Play Console forms, and a plan for the day data leaks.',
      intro: ['13'], sections: ['13.1', '13.2', '13.3', '13.4', '13.5', '13.6', '13.7'], extras: [] },
    { n: 12, world: 4, name: 'Control Room', stage: 'Admin dashboard',
      story: 'Your private control room: admin-only login with a second check, roles, and a log of every admin action.',
      intro: ['14'], sections: ['14.1', '14.2', '14.3', '14.4', '14.5', '14.6', '14.7', '14.8', '14.9'], extras: [] },
    { n: 13, world: 4, name: 'Launch Pad', stage: 'Release',
      story: 'Put it on Google Play, slowly: a closed test first, then 1%, 10%, 50% and 100% of users.',
      intro: ['15'],
      sections: ['15.1', '15.2', '15.3', '15.4', '15.5', '15.6', '15.7', 'P.7', { id: '22', title: 'The “Before launch” page (Chapter 22)' }], extras: ['x-listing', 'x-aso', 'x-launch'] },
    { n: 14, world: 5, name: 'Live Watch', stage: 'Operations',
      story: 'Your app is live. Watch it, get alerts on your phone, and know exactly what to do when something breaks.',
      intro: ['16'], sections: ['16.1', '16.2', '16.3', '16.4', '16.5', '16.6', '16.7'], extras: ['x-week1', 'x-analytics'] },
    { n: 15, world: 5, name: 'The Garden', stage: 'Maintenance',
      story: 'Keep it healthy every week, month and year. Small routines stop big problems.',
      intro: ['17'], sections: ['17.1', '17.2', '17.3', '17.4', '17.5', '17.6', { id: 'P.8', manual: true }], extras: [] },
  ],

  // Book sections that are deliberately NOT part of the level path (checked by check-game.mjs)
  elsewhere: {
    '2-2': 'Replaced by the app-type choice when you start the game.',
    '2-4': 'Replaced by this game, which tracks your stages for you.',
    '19.2': 'Side quest: Toolbox.', '19.5': 'Side quest: Toolbox.', '19.6': 'Side quest: Toolbox.', '19.7': 'Side quest: Toolbox.',
    '19.8': 'Side quest: Toolbox.', '19.9': 'Side quest: Toolbox.', '19.10': 'Side quest: Toolbox.', '19.11': 'Side quest: Toolbox.',
  },
  // chapters that are side quests (open any time): the prompt library, the rescue guide and the glossary
  sideChapters: ['19', '20', '21'],

  // The files the book asks the AI to create in your project. level = when it should exist by (the first level that asks for it);
  // sec = the section that explains it. check-game.mjs checks each name really appears in that section.
  // Not checked: AUDIT_REPORT_[date].md, because it is only made in the Rescue guide (Chapter 20).
  projectFiles: [
    { name: 'CLAUDE.md', level: 0, sec: '18.4', what: 'The rules your AI reads at the start of every session.' },
    { name: 'PROJECT_BRIEF.md', level: 0, sec: '3.3', what: 'What you are building: features, user stories and the “not now” list.' },
    { name: 'PROJECT_LOG.md', level: 0, sec: '18.4', what: 'A dated diary of decisions, changes, releases and incidents.' },
    { name: 'TODO_NEXT.md', level: 0, sec: '19.3', what: 'The next steps, and every shortcut or to-do left behind.' },
    { name: 'GLOSSARY.md', level: 0, sec: '18.4', what: 'Your project’s own words, in plain language.' },
    { name: 'THREAT_MODEL.md', level: 3, sec: '8.1', what: 'Who could attack your app and how, ranked by likely damage.' },
    { name: 'DESIGN_SYSTEM.md', level: 4, sec: '4.3', what: 'The colour, size and spacing rules used on every screen.' },
    { name: 'ARCHITECTURE.md', level: 5, sec: '5.2', what: 'How the parts of your app connect, with a simple diagram.' },
    { name: 'DATA_MAP.md', level: 6, sec: '6.1', what: 'Every piece of data you keep, why, who can see it, and for how long.' },
    { name: 'ACCESS_MATRIX.md', level: 6, sec: '6.2', what: 'Who may read, add, change or delete each kind of data.' },
    { name: 'RUNBOOK.md', level: 6, sec: '6.4', what: 'Step-by-step instructions for emergencies, starting with how to restore a backup.' },
    { name: 'DEPENDENCIES.md', level: 8, sec: '8.10', what: 'Every outside library and service your app uses, and what each is for.' },
    { name: 'ABUSE_LIMITS.md', level: 8, sec: '9.1', what: 'How often each action may be repeated, and the test that proves it.' },
    { name: 'SPEED_REPORT.md', level: 9, sec: '10.3', what: 'Your speed measurements, before and after each fix.' },
    { name: 'EDGE_CASES.md', level: 10, sec: '11.1-11', what: 'The odd situations your app must handle, with a test for each.' },
  ],

  // Starting rows of the cost table, from section 3.5. note = the book's "Typical cost" column, grows = its "Grows with users?" column.
  // find = a word that must appear in section 3.5 (checked by check-game.mjs). Rows without grows come from the 3.5 prompt's item list.
  costItems: [
    { item: 'Google Play developer account', find: 'Google Play developer account', note: 'One-time registration fee', grows: 'No' },
    { item: 'Supabase (backend)', find: 'Supabase (backend)', note: 'Free plan to start; paid plan for a live app (Chapter 5)', grows: 'Yes' },
    { item: 'SMS for phone OTP', find: 'SMS for phone OTP', note: 'Paid per message. Bots can abuse it.', grows: 'Yes' },
    { item: 'AI coding tool subscription', find: 'AI coding tool subscription', note: 'Monthly', grows: 'No' },
    { item: 'Domain for privacy policy / website', find: 'Domain for privacy policy', note: 'Yearly', grows: 'No' },
    { item: 'AI features inside your app', find: 'AI features inside your app', note: 'Paid per use', grows: 'Yes, very fast' },
    { item: 'Human security review', find: 'Human security review', note: 'One-time per big release', grows: 'No' },
    { item: 'Sign-in', find: 'sign-in', note: '', grows: '' },
    { item: 'File storage', find: 'file storage', note: '', grows: '' },
    { item: 'Crash reports', find: 'crash reports', note: '', grows: '' },
  ],

  // "Something broke" help desk. Each problem points to the book's own sections, in the order the book uses
  // (stop the damage, find out, fix, prevent). expect = a word that must be in the section's title, so a changed
  // section number cannot silently point at the wrong page (checked by check-game.mjs).
  helpTopics: [
    { id: 'hacked', urgent: true, title: 'I think my app, my keys or my users’ data were exposed', ask: 'I think I was hacked, or a key leaked', steps: [
      { phase: 'stop', sec: '20-1', expect: 'Freeze' }, { phase: 'stop', sec: '20-3', expect: 'Stop the bleeding' },
      { phase: 'check', sec: '8.4', expect: 'Secrets and keys' }, { phase: 'check', sec: '13.7', expect: 'breach plan' },
      { phase: 'fix', sec: '20-5', expect: 'Fix security' }, { phase: 'fix', sec: '20-6', expect: 'Protect the data' },
      { phase: 'prevent', sec: '16.5', expect: 'incident plan' } ] },
    { id: 'release', urgent: true, title: 'A new version went live and it is broken', ask: 'A bad update is live', steps: [
      { phase: 'stop', sec: '16.6', expect: 'Rollback' }, { phase: 'stop', sec: '15.6', expect: 'Staged rollout' }, { phase: 'stop', sec: '9.7', expect: 'Kill switch' },
      { phase: 'check', sec: '16.5', expect: 'incident plan' }, { phase: 'fix', sec: '19.9', expect: 'Undo a change' } ] },
    { id: 'crash', title: 'My app crashes or freezes', ask: 'My app crashes or freezes', steps: [
      { phase: 'stop', sec: '16.6', expect: 'Rollback' }, { phase: 'check', sec: '16.1', expect: 'Crash reports' },
      { phase: 'fix', sec: '20-7', expect: 'crashes and freezes' } ] },
    { id: 'bill', title: 'My bill suddenly jumped', ask: 'My bill suddenly jumped', steps: [
      { phase: 'stop', sec: '8.11', expect: 'Cost protection' }, { phase: 'check', sec: '9.2', expect: 'OTP and SMS' },
      { phase: 'fix', sec: '5.7', expect: 'spending limits' }, { phase: 'prevent', sec: '17.6', expect: 'Cost review' } ] },
    { id: 'money', title: 'Users were charged twice, or the money is wrong', ask: 'Payments or money went wrong', steps: [
      { phase: 'stop', sec: '16.5', expect: 'incident plan' }, { phase: 'check', sec: '8.9', expect: 'Payments' },
      { phase: 'fix', sec: '11.1-10', expect: 'Money' } ] },
    { id: 'aibroke', title: 'The AI broke something that used to work', ask: 'The AI broke something that worked', steps: [
      { phase: 'stop', sec: '19.9', expect: 'Undo a change' }, { phase: 'check', sec: '7.1', expect: 'Save points' },
      { phase: 'fix', sec: '7.6', expect: 'goes in circles' }, { phase: 'prevent', sec: '7.1', expect: 'Save points' } ] },
    { id: 'notrust', title: 'The AI says it is done, but I do not trust it', ask: 'The AI says “done” but I do not trust it', steps: [
      { phase: 'check', sec: '19.4', expect: 'Demand proof' }, { phase: 'check', sec: '1-4', expect: 'fakes passing tests' },
      { phase: 'check', sec: '1-9', expect: 'Red flags' }, { phase: 'fix', sec: '12.7', expect: 'second-AI audit' } ] },
    { id: 'circles', title: 'The AI keeps going in circles, or I am stuck', ask: 'I am stuck, or the AI goes in circles', steps: [
      { phase: 'stop', sec: '7.6', expect: 'goes in circles' }, { phase: 'check', sec: '19.8', expect: 'feel stuck' },
      { phase: 'fix', sec: '19.10', expect: 'Hand off' }, { phase: 'prevent', sec: '18.4', expect: 'memory files' } ] },
    { id: 'slow', title: 'My app is slow or laggy', ask: 'My app is slow or laggy', steps: [
      { phase: 'check', sec: '10.3', expect: 'Measure first' }, { phase: 'check', sec: '10.5', expect: 'usual causes' },
      { phase: 'fix', sec: '19.6', expect: 'Fix speed' }, { phase: 'fix', sec: '20-8', expect: 'speed and lag' },
      { phase: 'prevent', sec: '10.6', expect: 'Before-and-after' } ] },
    { id: 'unknown', title: 'I already built it, and I do not know how safe it is', ask: 'I do not know the real state of my app', steps: [
      { phase: 'stop', sec: '20-1', expect: 'Freeze' }, { phase: 'check', sec: '20-2', expect: 'own and have saved' },
      { phase: 'check', sec: '19.5', expect: 'Audit an existing app' }, { phase: 'check', sec: '20-4', expect: 'Understand what you have' },
      { phase: 'fix', sec: '20-3', expect: 'Stop the bleeding' } ] },
    { id: 'play', title: 'Google Play rejected or flagged my app', ask: 'Google Play rejected or flagged my app', note: 'The book has no step-by-step guide for a rejection. These are the sections about the things Play checks, so compare what your app really does with each one.', steps: [
      { phase: 'check', sec: '15.4', expect: 'Store listing' }, { phase: 'check', sec: '13.5', expect: 'Data safety' },
      { phase: 'check', sec: '13.4', expect: 'deletion' }, { phase: 'check', sec: '13.2', expect: 'Privacy policy' },
      { phase: 'prevent', sec: '15.5', expect: 'Testing tracks' } ] },
  ],

  // Short titles for the book's "CHECK THE DATE" boxes. Key = section id + "#" + the box's number in that section (from 0).
  // check-game.mjs fails if the book has a box that is missing here (or the other way round).
  factInfo: {
    '2-3#0': { title: 'Google Play: the Android version your app must target', topic: 'Google Play' },
    '2-3#1': { title: 'India: data protection law (DPDP) start dates', topic: 'India law' },
    '3.5#0': { title: 'The price of every service you use', topic: 'Prices' },
    '4.6#0': { title: 'Accessibility numbers (tap size, text contrast)', topic: 'Standards' },
    '5.4#0': { title: 'Phone sign-in and SMS rules in India (DLT)', topic: 'India law' },
    '5.7#0': { title: 'Supabase plans: limits, pausing and backups', topic: 'Supabase' },
    '6.4#0': { title: 'Supabase backups and restore options', topic: 'Supabase' },
    '8#0': { title: 'Security standards (OWASP MASVS and Top 10)', topic: 'Standards' },
    '8.9#0': { title: 'Google Play rules for payments', topic: 'Google Play' },
    '9.3#0': { title: 'CAPTCHA options in Supabase', topic: 'Supabase' },
    '9.6#0': { title: 'Play Integrity API daily limit', topic: 'Google Play' },
    '10.2#0': { title: 'Google’s app quality limits (Android vitals)', topic: 'Google Play' },
    '13.3#0': { title: 'India DPDP: breach reports and parent consent', topic: 'India law' },
    '13.5#0': { title: 'Google Play policy updates (Data safety, deletion)', topic: 'Google Play' },
    '15#0': { title: 'Closed-test rule and developer verification', topic: 'Google Play' },
    '17#0': { title: 'The yearly target-version deadline', topic: 'Google Play' },
    '18.1#0': { title: 'Supabase advice on using AI tools safely (MCP)', topic: 'Supabase' },
  },
  // Facts this guide cross-checked against the source on the date in `checked` (see the answer notes in the README).
  verifiedFacts: {
    '2-3#0': [{ label: 'Google Play Help: target API level requirement', url: 'https://support.google.com/googleplay/android-developer/answer/11926878', note: 'Android 16 (API 36) by 31 Aug 2026 for new apps and updates: matches the book.' }],
    '17#0': [{ label: 'Google Play Help: target API level requirement', url: 'https://support.google.com/googleplay/android-developer/answer/11926878', note: 'The requirement is raised every year: matches the book.' }],
    '15#0': [
      { label: 'Google Play Help: testing for new personal accounts', url: 'https://support.google.com/googleplay/android-developer/answer/14151465', note: '12 testers for at least 14 days, accounts created after 13 Nov 2023: matches the book.' },
      { label: 'Android Developer Console Help: developer verification', url: 'https://support.google.com/android-developer-console/answer/16561738', note: 'Starts 30 Sep 2026 in Brazil, Indonesia, Singapore and Thailand, global in 2027: matches the book.' },
    ],
    '2-3#1': [{ label: 'YourStory report on the DPDP Rules', url: 'https://yourstory.com/2025/11/digital-personal-data-protection-dpdp-rules-2025-rollout-over-18-months', note: 'Notified Nov 2025, main duties after about 18 months (around May 2027). A news report: the official text was not read.' }],
    '13.3#0': [{ label: 'YourStory report on the DPDP Rules', url: 'https://yourstory.com/2025/11/digital-personal-data-protection-dpdp-rules-2025-rollout-over-18-months', note: 'The May 2027 start date matches. The 72-hour breach report and parental consent were not checked.' }],
  },

  // From Chapter 2 (the app-type table, read with pdftotext -table, PDF page 15-16). "read" = chapters to read extra carefully.
  appTypes: [
    { id: 'shop', name: 'Shop / marketplace', read: ['6', '8', '9', '14'], risks: 'Fake orders, price tampering, coupon abuse, seller fraud, leaked addresses', expert: 'Recommended before you handle real payouts to sellers.' },
    { id: 'social', name: 'Social / chat / community', read: ['8', '9', '13', '14'], risks: 'Harassment, spam, fake accounts, illegal content, privacy of messages', expert: 'Recommended. You need a content-moderation plan.' },
    { id: 'pay', name: 'Payments / wallet / money', read: ['8', '9', '11', '13'], risks: 'Stolen money, double charges, refund fraud, legal licence rules', expert: 'Yes, always. Use a licensed payment gateway. Never store card data.' },
    { id: 'kids', name: 'Kids (under 18 users)', read: ['13', '8'], risks: 'Child safety, parental consent, ads rules, strict Play policy', expert: 'Yes, always. Legal and policy review before launch.' },
    { id: 'utility', name: 'Utility / tools / offline', read: ['10', '11'], risks: 'Data loss, battery drain, too many permissions', expert: 'Usually not needed.' },
    { id: 'ai', name: 'AI features (chatbot, image tools)', read: ['8', '9', '16'], risks: 'Huge surprise bills, harmful outputs, prompt tricks, leaked keys', expert: 'Recommended if users can type anything to the AI.' },
    { id: 'health', name: 'Health / finance data', read: ['6', '8', '13'], risks: 'Very sensitive data, stricter laws and Play rules', expert: 'Yes. Before collecting any such data.' },
  ],

  // Bonus quests. kind: 'moved' = the book covers it, we only moved the reminder earlier.
  // 'verified' = NOT in the book; facts checked against the source on `checked`. 'guidance' = NOT in the book; advice, no hard facts.
  extras: {
    // kind 'docs' = comes from the user's own builder_docs files, not from the Handbook PDF and not checked against official sources.
    'x-research': {
      kind: 'docs', from: 'AI_Builder_Master_Playbook.docx (Step 1.3) and AppBuildersMasterCourse-1.docx (2.2)', title: 'Two hours of market research',
      why: 'The Handbook’s idea check (3.1) asks you to talk to 5 real people. Your Playbook adds a desk-research step that costs two hours and nothing else: see what exists, what people hate about it, and what it costs.',
      read: ['3.1'],
      prompt: 'Help me do two hours of market research for my app: [DESCRIBE YOUR APP AND USERS]. Tell me how to find the top 5 competing apps, what to look for in their 1-star reviews, how to check what they charge, and help me write my difference in one sentence: “Unlike X, we Y because Z.” Do not invent apps or prices. Tell me where to look so I can check everything myself.',
      proofs: ['I searched for the best apps for my problem and listed the top 5 results.', 'I read 1-star reviews of competing apps on Google Play and wrote down the problems people name. These are my feature ideas.', 'I checked what competitors charge (free, monthly, or one-time) on their own pages.', 'I wrote my difference in one sentence: “Unlike X, we Y because Z.”'],
    },
    'x-pricing': {
      kind: 'docs', from: 'AppBuildersMasterCourse-1.docx (10.3 and 10.4)', title: 'Choose a pricing model and plan the subscription life',
      why: 'The Handbook covers the cost to you (3.5) and payment safety (8.9), but not how to price. Your course lists the usual models and the whole subscription life, which is where most payment bugs hide. Fees and percentages in the course change, so check each official page.',
      read: ['3.5', '8.9'],
      prompt: 'Help me choose a pricing model for my app: [DESCRIBE YOUR APP AND USERS]. Ask me questions first. Then compare these models for MY users: free plus paid upgrade, free trial then pay, one flat price, tiers, pay per use, one-time purchase. For the winner, describe what happens on upgrade, on cancel (access until the period ends), on a failed payment (reminders, retry, grace period) and on a refund. Do not state any fee or percentage: link the official pricing pages instead.',
      proofs: ['I picked one pricing model for version 1, or decided the app is free for now.', 'My free version is genuinely useful on its own (or I decided there is no free version).', 'If users will pay: I wrote down what happens on upgrade, cancel, failed payment and refund.', 'I will check every fee on the service’s official page and put it in the cost table.'],
    },
    'x-scale': {
      kind: 'docs', from: 'AI_Builder_Master_Playbook.docx (Part 5: 25 signs your app will break at 500 users)', title: 'The five most critical “will it break?” checks',
      why: 'Your Playbook lists 25 signs an app will break at 500 users and marks five as the most critical. Most are covered by the Handbook (load tests, rate limits, alerts, backups, secrets). This bonus quest pulls the five together with the extra ones about timeouts and transactions. Some fixes in the Playbook name web tools (Upstash, Cloudflare, Vercel). The ideas apply to any stack.',
      read: ['12.5', '9.1', '16.3', '6.4', '16.5'],
      prompt: 'Check my app against these “will it break at 500 users?” risks and show proof for each: (1) a load test that simulates about 100 users at once, (2) no secrets in code, (3) rate limits on every public endpoint, (4) alerts for new errors, (5) multi-step database writes that are all-or-nothing (transactions), (6) a timeout of a few seconds on every call to an outside service, with a friendly message if it fails, (7) a backup that I have actually restored, (8) a one-page runbook for common incidents. Do not fix yet. Rank what you find by danger.',
      proofs: ['I ran a load test with about 100 users at once and saw where it slows down.', 'Every public endpoint has a rate limit, and I saw it work.', 'A new error sends an alert to my phone or email (I tested it).', 'Steps that change several database rows happen all together or not at all (a transaction).', 'Every call to an outside service has a timeout and a friendly failure message.', 'I restored a backup into a test project at least once.', 'I wrote a one-page runbook: what to check first, how to restart, who to call.'],
    },
    'x-aso': {
      kind: 'docs', from: 'AppBuildersMasterCourse-1.docx (9.6 ASO)', title: 'Help people find your app (ASO)',
      why: 'ASO is search engine optimisation for the Play Store. The Handbook makes your listing honest and complete (15.4) but does not cover being found. Where your course says the app icon must have no transparency, follow Google’s own listing page instead (see the store listing quest above).',
      read: ['15.4'],
      prompt: 'Help me improve how my app is found on Google Play without breaking any Play rule or misleading anyone. App: [DESCRIBE YOUR APP AND USERS]. Suggest 3 titles that put the main keyword first within the 30-character limit, a short and full description that use the keywords naturally (no stuffing), the most specific correct category, and a gentle way to ask happy users to rate the app. Do not promise rankings.',
      proofs: ['My title contains my most important keyword and fits the character limit.', 'My description uses my keywords naturally, with no stuffing and no false claims.', 'I chose the most specific correct category.', 'I have a plan to ask happy users for a rating, and to ship small regular updates.'],
    },
    'x-analytics': {
      kind: 'docs', from: 'AppBuildersMasterCourse-1.docx (12.2 and 12.3)', title: 'Plan your analytics events before launch',
      why: 'Your course says to set up analytics before launch and track the key actions from day one. The Handbook (16.4) adds the rule your course does not stress: analytics must follow the user’s consent and never record personal data.',
      read: ['16.4'],
      prompt: 'Help me plan analytics for my app: [DESCRIBE YOUR APP AND USERS]. List 8 events to track from day one (like account created, first item created, payment completed), what each one tells me, and one funnel from sign-up to my main action. Confirm that no event contains personal data (names, emails, phone numbers), that nothing is recorded before the user gives consent, and that every outside analytics service is named in my privacy policy.',
      proofs: ['I listed 8 key events and one funnel from sign-up to my main action.', 'No event contains personal data such as names, emails or phone numbers.', 'Analytics only starts after the user gives consent.', 'Every analytics service is named in my privacy policy and the Data safety form.'],
    },
    'x-week1': {
      kind: 'docs', from: 'AI_Builder_Master_Playbook.docx (Step 6.1: Week 1 after launch)', title: 'Plan your first week after launch',
      why: 'The Handbook teaches watching and reacting (chapter 16). Your Playbook gives a simple first-week routine. If you use session recordings, they must follow the same consent and privacy rules as analytics.',
      read: ['16.1', '16.5'],
      proofs: ['I will check crashes and errors every day in week 1.', 'I will answer every piece of user feedback quickly, and I decided how quickly.', 'I will track one core number every day (for example sign-ups or active users).', 'I will NOT add new features in week 1: I will fix what is broken first.'],
    },
    'x-play': {
      kind: 'moved', title: 'Start your Google Play developer account now',
      why: 'Chapter 15 says a new personal Play account needs a closed test with at least 12 testers, opted in for at least 14 days, before you can publish. That is the longest wait in the whole journey, so start now and find your testers early. Cross-checked with Google’s own help page.',
      read: ['15.3', '15.5'],
      proofs: ['I read 15.3 (Your Play Console account) and decided: personal or organisation account.', 'I wrote “start recruiting testers” at the top of TODO_NEXT.md.'],
      source: { label: 'Google Play Help: testing requirements for new personal accounts', url: 'https://support.google.com/googleplay/android-developer/answer/14151465' },
    },
    'x-earn': {
      kind: 'guidance', title: 'Decide how the app will earn money (or not)',
      why: 'Your PDF covers what the app costs (3.5) and how to take payments safely (8.9), but never asks who pays. Decide it now, because it changes your features, your rules and your legal homework.',
      read: ['3.5', '8.9'],
      prompt: 'Help me think through how this app could earn money, with pros and cons of each option for MY users: [DESCRIBE YOUR APP AND USERS]. Include “free for now”. For each option, list the extra rules and extra work it brings (Google Play payment rules, tax, refunds, support). Do not build anything yet. Tell me what a human expert, such as an accountant, must check before I take real money.',
      proofs: ['I wrote on the App info sheet who pays and how (or “free for now”).', 'If users will pay: I read 8.9 Payments and the Payments row of the app-type table (licensed payment gateway, never store card data).', 'I will ask an accountant about tax and company setup before I take real money.'],
    },
    'x-onboard': {
      kind: 'guidance', title: 'Design the first 60 seconds',
      why: 'The book covers every screen state (4.4) but not what a brand-new user sees first. The first minute decides whether they stay.',
      read: ['4.1', '4.4'],
      prompt: 'Design the first-run experience for my app: what a brand-new user sees, in order, from opening the app to their first success. Ask for sign-in and for permissions only at the moment they are needed, with one plain sentence on why. Include the loading, offline and error version of each screen. Give me a short numbered list I can approve. Do not write code yet.',
      proofs: ['I can describe the first 3 screens a new user sees.', 'Permissions are asked only when needed, with a reason.', 'Every first-run screen has a loading, offline and error version.'],
    },
    'x-appid': {
      kind: 'verified', title: 'Choose your app name and permanent application ID',
      why: 'Not in the PDF. Your app’s application ID (like com.yourname.yourapp) is its identity on Google Play. Google’s documentation says not to change it after you publish: a changed ID is treated as a new app, so you lose your listing, installs and reviews. Decide it now, before the AI creates the project in Level 7.',
      prompt: 'Before you create the Android project, help me choose my app name and application ID. Explain in plain English that the application ID cannot change after my first Google Play upload, because a changed ID counts as a different app. Suggest 3 options in the form com.[mycompany].[myapp]: at least two parts separated by dots, only letters, numbers and underscores, and by convention all lowercase. Set the ID explicitly in the Gradle file. Save the chosen name and ID in PROJECT_BRIEF.md and PROJECT_LOG.md.',
      proofs: ['My application ID is written on the App info sheet and in PROJECT_LOG.md.', 'It has at least two parts separated by dots, using only letters, numbers and underscores.', 'I understand it can never change after my first Play upload.', 'My store title is 30 characters or fewer.'],
      source: { label: 'Android Developers: configure the application ID', url: 'https://developer.android.com/studio/build/application-id' },
    },
    'x-listing': {
      kind: 'verified', title: 'Prepare your store listing words and pictures',
      why: 'Not in the PDF. Chapter 15.4 says to write honest descriptions and plan 4–8 screenshots, but not the size limits. Play Console rejects a listing that misses them. Re-check Google’s page on launch day, because limits can change.',
      read: ['15.4'],
      prompt: 'Prepare my Play Store listing assets using these limits and check them against Google’s current Play Console Help page: title up to 30 characters, short description up to 80 characters, app icon 512 x 512 PNG, feature graphic 1024 x 500 (JPEG or 24-bit PNG, no transparency), up to 8 screenshots per device type taken from the real release build. Give me 3 title options and 3 short descriptions with the character count of each, and a shot list. Keep every claim true for today’s app.',
      proofs: ['Title is 30 characters or fewer and short description is 80 or fewer (I counted).', 'App icon is 512 x 512 and the feature graphic is 1024 x 500.', 'Screenshots come from the real release build and show only features that exist today.', 'I re-checked Google’s listing page on launch day.'],
      source: { label: 'Google Play Help: add preview assets to showcase your app', url: 'https://support.google.com/googleplay/android-developer/answer/9866151' },
    },
    'x-launch': {
      kind: 'guidance', title: 'Plan your launch week and your support email',
      why: 'The book teaches a safe rollout (15.6) and watching crashes (16), but not how your first real users hear about you, or where they send problems.',
      read: ['15.6', '16.1'],
      prompt: 'Help me write a simple launch plan for my app: who my first users are (start with my closed-test testers), 3 honest places to find more of them, and one place where users can send problems (a support email or form). Draft the short message I will send to invite people. Keep it truthful: no “coming soon” features. Do not suggest anything that breaks Google Play rules.',
      proofs: ['I listed where my first users are (people I know, communities, customers).', 'I have one support email or form and put it in my privacy policy and store listing.', 'I decided how fast I will reply to users.', 'I will watch crashes and feedback every day during the staged rollout.'],
    },
  },
};
