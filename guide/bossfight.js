// bossfight.js: the boss fight at the end of every quest level. 5 questions, 60 seconds, 3 right to pass.
// A level counts as finished only when its proofs are ticked AND the fight is passed (see Game.status).
// Saved per app: fight:<app> = { v:1, [level]: { best, tries, ok, gf? } }  (gf = finished before boss fights existed).
// "No timer" is saved for YOU in guide.bosscfg, because a time limit shuts some people out.
const Boss = (() => {
  const N = 5, PASS = 3, SECS = 60;
  const cfg = () => store.get('bosscfg', { noTimer: false });
  const rec = () => store.get('fight:' + currentApp, { v: 1 });
  const hash = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const shuffled = (arr, seed) => { const a = [...arr]; let h = hash(seed); for (let i = a.length - 1; i > 0; i--) { h = (h * 1103515245 + 12345) >>> 0; const j = h % (i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // questions for one level: its own first, then the same world, then everything, so there are always enough
  function pool(n, seed) {
    const all = Daily.all(), lvl = Game.build().levels.find(l => l.n === n);
    const own = all.filter(q => q.lvl === n || q.levels?.includes(n));
    const world = all.filter(q => q.world && q.world === lvl?.world);
    const seen = new Set(), out = [];
    for (const group of [shuffled(own, seed), shuffled(world, seed + 'w'), shuffled(all, seed + 'a')])
      for (const q of group) if (!seen.has(q.id) && out.length < N) { seen.add(q.id); out.push(q); }
    return out;
  }

  // ---- one fight in progress ----
  let f = null, timer = null, lastFocus = null;
  const el = () => document.getElementById('boss');
  const stop = () => { clearInterval(timer); timer = null; };
  function close(refreshAfter) {
    stop(); el()?.remove(); f = null;
    document.body.style.overflow = '';
    lastFocus?.focus?.();
    if (refreshAfter) Game.refresh(); // a pass can finish the level: this shows the celebration
  }
  function open(n) {
    if (el()) return;
    lastFocus = document.activeElement;
    const d = document.createElement('div');
    d.id = 'boss'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', `Boss fight, level ${n}`);
    document.body.appendChild(d); document.body.style.overflow = 'hidden';
    f = { n, qs: [], i: 0, score: 0, picked: null, end: 0, over: false };
    intro();
  }
  const lvlName = () => { const l = Game.build().levels.find(x => x.n === f.n); return `Level ${f.n}: ${l ? l.name : ''}`; };
  function frame(html) { const d = el(); d.innerHTML = `<div class="boss-card">${html}</div>`; (d.querySelector('[data-bf-focus]') || d.querySelector('button'))?.focus(); }

  function intro() {
    const r = rec()[f.n];
    frame(`<p class="boss-tag">Boss fight</p><h2>${esc(lvlName())}</h2>
      <p>${N} questions. You need ${PASS} right to pass. ${cfg().noTimer ? 'No timer.' : `You have ${SECS} seconds in total.`}</p>
      ${r?.tries ? `<p class="boss-note">Your best so far: ${r.best} of ${N} · ${r.tries} attempt${r.tries === 1 ? '' : 's'}${r.gf ? ' · you finished this level before boss fights were added' : ''}</p>` : ''}
      <label class="boss-opt"><input type="checkbox" id="bf-nt"${cfg().noTimer ? ' checked' : ''}> <span>Practice without the timer</span></label>
      <div class="boss-actions"><button type="button" class="btn" data-bf="start" data-bf-focus>Start the fight</button><button type="button" class="btn ghost" data-bf="quit">Not now</button></div>`);
  }
  function start() {
    const tries = (rec()[f.n]?.tries || 0);
    f.qs = pool(f.n, 'fight' + f.n + ':' + tries);
    f.i = 0; f.score = 0; f.picked = null; f.over = false;
    f.end = cfg().noTimer ? 0 : Date.now() + SECS * 1000;
    if (f.end) timer = setInterval(tick, 250);
    question();
  }
  const left = () => Math.max(0, Math.ceil((f.end - Date.now()) / 1000));
  function tick() {
    const t = document.getElementById('bf-time');
    if (!f || f.over) return stop();
    if (left() <= 0) return finish(true);
    if (t) { t.textContent = left() + 's'; t.parentElement.style.setProperty('--p', Math.round(left() / SECS * 100)); }
  }
  function question() {
    const q = f.qs[f.i], done = f.picked !== null;
    const opts = q.options.map((o, i) => `<button type="button" class="dq-opt${done ? (i === q.answer ? ' right' : i === f.picked ? ' wrong' : '') : ''}" data-bf-pick="${i}"${done ? ' disabled' : ''}${i === 0 && !done ? ' data-bf-focus' : ''}>${esc(o)}</button>`).join('');
    frame(`<div class="boss-top"><span>${esc(lvlName())}</span><span>Question ${f.i + 1} of ${f.qs.length}</span>${f.end ? `<span class="boss-ring" style="--p:${Math.round(left() / SECS * 100)}" role="timer" aria-label="Time left"><b id="bf-time">${left()}s</b></span>` : ''}</div>
      <p class="dq-q">${esc(q.q)}</p><div class="dq-opts">${opts}</div>
      ${done ? `<p class="dq-fb" role="status"><b>${f.picked === q.answer ? 'Correct.' : 'Not quite.'}</b> ${esc(q.why || '')}</p><div class="boss-actions"><button type="button" class="btn" data-bf="next" data-bf-focus>${f.i + 1 < f.qs.length ? 'Next question' : 'See my score'}</button></div>` : ''}`);
  }
  function finish(timeUp) {
    stop(); f.over = true;
    const pass = f.score >= PASS, all = rec(), r = all[f.n] || { best: 0, tries: 0, ok: false };
    r.best = Math.max(r.best || 0, f.score); r.tries = (r.tries || 0) + 1; r.ok = !!r.ok || pass; delete r.gf;
    all[f.n] = r;
    if (!store.set('fight:' + currentApp, { v: 1, ...all })) toast('Could not save your score: your browser is blocking saved data.');
    Game.noteActivity();
    frame(`<p class="boss-tag">${pass ? 'Gate passed' : 'Not this time'}</p><h2>${f.score} of ${f.qs.length} right</h2>
      <p>${timeUp ? 'Time ran out. ' : ''}${pass ? `You needed ${PASS}. ${r.ok ? 'The fight is done for this level.' : ''}` : `You need ${PASS} to pass. Read the part of the book each question points to, then try again. Attempts so far: ${r.tries}.`}</p>
      <div class="boss-actions">${pass ? '<button type="button" class="btn" data-bf="done" data-bf-focus>Continue</button>' : '<button type="button" class="btn" data-bf="retry" data-bf-focus>Try again</button><button type="button" class="btn ghost" data-bf="done">Close</button>'}</div>`);
  }

  function init() {
    document.addEventListener('click', e => {
      const open_ = e.target.closest('[data-boss]');
      if (open_) { if (!open_.disabled) open(+open_.dataset.boss); return; }
      if (!f) return;
      const pick = e.target.closest('[data-bf-pick]'), act = e.target.closest('[data-bf]')?.dataset.bf;
      if (pick && f.picked === null) {
        f.picked = +pick.dataset.bfPick;
        if (f.picked === f.qs[f.i].answer) f.score++;
        question();
      } else if (act === 'start') { store.set('bosscfg', { noTimer: document.getElementById('bf-nt').checked }); start(); }
      else if (act === 'next') { if (f.i + 1 < f.qs.length) { f.i++; f.picked = null; question(); } else finish(false); }
      else if (act === 'retry') intro();
      else if (act === 'quit') close(false);
      else if (act === 'done') close(true);
    });
    document.addEventListener('keydown', e => {
      if (!f || !el()) return;
      if (e.key === 'Escape') { if (f.over || !f.qs.length || confirm('Leave the boss fight? This attempt will not count.')) close(f.over); return; }
      if (e.key === 'Tab') { // keep keyboard focus inside the fight
        const b = [...el().querySelectorAll('button:not([disabled]), input')];
        if (!b.length) return;
        const first = b[0], last = b[b.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    addEventListener('hashchange', () => { if (f) close(false); }); // leaving the page ends the fight and stops its timer
  }
  const state = n => { const r = rec()[n]; return r ? { best: r.best || 0, tries: r.tries || 0, ok: !!r.ok, gf: !!r.gf } : null; };
  return { init, state, PASS, N };
})();
