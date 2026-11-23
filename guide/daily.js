// daily.js: one question a day, the same for everyone that day. Answering counts as a streak day.
// Saved for YOU: guide.daily = { 'YYYY-MM-DD': { id, ok, pick } } (last 400 days).
const Daily = (() => {
  let pool = null, practice = null;
  const hash = s => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const build = () => pool ||= [
    ...Game.build().levels.flatMap(l => l.quiz.map(q => ({ id: 'g:' + q.qid, q: `${q.story} Which part of the book would have prevented this?`, options: q.opts.map(o => o.text), answer: q.opts.findIndex(o => o.sid === q.answer), why: '', href: '#/s/' + q.qid, where: 'Open that part of the book', lvl: l.n, world: l.world }))),
    ...window.LEARN.modules.flatMap(m => m.quiz.map((x, i) => ({ id: `${m.id}:q${i}`, q: x.q, options: x.options, answer: x.answer, why: x.why || '', href: '#/learn/' + m.id, where: 'Open the Learn Lab module', levels: m.levels }))),
  ].filter(x => x.answer >= 0 && x.options?.length > 1);
  const forDay = k => build()[hash(k) % build().length];
  const log = () => store.get('daily', {});
  const dayBack = n => { const d = new Date(); d.setDate(d.getDate() - n); return Game.dayKey(d); };

  function card(q, key, done, live) {
    const rec = done || (practice && practice.key === key ? practice : null);
    const opts = q.options.map((o, i) => {
      const cls = rec ? (i === q.answer ? ' right' : i === rec.pick ? ' wrong' : '') : '';
      return `<button type="button" class="dq-opt${cls}" data-dq="${i}" data-key="${key}" data-live="${live ? 1 : 0}"${rec ? ' disabled' : ''}>${esc(o)}</button>`;
    }).join('');
    const fb = rec ? `<p class="dq-fb" role="status"><b>${rec.pick === q.answer ? 'Correct.' : 'Not quite.'}</b> ${esc(q.why || (rec.pick === q.answer ? '' : 'The right answer is marked in green.'))} <a href="${q.href}">${q.where}</a></p>` : '';
    return `<div class="dq"><p class="dq-q">${esc(q.q)}</p><div class="dq-opts">${opts}</div>${fb}</div>`;
  }

  function page() {
    document.title = 'Daily challenge';
    const t = Game.dayKey(new Date()), L = log(), q = forDay(t), done = L[t];
    const sk = Game.streakInfo(), yKey = dayBack(1), missed = !L[yKey] && !done && Object.keys(L).length > 0;
    return `<article class="tool"><p class="crumb"><a href="#/learn">Learn Lab</a> › Daily challenge</p>
      <h1>Daily challenge</h1>
      <p class="tool-sub">One question a day. Answer it right to keep your streak going. ${Game.hasGame() ? `You are on <b>${sk.n}</b> day${sk.n === 1 ? '' : 's'} in a row.` : '<a href="#/new">Start a quest</a> to keep a streak.'}</p>
      ${done ? `<p class="dq-done" role="status">${done.ok ? 'Done for today. See you tomorrow.' : 'Done for today. Try again tomorrow.'}</p>` : ''}
      ${card(q, t, done, true)}
      ${missed ? `<h2 class="sec-title">Comeback question</h2><p class="tool-sub">You missed yesterday. This one is just for practice and does not change your streak.</p>${card(forDay(yKey), yKey, null, false)}` : ''}
    </article>`;
  }

  function init() {
    main.addEventListener('click', e => {
      const b = e.target.closest('[data-dq]');
      if (!b || location.hash.split('/')[1] !== 'daily') return;
      const key = b.dataset.key, pick = +b.dataset.dq, q = forDay(key), ok = pick === q.answer;
      if (b.dataset.live === '1') {
        const L = log(); if (L[key]) return;
        L[key] = { id: q.id, ok, pick };
        store.set('daily', Object.fromEntries(Object.entries(L).sort().slice(-400)));
        if (ok) Game.noteActivity();
      } else practice = { key, pick };
      main.innerHTML = page();
    });
  }
  return { page, init, all: build };
})();
