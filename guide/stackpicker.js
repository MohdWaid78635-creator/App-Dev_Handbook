// stackpicker.js: five questions, then a plain recommendation. Every recommendation comes from the book itself:
// the backend table (5.3), sign-in comparison (5.4), spending limits (5.7), and the "who helps" rules.
// The book covers Android apps built with Supabase. If you answer "iPhone" or "website", the picker says so honestly.
// Saved per app: stack:<app> = { a: answers, step }. The result can be copied into your Decisions log.
const StackPicker = (() => {
  const Q = [
    { id: 'type', q: 'What are you building?', o: [['android', 'An Android phone app'], ['ios', 'An iPhone app (or Android and iPhone)'], ['web', 'A website or web app']] },
    { id: 'team', q: 'Who is building it?', o: [['solo', 'Just me'], ['small', '2 or 3 people'], ['big', 'A bigger team']] },
    { id: 'money', q: 'What is your monthly budget for running it?', o: [['free', 'Nothing yet'], ['low', 'A small amount'], ['ok', 'I can pay for a proper plan']] },
    { id: 'time', q: 'When do you need version 1?', o: [['fast', 'In under a month'], ['mid', 'In 1 to 3 months'], ['flex', 'No fixed date']] },
    { id: 'skill', q: 'How comfortable are you with code?', o: [['none', 'I am not a coder'], ['some', 'I know a little'], ['dev', 'I am a developer']] },
  ];
  const sec = (id, label) => ({ id, label });

  // pure function: answers in, recommendation out (checked for every combination in check-game.mjs)
  function recommend(a) {
    const out = [], R = (title, text, links = []) => out.push({ title, text, links });
    if (a.type === 'android') R('Platform', 'An Android app written in Kotlin with Jetpack Compose. This is exactly what the book teaches, so every check and prompt applies as written.', [sec('5.1', 'The big picture'), sec('5.2', 'Inside the Android app')]);
    else if (a.type === 'ios') R('Platform', 'The book covers Android only. For iPhone you need other tools that this book does not teach. You can still use its backend, security and release thinking, but ask your AI for the iPhone parts and check each answer with the book\'s "proof to demand" lists.', [sec('5.1', 'The big picture')]);
    else R('Platform', 'The book is about phone apps, not websites. Its backend, security and cost chapters still apply to a web app, but the screens and the release steps do not. Treat the book as your safety checklist, not your build guide.', [sec('5.1', 'The big picture')]);

    if (a.skill === 'dev' && a.money === 'ok' && a.time === 'flex') R('Backend', 'Supabase is the book\'s default. A server of your own gives total control, but you must handle security, updates, backups and uptime yourself. The book does not recommend it unless you are an experienced developer, so write down the reason in your Decisions log.', [sec('5.3', 'Backend options compared')]);
    else if (a.money === 'free') R('Backend', 'Supabase (the book\'s default). The free plan is fine for building, but free projects pause after a quiet week and have no automatic backups, so plan a paid plan from launch day. Firebase is the book\'s good second choice: it never pauses idle apps, but it has no hard spending limit by default and is harder to leave later.', [sec('5.3', 'Backend options compared'), sec('5.7', 'Costs, limits and lock-in')]);
    else R('Backend', 'Supabase (the book\'s default). Real Postgres database, clear access rules, and easy to move away from later. Turn the spend cap ON and set billing alerts. Firebase is the good second choice if you must use it.', [sec('5.3', 'Backend options compared'), sec('5.7', 'Costs, limits and lock-in')]);

    if (a.team === 'solo') R('Sign-in', 'Supabase Auth. It is built in, adds no extra company or bill, and works directly with your database access rules. Never build your own password system.', [sec('5.4', 'Sign-in: Supabase Auth or Clerk?')]);
    else R('Sign-in', 'Supabase Auth is the default and the simplest. Clerk has stronger team and organisation features and ready-made screens, but it is an extra company and bill and must be connected to Supabase. Choose Clerk only if you really need organisations.', [sec('5.4', 'Sign-in: Supabase Auth or Clerk?')]);

    R('Money', a.money === 'free' ? 'Write every cost in the Cost table with a link to its official price page. Start with the free plans, and add a paid plan to the table before launch.' : 'Fill in the Cost table at 100, 1,000 and 10,000 users, link every price to its official page, and set a monthly limit.', [sec('3.5', 'Costs and the four checks'), sec('5.7', 'Costs, limits and lock-in')]);

    if (a.time === 'fast') R('Time', 'Under a month is tight. Cut the feature list hard: only the MUST features on the Feature board. Do not skip the security and backup checks to save time.', [sec('3.2', 'The first version')]);
    else R('Time', 'Plan in small steps and finish one quest level at a time. The Feature board keeps version 1 small.', [sec('3.2', 'The first version')]);

    if (a.skill === 'none') R('Who helps', 'You are not a coder, so the book\'s rule matters most: ask the AI for proof at every step, and pay a human expert to review security before launch.', [sec('12.6', 'Red-team: the AI attacks its own app')]);
    else if (a.skill === 'some') R('Who helps', 'Use the AI for the code, and use the "proof to demand" list in each section to check its work. Book a short human review before launch.', [sec('12.6', 'Red-team: the AI attacks its own app')]);
    else R('Who helps', 'You can read what the AI writes, so use the book as your checklist. A second pair of eyes on security is still worth it.', [sec('12.6', 'Red-team: the AI attacks its own app')]);
    return out;
  }

  const key = () => 'stack:' + currentApp;
  let mem = { a: {}, step: 0 };
  const load = () => (currentApp ? store.get(key(), { a: {}, step: 0 }) : mem);
  const put = s => { mem = s; if (currentApp) store.set(key(), s); };
  const label = (qid, v) => Q.find(x => x.id === qid).o.find(o => o[0] === v)?.[1] || v;
  const allAnswered = a => Q.every(q => a[q.id]);

  function page() {
    document.title = 'Pick my stack';
    const s = load(), done = allAnswered(s.a) && s.step >= Q.length;
    if (done) {
      const rec = recommend(s.a);
      return `<article class="tool"><p class="crumb"><a href="#/myapp">My app sheets</a> › Pick my stack</p><h1>Your recommended stack</h1>
        <p class="tool-sub">Based on your answers: ${Q.map(q => esc(label(q.id, s.a[q.id]))).join(' · ')}</p>
        ${rec.map(r => `<section class="sp-card"><h2>${esc(r.title)}</h2><p>${esc(r.text)}</p><p class="sp-links">${r.links.map(l => `<a href="#/s/${l.id}">${esc(l.id)} ${esc(l.label)}</a>`).join(' ')}</p></section>`).join('')}
        <div class="sp-actions"><button type="button" class="btn" data-sp="save"${currentApp && store.get('game:' + currentApp) ? '' : ' disabled'}>Save to my Decisions log</button><button type="button" class="btn ghost" data-sp="again">Start again</button></div>
        <p class="tool-sub" id="sp-status" role="status"></p>${currentApp && store.get('game:' + currentApp) ? '' : '<p class="tool-sub">Start a quest to save this to your Decisions log.</p>'}</article>`;
    }
    const i = Math.min(s.step, Q.length - 1), q = Q[i];
    return `<article class="tool"><p class="crumb"><a href="#/myapp">My app sheets</a> › Pick my stack</p><h1>Pick my stack</h1>
      <p class="sp-step" id="sp-step">Step ${i + 1} of ${Q.length}</p>
      <div class="sp-bar" role="progressbar" aria-valuemin="1" aria-valuemax="${Q.length}" aria-valuenow="${i + 1}" aria-label="Question progress"><span style="width:${(i + 1) / Q.length * 100}%"></span></div>
      <fieldset class="sp-q"><legend>${esc(q.q)}</legend>${q.o.map(([v, t]) => `<button type="button" class="dq-opt${s.a[q.id] === v ? ' right' : ''}" data-sp-pick="${v}" aria-pressed="${s.a[q.id] === v}">${esc(t)}</button>`).join('')}</fieldset>
      <div class="sp-actions">${i > 0 ? '<button type="button" class="btn ghost" data-sp="back">Back</button>' : ''}</div></article>`;
  }
  function asText() {
    if (!currentApp) return '';
    const s = store.get(key(), null);
    if (!s || !allAnswered(s.a)) return '';
    return ['## Chosen stack', ...recommend(s.a).map(r => `- **${r.title}:** ${r.text}`)].join('\n');
  }
  const here = () => location.hash.split('/')[1] === 'stack';
  function init() {
    main.addEventListener('click', e => {
      if (!here()) return;
      const s = load(), pick = e.target.closest('[data-sp-pick]'), act = e.target.closest('[data-sp]')?.dataset.sp;
      if (pick) { const q = Q[s.step]; s.a[q.id] = pick.dataset.spPick; s.step++; put(s); main.innerHTML = page(); document.querySelector('.sp-q button, .sp-actions .btn')?.focus(); return; }
      if (act === 'back') { s.step = Math.max(0, s.step - 1); put(s); main.innerHTML = page(); }
      else if (act === 'again') { put({ a: {}, step: 0 }); main.innerHTML = page(); }
      else if (act === 'save') {
        const rec = recommend(s.a), ok = MyApp.addDecision('Chosen stack: ' + rec.filter(r => ['Backend', 'Sign-in'].includes(r.title)).map(r => r.text.split('.')[0]).join(' | '), 'Answers: ' + Q.map(q => label(q.id, s.a[q.id])).join(', '), 'Own server (the book does not recommend it for non-experts)');
        document.getElementById('sp-status').textContent = ok ? 'Saved to your Decisions log.' : 'Could not save (the log is full or the browser has no room).';
      }
    });
  }
  return { page, init, asText, recommend, questions: Q };
})();
