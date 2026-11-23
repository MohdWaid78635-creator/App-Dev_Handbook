(() => {
  'use strict';
  const stages = window.PLAYBOOK_DATA.stages;
  const modules = new Map(window.LEARN.modules.map(lesson => [lesson.id, lesson]));
  const chapters = [
    ['How apps work', 'how-apps-work', 'direct-the-ai'],
    ['Find a problem worth solving', 'plan-first'],
    ['Create your workshop', 'ship-and-run'],
    ['Give your app a backend', 'backend', 'apis'],
    ['Sign in safely', 'security-basics'],
    ['Keep each user’s data private', 'databases'],
    ['Build the core journey', 'frontend', 'design-basics'],
    ['Choose optional powers', 'money'],
    ['Catch a bug before users do'],
    ['Secure the release', 'lock-mobile'],
    ['Ship a test build', 'mobile-store'],
    ['Recover when things break', 'ship-and-run'],
    ['Improve a live app', 'after-launch']
  ];
  const testing = {
    cards: [
      { h: 'Start with an observable result', body: 'A test starts with a situation, an action, and an expected result.', ex: 'Given airplane mode, tap Save. The draft stays visible and you can retry.' },
      { h: 'Test the installed app', body: 'A quick logic test can check a rule. An installed build lets you check permissions, network loss, and Android navigation.' }
    ],
    quiz: [
      { q: 'A save times out. Which test catches a duplicate record?', options: ['Check the Save button colour.', 'Retry the same save and verify exactly one record exists.', 'Confirm the spinner disappeared.'], answer: 1, why: 'A timeout can hide a successful write. Count the resulting records after retry.' },
      { q: 'Which result is proof of recovery?', options: ['The app keeps the draft and succeeds after reconnecting.', 'The developer says it should work.', 'The error message is hidden.'], answer: 0, why: 'Recovery means the user can finish the task without losing work.' }
    ],
    try: [{ type: 'order', q: 'Put a useful bug report in order.', items: ['Record the device and app build', 'Write the steps to reproduce', 'Compare expected and actual results'], why: 'A second person can reproduce the problem and verify a fix.' }]
  };
  const milestones = {
    1: ['Problem and audience', 'Who will use your app, and what single problem will it solve?'],
    6: ['Core journey', 'List the screens and the one action users must be able to finish.'],
    8: ['Test evidence', 'Record the build, one failure you reproduced, and the result after the fix.'],
    11: ['Release readiness', 'Record the candidate, test results, and a verified rollback or restore plan.']
  };
  const stateKey = 'build-quest-academy-v1';
  const screen = document.querySelector('#screen');
  const blank = { correct: {}, missed: {}, due: {}, proofs: {}, skipped: {}, notes: {}, appName: '', plan: {} };
  let state = blank;
  let canSave = true;
  try { state = { ...blank, ...JSON.parse(localStorage.getItem(stateKey) || '{}') }; }
  catch { canSave = false; }
  let feedback = null;
  let order = [];
  let reviewFinished = false;
  let reviewKey = null;
  let practiceIndex = 0;
  const nextReview = () => Date.now() + 24 * 60 * 60 * 1000;
  for (const key of Object.keys(state.correct)) state.due[key] ??= nextReview();
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const save = () => {
    try { localStorage.setItem(stateKey, JSON.stringify(state)); }
    catch { canSave = false; }
  };
  const releasePractice = {
    type: 'order',
    q: 'Put the test release in order.',
    items: ['Build and sign the Android bundle', 'Upload it to a Play test track', 'Install the candidate and record test evidence', 'Confirm release requirements and prepare for production'],
    why: 'Test the same candidate you intend to release. Complete operational checks before publishing.'
  };
  const lessons = stages.map((stage, index) => {
    const [title, ...ids] = chapters[index];
    const sources = ids.length ? ids.map(id => modules.get(id)) : [testing];
    const boss = stage.boss;
    const drills = sources.flatMap(source => source.try);
    if (index === 10) drills[0] = releasePractice;
    const coreQuiz = sources[0].quiz.slice(index === 11 ? 1 : 0, index === 11 ? 3 : 2);
    const extraQuiz = sources.flatMap(source => source.quiz).filter(question => !coreQuiz.includes(question));
    return {
      title, sources, drills,
      questions: [...coreQuiz, { ...boss, q: boss.question, why: boss.options[boss.answer], boss: true }, ...extraQuiz]
    };
  });
  const questionKey = (id, q) => `${id}:${q}`;
  const mastered = id => lessons[id].questions.slice(0, 3).every((_, q) => state.correct[questionKey(id, q)]);
  const proofKey = (step, index) => `${step.id}:${index}`;
  const canSkip = step => ['s7-step2', 's7-step3', 's7-step4', 's9-step4'].includes(step.id);
  const buildDone = stage => stage.steps.every(step => (canSkip(step) && state.skipped[step.id]) || step.proof.every((_, index) => state.proofs[proofKey(step, index)]));
  const isDue = key => state.missed[key] || (state.due[key] && state.due[key] <= Date.now());
  const link = (hash, label, type = 'secondary') => `<a class="${type}" href="#${hash}">${label}</a>`;
  const heading = (label, title, intro) => `<div class="lesson-header"><span class="eyebrow">${label}</span><h1 tabindex="-1">${title}</h1><p>${intro}</p></div>`;
  const status = (stage, building) => building ? (buildDone(stage) ? 'Proofs recorded' : 'Record your evidence') : (mastered(stage.id) ? 'Mastered' : stage.title);

  function stageList(building) {
    const next = stages.find(stage => building ? !buildDone(stage) : !mastered(stage.id));
    return `<div class="path">${stages.map(stage => {
      const done = building ? buildDone(stage) : mastered(stage.id);
      const selected = next?.id === stage.id;
      return `<a class="mission ${done ? 'done' : selected ? 'next' : ''}" href="#${building ? 'build' : 'learn'}/${stage.id}"><span class="tile" aria-hidden="true">${done ? '✓' : String(stage.id + 1).padStart(2, '0')}</span><span><strong>${escape(building ? stage.title : lessons[stage.id].title)}</strong><small>${escape(status(stage, building))}</small></span><span class="arrow" aria-hidden="true">›</span></a>`;
    }).join('')}</div>`;
  }

  function pathPage() {
    const count = stages.filter(stage => mastered(stage.id)).length;
    const next = stages.find(stage => !mastered(stage.id));
    return `<section class="hero"><div><span class="eyebrow">THE BUILDER’S ACADEMY</span><h1 tabindex="-1">Learn by building.</h1><p>Play through 13 missions. Turn one idea into your first Android app.</p>${link(next ? `learn/${next.id}` : 'build', next ? (count ? 'Continue mission →' : 'Start mission →') : 'Open build tasks →', 'primary')}</div></section>
      <section class="panel"><span class="eyebrow">START HERE</span><h2>Run your first Android screen</h2><p>Install the tools, open Habit Check-in, change one label, and save a Git checkpoint.</p><div class="actions">${link('starter', 'Open the guided capstone →', 'primary')}</div></section>
      <div class="progress"><div><strong>Learning progress</strong><span>${count} of ${stages.length} mastered</span></div><progress max="${stages.length}" value="${count}" aria-label="Missions mastered"></progress></div>
      <div class="section-head"><h2>Mission map</h2><p>Learn · Practice · Build</p></div>${stageList(false)}<p class="builder-links"><a href="../index.html">Open the handbook</a></p>`;
  }

  function gamePanel(id, game) {
    if (!game) return '';
    const items = game.type === 'order' ? game.items : game.pairs.map(([left]) => left);
    const out = items.map((value, index) => ({ value, index })).reverse();
    if (game.type === 'match') {
      const pair = game.pairs[order.length];
      if (!pair) return `<section class="panel"><h2>Practice complete</h2><p>${escape(game.why)}</p></section>`;
      const options = [...new Set(game.pairs.map(([, right]) => right))].reverse();
      return `<section class="panel"><h2>Match the pair</h2><p>${escape(game.q)} (${order.length + 1}/${game.pairs.length})</p><p><strong>${escape(pair[0])}</strong></p><div class="choices">${options.map(value => `<button class="choice" data-match="${escape(value)}">${escape(value)}</button>`).join('')}</div><p role="status">${feedback?.game ? escape(feedback.text) : ''}</p></section>`;
    }
    return `<section class="panel"><h2>Put it in order</h2><p>${escape(game.q)}</p><ol>${order.map(index => `<li>${escape(items[index])}</li>`).join('')}</ol><div class="choices">${out.filter(x => !order.includes(x.index)).map(x => `<button class="choice" data-order="${x.index}">${escape(x.value)}</button>`).join('')}</div><p role="status">${feedback?.game ? escape(feedback.text) : ''}</p>${order.length ? '<button class="secondary" data-reset-order>Start over</button>' : ''}</section>`;
  }

  function lessonPage(id) {
    const lesson = lessons[id];
    const cards = lesson.sources.flatMap(source => source.cards).map(card =>
      id === 10 && card.h === 'The submission path'
        ? { h: card.h, body: 'Build a signed bundle, set up the listing and declarations, and test the uploaded candidate before requesting production release. Meet the rules shown for your account. Use the Build checklist for dated sources.' }
        : card
    );
    return `${link('path', '← Mission map')}${heading(`MISSION ${id + 1} / ${stages.length}`, escape(lesson.title), 'Learn the idea, try it, then put it to work.')}
      ${cards.map((card, index) => `<details class="checkpoint" ${index === 0 ? 'open' : ''}><summary>${escape(card.h)}</summary><p>${escape(card.body)}</p>${card.ex ? `<p class="example">${escape(card.ex)}</p>` : ''}${card.note ? `<p>${escape(card.note)}</p>` : ''}${card.terms ? `<dl>${card.terms.map(([term, meaning]) => `<dt><strong>${escape(term)}</strong></dt><dd>${escape(meaning)}</dd>`).join('')}</dl>` : ''}</details>`).join('')}
      ${lesson.drills.length > 1 ? `<div class="actions" aria-label="Practice choices">${lesson.drills.map((_, i) => `<button class="secondary" data-drill="${i}" aria-pressed="${i === practiceIndex}">Practice ${i + 1}</button>`).join('')}</div>` : ''}
      <div id="practice">${gamePanel(id, lesson.drills[practiceIndex])}</div>
      ${lesson.sources.map(source => `${source.ai?.length ? `<details class="checkpoint"><summary>Check the AI’s work</summary>${source.ai.map(tip => `<p>${escape(tip)}</p>`).join('')}${source.src ? `<p class="subtle">From ${escape(source.src)}</p>` : ''}</details>` : ''}${source.explain ? `<details class="checkpoint"><summary>Explain it back</summary><p>${escape(source.explain)}</p><p class="subtle">Say your answer aloud or write it before checking yourself.</p></details>` : ''}`).join('')}
      <section class="panel"><h2>${mastered(id) ? 'Mission mastered' : 'Knowledge check'}</h2><p>Two questions and a boss challenge. Each correct answer earns 10 XP once.</p><div class="actions">${link(`quiz/${id}/0`, 'Play knowledge check →', 'primary')}${lesson.questions.length > 3 ? link(`quiz/${id}/3`, 'Extra questions') : ''}${link(`build/${id}`, 'Open build tasks')}</div></section>`;
  }

  function quizPage(id, index, reviewing) {
    const entry = lessons[id].questions[index];
    const answered = feedback && !feedback.game;
    const next = index !== 2 && index + 1 < lessons[id].questions.length ? `quiz/${id}/${index + 1}` : `result/${id}`;
    return `${link(reviewing ? 'review' : `learn/${id}`, reviewing ? '← Review' : '← Lesson')}
      ${heading(reviewing ? 'REVIEW' : entry.boss ? 'BOSS CHALLENGE' : `QUESTION ${index + 1} / ${lessons[id].questions.length}`, escape(entry.q), 'Choose the best answer.')}
      <div class="choices">${entry.options.map((option, i) => `<button class="choice" data-answer="${i}" aria-pressed="${answered && feedback.selected === i}" ${answered ? 'disabled' : ''}>${escape(option)}</button>`).join('')}</div>
      ${answered ? `<div tabindex="-1" role="status" class="feedback ${feedback.correct ? 'correct' : 'wrong'}"><strong>${feedback.correct ? 'Correct' : 'Try again'}</strong><p>${escape(entry.why)}</p></div><div class="actions">${feedback.correct ? (reviewing ? '<button class="primary" data-next-review>Back to review</button>' : link(next, 'Continue →', 'primary')) : '<button class="primary" data-retry>Try again</button>'}</div>` : ''}`;
  }

  function buildPage(id) {
    if (id === null) return `${heading('BUILD', 'Your workshop', 'Apply the lessons to your own app and record each proof.')}${stageList(true)}`;
    const stage = stages[id];
    return `${link('build', '← Workshop')}${heading(`BUILD MISSION ${id + 1}`, escape(stage.title), escape(stage.desc))}
      ${stage.steps.map(step => `<details class="checkpoint"><summary>${escape(step.title)}</summary><p>${escape(step.why)}</p><ol>${step.do.map(action => `<li>${escape(action)}</li>`).join('')}</ol><p class="example">${escape(step.prompt.replace(/\[APP_NAME\]/g, () => state.appName || 'my app'))}</p><button class="secondary" data-copy="${step.id}">Copy prompt</button><p role="status" data-copy-status="${step.id}"></p><fieldset><legend>Proof checklist</legend>${step.proof.map((proof, index) => `<label class="proof"><input type="checkbox" data-proof="${proofKey(step, index)}" ${state.proofs[proofKey(step, index)] ? 'checked' : ''}> <span>${escape(proof)}</span></label>`).join('')}</fieldset>${skipForm(step)}<p><strong>If stuck</strong> ${escape(step.ifStuck)}</p><p><strong>Risk</strong> ${escape(step.risk)}</p><p><strong>Rollback</strong> ${escape(step.rollback)}</p><p><strong>Cost</strong> ${escape(step.cost)}</p><p><a href="${escape(step.source.url)}">Source</a> · Checked ${escape(step.source.checked)}</p></details>`).join('')}
      <div class="actions">${link(`learn/${id}`, 'Review the lesson')}${milestones[id] ? link('project', 'Update your project →', 'primary') : ''}</div>`;
  }

  function skipForm(step) {
    if (!canSkip(step)) return '';
    const saved = state.skipped[step.id];
    return `<form data-skip-step="${step.id}"><label for="skip-${step.id}">Not applicable: explain what your app omits</label><input class="app-name" id="skip-${step.id}" name="reason" maxlength="300" value="${escape(saved)}" placeholder="This app has no in-app purchases"><div class="actions"><button class="secondary" type="submit">${saved ? 'Update reason' : 'Record as not applicable'}</button>${saved ? `<button class="secondary" type="button" data-undo-skip="${step.id}">Resume task</button>` : ''}</div><p class="subtle" role="status">${saved ? 'Not applicable recorded.' : ''}</p></form>`;
  }

  function reviewPage() {
    const due = [...new Set([...Object.keys(state.missed), ...Object.keys(state.due)])].filter(isDue);
    return `${heading('PRACTICE', 'Review room', 'Revisit misses now and recall correct answers after a day.')}
      <section class="panel"><h2>${due.length ? `${due.length} to review` : 'You’re caught up'}</h2><p>${due.length ? 'Answer correctly to schedule the next review.' : 'Play a mission or come back when a review is due.'}</p><div class="actions">${due.length ? link(`review/${due[0].replace(':', '/')}`, 'Start review →', 'primary') : link('path', 'Return to path →', 'primary')}</div></section>`;
  }

  function starterPage() {
    return `${link('path', '← Mission map')}${heading('START HERE', 'Habit Check-in', 'Build the same small app from your first edit to a test release.')}
      <section class="panel"><h2>On your computer</h2><ol><li>Install Node LTS, Git and a code editor.</li><li>Get the capstone files, then open their folder in your terminal.</li><li>Run <code>npm ci</code> and <code>npm start</code>. Open the app on your Android device with compatible Expo Go or use the Android emulator.</li><li>Open <code>Starter.tsx</code>, change the title, save, and check the new title on Android.</li></ol><div class="actions"><a class="primary" href="capstone/README.md">Open the capstone walkthrough</a><a class="secondary" href="https://docs.expo.dev/tutorial/build-with-ai/set-up-your-tools/">Expo setup guide</a></div></section>
      <section class="panel"><h2>What you’ll prove</h2><p>Change a screen, add and complete a habit, recover from a failed save, then test account isolation with two disposable users. Public release is a separate milestone.</p>${link('project', 'Use it for my project →')}</section>`;
  }

  // Each entry shows what the option does and separates software cost from hosted-service limits.
  const toolCatalog = {
    stack: {
      'TypeScript · Expo + React Native': ['Expo + React Native builds mobile screens. TypeScript checks many mistakes while you edit.', 'Free to develop · Expo cloud free tier', 'Local development is free. Expo’s optional cloud services have plan limits.', 'https://expo.dev/pricing'],
      'JavaScript · Expo + React Native': ['The same mobile framework using JavaScript without TypeScript’s static type checks.', 'Free to develop · Expo cloud free tier', 'Local development is free. Expo’s optional cloud services have plan limits.', 'https://expo.dev/pricing'],
      'Dart · Flutter': ['A cross-platform toolkit using Dart and widgets to build Android, iOS, and web apps.', 'Free SDK', 'Flutter is open source. Device, signing, publishing, and external services are separate.', 'https://flutter.dev/'],
      'Kotlin · Jetpack Compose': ['A native Android UI toolkit that uses Kotlin. Choose it to focus on Android tools and APIs.', 'Free SDK', 'Develop locally with Android Studio. Store publishing is separate.', 'https://developer.android.com/compose'],
      'Java · Android Views': ['Native Android development using Java for app logic and Views or XML layouts for screens.', 'Free SDK', 'Develop locally with Android Studio. Useful when working with existing Java Android projects.', 'https://developer.android.com/studio/intro'],
      'Swift · SwiftUI': ['Apple’s native UI toolkit using Swift. Local iOS development uses Xcode on a Mac.', 'Free tools · paid distribution plan', 'Learn and test with free tools. App Store distribution normally needs paid membership.', 'https://developer.apple.com/help/account/basics/about-your-developer-account/'],
      'TypeScript · React web': ['Build browser screens with React components and typed JavaScript. Hosting is a separate choice.', 'Free library', 'Develop and test locally without a hosting bill.', 'https://react.dev/learn'],
      'JavaScript · HTML + CSS': ['Build a simple browser app with JavaScript for behavior, HTML for structure, and CSS for styling.', 'Free to develop', 'Use a browser and editor locally. Hosting is separate.', 'https://developer.mozilla.org/en-US/docs/Learn_web_development'],
    },
    data: {
      'No persistent data': ['Keep values while the app is open. Useful for calculators and simple demos.', 'No storage bill'],
      'On this device · SQLite': ['A small SQL database stored in the app. Use your app language through a compatible SQLite library.', 'Free local storage', 'No cloud account. Data stays on the device unless you build a separate sync or backup flow.', 'https://www.sqlite.org/copyright.html'],
      'In this browser · IndexedDB': ['Saves records in the current browser using JavaScript or TypeScript.', 'Free browser storage', 'Works locally. Clearing site data can remove records, and devices do not sync automatically.', 'https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API'],
      'Cloud · Supabase/PostgreSQL': ['Hosted relational database using SQL. Your app calls it through an SDK or API.', 'Free cloud tier', 'Free has usage limits, and inactive projects can pause. Check the current plan before launch.', 'https://supabase.com/pricing'],
      'Cloud · Firebase': ['Choose Cloud Firestore to store records as documents. Use a compatible app SDK and Firebase Security Rules.', 'Free cloud tier · Spark', 'Spark covers eligible services up to usage limits. Some features require Blaze.', 'https://firebase.google.com/pricing'],
      'Self-hosted · PostgreSQL': ['Open-source SQL database that you run yourself. Put an authenticated backend API in front of it.', 'Free software · hosting varies', 'No database license fee. A server, backups, and maintenance are your responsibility.', 'https://www.postgresql.org/about/licence/'],
    },
    auth: {
      'No accounts in version one': ['Users can start immediately. Good for a device-only app or public information.', 'No auth bill'],
      'Supabase Auth': ['Manages accounts and sessions. Pairs with Supabase database policies to control access to records.', 'Free cloud tier', 'Included within the project’s plan limits. Check email or SMS provider costs separately.', 'https://supabase.com/pricing'],
      'Firebase Authentication': ['Manages accounts and sessions. Pairs with Firestore Security Rules for access to records.', 'Free for eligible sign-in methods', 'Check method and quota limits. Phone SMS sign-in is not on Spark.', 'https://firebase.google.com/pricing'],
      'Clerk': ['Provides sign-in screens and account management. You still choose a database and enforce data access.', 'Free Hobby tier', 'Check the user limit, available features, and whether the SDK fits your framework.', 'https://clerk.com/pricing'],
    },
  };
  const toolOptions = key => [...Object.keys(toolCatalog[key]), 'Other / custom', 'Help me choose'];
  const planSections = [
    ['Define the first version', [
      ['audience', 'Who is the app for?', 'Example: beginners trying to build one daily habit'],
      ['goal', 'What problem will it solve?', 'Example: I forget whether I completed my habit today'],
      ['journey', 'What is the first user journey?', 'Example: open the list → add a habit → mark it complete'],
      ['scope', 'What is in version one, and what can wait?', 'Example: one list and an add form. Reminders and sharing can wait.'],
      ['proof', 'How will you know the first build works?', 'Example: add a habit, restart the app, and see it again'],
    ]],
    ['Choose your tools', [
      ['target', 'First platform', ['Android', 'iOS', 'Android and iOS', 'Web', 'Undecided']],
      ['experience', 'Your development computer', ['Windows', 'macOS', 'Linux', 'Undecided']],
      ['stack', 'Language and framework', toolOptions('stack')],
      ['custom', 'Custom language, framework or tooling', 'List tools if you chose Other. Add any existing repo or version constraints.'],
      ['data', 'Where does app data live?', toolOptions('data')],
      ['auth', 'How will users sign in?', toolOptions('auth')],
      ['sync', 'Must data sync between devices?', ['No', 'Yes', 'Undecided']],
      ['offline', 'What should work without internet?', ['Show a clear offline message', 'Read saved records offline', 'Read and save offline', 'Undecided']],
    ]],
    ['Plan security and setup', [
      ['records', 'What data is stored, and who may read or change it?', 'Example: a habit title and marked date. Only its owner can read or change it. For a local prototype, note who uses the device.'],
      ['security', 'Access and security needs', ['Private per user', 'Public reads with restricted writes', 'Roles or shared workspaces', 'Device-only or no user records', 'Help me choose']],
      ['privacy', 'Sensitive data, permissions, and retention', 'Example: no sensitive data or phone permissions. Users can delete a habit. Record retention or deletion needs if relevant.'],
      ['workspace', 'Where should the agent work?', 'Example: scaffold in a new habit-check-in folder, or inspect my existing repository first.'],
      ['constraints', 'Budget, device, or release constraints', 'Example: keep the first test free, use my Android phone, and defer app-store release.'],
    ]],
  ];
  const planFields = planSections.flatMap(([, fields]) => fields);
  const fieldLabels = Object.fromEntries(planFields.map(([key, label]) => [key, label]));
  const decided = value => Boolean(value && !['Undecided', 'Help me choose'].includes(value));
  const usesExpo = stack => stack?.endsWith('· Expo + React Native');

  function recommendTools(p) {
    const stack = !decided(p.target) ? '' : p.target === 'Web' ? 'TypeScript · React web'
      : p.target === 'iOS' && p.experience === 'macOS' && p.stack === 'Swift · SwiftUI' ? p.stack : 'TypeScript · Expo + React Native';
    let data = '';
    let auth = '';
    if (p.sync === 'Yes') data = /^(Cloud|Self-hosted)/.test(p.data || '') ? p.data : 'Cloud · Supabase/PostgreSQL';
    else if (p.sync === 'No' && decided(p.target) && (!decided(p.auth) || p.auth === 'No accounts in version one')) {
      data = p.target === 'Web' ? 'In this browser · IndexedDB' : 'On this device · SQLite';
    }
    if (!decided(p.data) || p.sync === 'Yes') {
      if (p.auth === 'Firebase Authentication') data = 'Cloud · Firebase';
      if (p.auth === 'Supabase Auth') data = 'Cloud · Supabase/PostgreSQL';
    }
    const effectiveData = decided(p.data) ? p.data : data;
    if (effectiveData === 'Cloud · Supabase/PostgreSQL') auth = 'Supabase Auth';
    if (effectiveData === 'Cloud · Firebase') auth = 'Firebase Authentication';
    if (['No persistent data', 'On this device · SQLite', 'In this browser · IndexedDB'].includes(effectiveData) && p.sync === 'No') auth = 'No accounts in version one';
    return { stack, data, auth };
  }

  function toolGuide(key, selection, suggestion) {
    const catalog = toolCatalog[key];
    const active = catalog[selection];
    const title = { stack: 'languages and frameworks', data: 'storage options', auth: 'sign-in options' }[key];
    return `${suggestion ? `<p class="tool-suggestion"><strong>Recommended:</strong> ${escape(suggestion)} <span class="tag">${escape(catalog[suggestion][1])}</span></p>` : ''}
      ${active ? `<p class="subtle"><strong>${escape(active[1])}.</strong> ${escape(active[0])}</p>` : ''}
      <details class="checkpoint tool-comparison"><summary>Compare ${title}</summary><dl>${Object.entries(catalog).map(([name, [description, cost, terms, url]]) =>
        `<dt><strong>${escape(name)}</strong> <span class="tag">${name === suggestion ? 'Recommended · ' : ''}${escape(cost)}</span></dt><dd><p>${escape(description)} ${escape(terms)}</p>${url ? `<a href="${url}" target="_blank" rel="noopener noreferrer">Official details ↗</a>` : ''}</dd>`
      ).join('')}</dl></details>`;
  }

  function refreshToolGuides(form) {
    const values = Object.fromEntries(new FormData(form));
    const suggestions = recommendTools(values);
    for (const [key, suggestion] of Object.entries(suggestions)) {
      const panel = form.querySelector(`[data-tool-guide="${key}"]`);
      const wasOpen = panel.querySelector('details')?.open;
      panel.innerHTML = toolGuide(key, values[key], suggestion);
      if (wasOpen) panel.querySelector('details').open = true;
    }
  }

  function planChecks(p) {
    const custom = [p.stack, p.data, p.auth].includes('Other / custom');
    const localOnly = ['No persistent data', 'On this device · SQLite', 'In this browser · IndexedDB'].includes(p.data);
    const authConflicts = (p.auth === 'Firebase Authentication' && p.data === 'Cloud · Supabase/PostgreSQL') ||
      (p.auth === 'Supabase Auth' && p.data === 'Cloud · Firebase');
    const crossPlatform = (['Kotlin · Jetpack Compose', 'Java · Android Views'].includes(p.stack) && p.target !== 'Android') ||
      (p.stack === 'Swift · SwiftUI' && p.target !== 'iOS') ||
      (['TypeScript · React web', 'JavaScript · HTML + CSS'].includes(p.stack) && p.target !== 'Web') ||
      (p.data === 'In this browser · IndexedDB' && p.target !== 'Web');
    const offlineConflict = p.data === 'No persistent data' && ['Read saved records offline', 'Read and save offline'].includes(p.offline);
    const privateCloudWithoutAccounts = p.data?.startsWith('Cloud') && p.auth === 'No accounts in version one' && p.security === 'Private per user';
    return [
      ['User, problem, core journey and scope', Boolean(p.audience && p.goal && p.journey && p.scope)],
      ['Platform, computer and technology choices', [p.target, p.experience, p.stack, p.data, p.auth, p.sync].every(decided) && (!custom || Boolean(p.custom))],
      ['Stack and data choices agree', [p.target, p.stack, p.data, p.auth, p.sync].every(decided) && !crossPlatform && !authConflicts && !offlineConflict && !privateCloudWithoutAccounts && !(p.sync === 'Yes' && localOnly)],
      ['Data ownership, privacy and setup boundaries', Boolean(p.records && p.privacy && p.workspace && p.constraints && decided(p.security) && decided(p.offline))],
      ['Observable first-build proof', Boolean(p.proof)],
    ];
  }

  function foundationPrompt(p) {
    const waiting = planChecks(p).filter(([, done]) => !done).map(([label]) => label);
    const expo = usesExpo(p.stack);
    const cloud = /^(Cloud|Self-hosted)/.test(p.data || '') || ['Supabase Auth', 'Firebase Authentication', 'Clerk'].includes(p.auth);
    const setup = expo
      ? 'Check Node.js and the package manager against the chosen Expo SDK, check Git, and identify a supported Android device/emulator or iOS test path. For Android local native builds, check the JDK, Android Studio SDK and adb. Use compatible Expo Go for the starter where supported, and a development build when custom native modules require it.'
      : 'Use the selected platform and stack. Check the matching SDK, runtime, package manager, Git, and a device, emulator, or browser. Choose install commands from current official documentation for the stated computer.';
    return [
      `Help me set up the foundation of ${state.appName}. Start with discovery and a runnable starter with one visible screen.`,
      'PROJECT DECISIONS',
      ...planFields.filter(([key]) => p[key]).map(([key]) => `- ${fieldLabels[key]}\n  ${p[key]}`),
      ...(waiting.length ? ['OPEN DECISIONS', ...waiting.map(label => `- ${label}`), 'Resolve any blocker before scaffolding. Ask focused questions only for missing or conflicting choices.'] : []),
      'FOUNDATION TASKS',
      '1. Inspect the current folder and repo, including existing manifests, Git status, and project instructions. Report what already exists and where you propose to work.',
      `2. Give a setup checklist with each tool’s purpose, how to check its installed version, the official source, and the installation command only if it is missing. ${setup}`,
      '3. Show the minimal folder structure, dependency choices, and exact run, type-check, and smoke-test commands. Reuse the repo and its package manager when present. Scaffold only the agreed first screen and navigation.',
      cloud
        ? '4. Prepare development backend configuration, a placeholder-only environment example, and a plan for the first schema and access rules. Define who can read/write each record, test signed-out access and test two-user isolation when accounts apply. Keep privileged secrets server-side and use disposable test data. If offline writes are planned, record the future sync, retry, and conflict policy before implementing it.'
        : '4. Set up the selected local storage only if needed. Use sample data. Explain storage and deletion behavior. Leave accounts and cloud services out unless the project decisions call for them.',
      '5. Keep credentials out of code, Git, logs, and prompts. Ask before privileged system installs, paid resources, or production changes. Preserve existing files and show how to recover from a failed setup.',
      '6. Run the available checks and report exact commands, observed results, and any device or backend checks still pending. Stop at the foundation checkpoint and identify the first feature to build next.',
    ].join('\n');
  }

  function planPage() {
    if (!state.appName) return `${heading('PLAN MODE', 'Create a project first', 'Name the app so the plan and setup prompt have a project to refer to.')}${link('project', 'Open Project', 'primary')}`;
    const p = state.plan;
    const checks = planChecks(p);
    const score = checks.filter(([, done]) => done).length;
    const suggestions = recommendTools(p);
    const field = ([key, label, choices]) => `<div><label for="plan-${key}">${label}</label>${Array.isArray(choices)
      ? `<select class="app-name" id="plan-${key}" name="${key}"><option value="">Choose…</option>${choices.map(choice => `<option${choice === p[key] ? ' selected' : ''}>${escape(choice)}</option>`).join('')}</select>${toolCatalog[key] ? `<div data-tool-guide="${key}">${toolGuide(key, p[key], suggestions[key])}</div>` : ''}`
      : `<textarea id="plan-${key}" name="${key}" maxlength="700" placeholder="${escape(choices)}">${escape(p[key])}</textarea>`}</div>`;
    return `${link('project', '← Project')}${heading('PLAN MODE', escape(state.appName), 'Decide what your app needs. Save a draft any time and generate a foundation prompt for your coding agent.')}
      <form id="plan-form">
        ${planSections.map(([title, fields]) => `<section class="panel"><h2>${title}</h2>${title === 'Choose your tools' ? '<p class="example"><strong>Start free.</strong> Pick your platform and decide whether records need to sync. Free local tools run on your computer or device. Cloud free tiers have limits, and store publishing is separate.</p>' : ''}<div class="stack">${fields.map(field).join('')}</div>${title === 'Choose your tools'
          ? '<button class="secondary" type="button" data-suggest-stack>Apply recommendations to undecided fields</button><p class="subtle" id="stack-hint" role="status"></p>' : ''}</section>`).join('')}
        <button class="primary" type="submit">Save plan and generate prompt</button>
      </form>
      <section class="panel" id="plan-result" tabindex="-1"><h2>Pre-build check</h2><p><strong>${score} of ${checks.length} decision groups ready</strong></p>
        <ul>${checks.map(([label, done]) => `<li>${done ? 'Ready' : 'Review'} · ${label}</li>`).join('')}</ul>
        ${score === checks.length ? '<p>Your decisions are recorded. Run the foundation prompt and verify the first screen before building features.</p>' : '<p>Save after editing to refresh this check. The draft prompt asks the agent to resolve open decisions first.</p>'}
        ${Object.keys(p).length ? `<label for="foundation-prompt">AI foundation prompt</label><textarea id="foundation-prompt" class="prompt-output" readonly rows="12">${escape(foundationPrompt(p))}</textarea><button class="secondary" data-copy-plan>Copy foundation prompt</button><p role="status" id="plan-status"></p>` : ''}
        <div class="actions">${link('learn/1', 'Learn how to scope your app')}${usesExpo(p.stack) ? link('starter', 'Expo starter lab') : ''}</div>
      </section>`;
  }

  function projectPage() {
    const count = Object.keys(milestones).filter(id => state.notes[id]?.trim()).length;
    return `${heading('CAPSTONE', 'My app project', 'Carry the same app idea from first sketch to release readiness.')}
      ${state.appName ? `<section class="panel"><h2>Plan Mode</h2><p>Make your pre-build decisions and generate an AI foundation prompt.</p><div class="actions">${link('plan', Object.keys(state.plan).length ? 'Review project plan' : 'Start project plan', 'primary')}</div></section>` : ''}
      <form id="project-form"><div class="panel"><label for="app-name">App name</label><input class="app-name" id="app-name" name="name" required maxlength="80" value="${escape(state.appName)}" placeholder="e.g. Pocket Budget"><p class="subtle">${count} of ${Object.keys(milestones).length} milestones recorded</p></div>
      ${Object.entries(milestones).map(([id, [title, prompt]]) => `<section class="panel"><span class="eyebrow">MISSION ${Number(id) + 1}</span><h2>${title}</h2><label for="note-${id}">${prompt}</label><textarea id="note-${id}" name="${id}" maxlength="1200">${escape(state.notes[id])}</textarea>${link(`build/${id}`, 'Open build tasks')}</section>`).join('')}
      <button class="primary" type="submit">${state.appName ? 'Save project' : 'Create project and plan'}</button><p id="save-status" class="subtle" role="status"></p></form>`;
  }

  function route() {
    const [page, rawId, rawIndex] = location.hash.slice(1).split('/');
    return { page: page || 'path', id: /^\d+$/.test(rawId) && stages[Number(rawId)] ? Number(rawId) : null, index: /^\d+$/.test(rawIndex) ? Number(rawIndex) : 0 };
  }
  function render(focus = false) {
    const { page, id, index } = route();
    const quiz = id !== null && lessons[id].questions[index];
    let content;
    if (page === 'build') content = buildPage(id);
    else if (page === 'learn' && id !== null) content = lessonPage(id);
    else if (page === 'quiz' && quiz) content = quizPage(id, index, false);
    else if (page === 'review') content = quiz && ((reviewKey === questionKey(id, index) && reviewFinished) || isDue(questionKey(id, index))) ? quizPage(id, index, true) : reviewPage();
    else if (page === 'starter') content = starterPage();
    else if (page === 'project') content = projectPage();
    else if (page === 'plan') content = planPage();
    else if (page === 'result' && id !== null) {
      content = `${heading('MISSION RESULT', mastered(id) ? 'Mission mastered!' : 'Keep practicing', escape(lessons[id].title))}<section class="panel"><p>${mastered(id) ? 'Take what you learned into your project.' : 'Replay the knowledge check to finish the mission.'}</p><div class="actions">${link(`build/${id}`, 'Apply it in Build →', 'primary')}${link('path', 'Mission map')}${id + 1 < stages.length ? link(`learn/${id + 1}`, 'Next mission') : ''}</div></section>`;
    } else content = pathPage();
    screen.innerHTML = `${canSave ? '' : '<p class="feedback wrong" role="status">This browser could not save progress. Keep this tab open to continue.</p>'}${content}`;
    document.querySelector('#xp').textContent = `${Object.keys(state.correct).length * 10} XP`;
    const current = page === 'plan' ? 'project' : ['build', 'review', 'project'].includes(page) ? page : 'path';
    document.querySelectorAll('.dock a').forEach(a => a.dataset.page === current ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
    if (focus) {
      window.scrollTo(0, 0);
      screen.querySelector('h1')?.focus({ preventScroll: true });
    }
  }

  screen.addEventListener('click', async event => {
    const button = event.target.closest('button');
    if (!button) return;
    const { page, id, index } = route();
    if (button.hasAttribute('data-copy-plan')) {
      const prompt = screen.querySelector('#foundation-prompt');
      const status = screen.querySelector('#plan-status');
      try { await navigator.clipboard.writeText(prompt.value); status.textContent = 'Foundation prompt copied.'; }
      catch { prompt.focus(); prompt.select(); status.textContent = 'The prompt is selected. Use your browser’s Copy command.'; }
      return;
    }
    if (button.hasAttribute('data-suggest-stack')) {
      const form = screen.querySelector('#plan-form');
      const fields = form.elements;
      const hint = screen.querySelector('#stack-hint');
      if (!decided(fields.target.value)) { hint.textContent = 'Choose the first platform so the suggestion fits your app.'; return; }
      let applied = 0;
      for (const [key, value] of Object.entries(recommendTools(Object.fromEntries(new FormData(form))))) {
        if (value && !decided(fields[key].value)) { fields[key].value = value; applied += 1; }
      }
      refreshToolGuides(form);
      hint.textContent = applied ? 'Suggestions filled the open choices. Review them before saving your plan.' : 'Your existing choices are kept. Compare the options above to make a change.';
      return;
    }
    if (button.dataset.undoSkip) {
      delete state.skipped[button.dataset.undoSkip];
      save();
      render();
      const summary = screen.querySelector(`[data-skip-step="${button.dataset.undoSkip}"]`).closest('details');
      summary.open = true;
      summary.querySelector('summary').focus();
    } else if (button.dataset.answer !== undefined && id !== null && !feedback) {
      const entry = lessons[id].questions[index];
      const selected = Number(button.dataset.answer);
      const key = questionKey(id, index);
      const correct = selected === entry.answer;
      feedback = { selected, correct };
      if (correct) {
        state.correct[key] = true;
        if (page === 'review' || !state.due[key]) state.due[key] = nextReview();
        if (page === 'review') {
          delete state.missed[key];
          reviewKey = key;
          reviewFinished = true;
        }
      } else state.missed[key] = true;
      save();
      render();
      screen.querySelector('.feedback[tabindex]')?.focus();
    } else if (button.hasAttribute('data-retry')) {
      feedback = null;
      render();
      screen.querySelector('.choice')?.focus();
    } else if (button.hasAttribute('data-next-review')) location.hash = 'review';
    else if (button.dataset.drill !== undefined) {
      practiceIndex = Number(button.dataset.drill);
      order = [];
      feedback = null;
      screen.querySelectorAll('[data-drill]').forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
      screen.querySelector('#practice').innerHTML = gamePanel(id, lessons[id].drills[practiceIndex]);
    } else if (button.dataset.order !== undefined || button.dataset.match !== undefined || button.hasAttribute('data-reset-order')) {
      const game = lessons[id].drills[practiceIndex];
      if (button.hasAttribute('data-reset-order')) {
        order = [];
        feedback = null;
      } else if (game.type === 'order') {
        order.push(Number(button.dataset.order));
        if (order.length === game.items.length) {
          feedback = { game: true, text: order.every((value, i) => value === i) ? `Correct. ${game.why}` : 'That order needs another try. Tap Start over.' };
        }
      } else if (button.dataset.match === game.pairs[order.length][1]) {
        order.push(button.dataset.match);
        feedback = { game: true, text: 'Correct. Here is the next pair.' };
      } else feedback = { game: true, text: 'That pair doesn’t match. Try another answer.' };
      const practice = screen.querySelector('#practice');
      practice.innerHTML = gamePanel(id, game);
      practice.querySelector('.choice, .secondary')?.focus({ preventScroll: true });
    } else if (button.dataset.copy && id !== null) {
      const step = stages[id].steps.find(item => item.id === button.dataset.copy);
      const status = screen.querySelector(`[data-copy-status="${step.id}"]`);
      try {
        await navigator.clipboard.writeText(step.prompt.replace(/\[APP_NAME\]/g, () => state.appName || 'my app'));
        status.textContent = 'Prompt copied.';
      } catch { status.textContent = 'Select and copy the prompt text above.'; }
    }
  });
  screen.addEventListener('change', event => {
    if (event.target.matches('#plan-form select')) refreshToolGuides(event.target.form);
    if (event.target.matches('input[data-proof]')) {
      state.proofs[event.target.dataset.proof] = event.target.checked;
      save();
    }
  });
  screen.addEventListener('submit', event => {
    if (event.target.id === 'plan-form') {
      event.preventDefault();
      const data = new FormData(event.target);
      state.plan = Object.fromEntries(planFields.map(([key]) => [key, data.get(key).trim()]).filter(([, value]) => value));
      save();
      render();
      screen.querySelector('#plan-result').focus();
      return;
    }
    const stepId = event.target.dataset.skipStep;
    if (stepId) {
      event.preventDefault();
      const reason = new FormData(event.target).get('reason').trim();
      if (!reason) {
        event.target.querySelector('[role=status]').textContent = 'Enter a reason before recording this task as not applicable.';
        return;
      }
      state.skipped[stepId] = reason;
      save();
      render();
      const form = screen.querySelector(`[data-skip-step="${stepId}"]`);
      form.closest('details').open = true;
      form.querySelector('button').focus();
      return;
    }
    if (event.target.id !== 'project-form') return;
    event.preventDefault();
    const data = new FormData(event.target);
    const creating = !state.appName;
    if (!data.get('name').trim()) {
      screen.querySelector('#save-status').textContent = 'Enter an app name before creating the project.';
      return;
    }
    state.appName = data.get('name').trim();
    state.notes = Object.fromEntries(Object.keys(milestones).map(id => [id, data.get(id).trim()]));
    save();
    if (creating) { location.hash = 'plan'; return; }
    render();
    screen.querySelector('#save-status').textContent = canSave ? 'Project saved.' : 'Project kept in this tab only.';
    screen.querySelector('button[type=submit]').focus();
  });
  addEventListener('hashchange', () => {
    feedback = null;
    order = [];
    practiceIndex = 0;
    reviewFinished = false;
    reviewKey = null;
    render(true);
  });
  save();
  render();
})();
