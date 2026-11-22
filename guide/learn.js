// learn.js: the Learn Lab. Short modules that teach the ideas behind building an app, with examples, small games,
// a quiz, and an "explain it back" box, so you understand what the AI builds. Content is in learn-data.js.
// Progress is saved in this browser for YOU (not per app): guide.learn = { q: {questionId: true}, notes: {moduleId: text} }.
// Points and "module complete" are worked out from that, never stored, so they always match what you really did.
const Learn = (() => {
  const L = window.LEARN, XP = { q: 10, note: 20, module: 30 }, MIN_NOTE = 25;
  const RANKS = [['Curious', 0], ['Student', 0.12], ['Practitioner', 0.35], ['Builder', 0.65], ['Architect', 0.95]];
  const ring = (done, total, cls = '') => `<div class="ring ${cls}" style="--p:${total ? Math.round(done / total * 100) : 0}" role="img" aria-label="${done} of ${total}"><span>${done}/${total}</span></div>`;
  const mem = { order: {}, match: {}, wrong: new Set(), at: '' }; // answers in progress (not saved until correct)

  const data = () => store.get('learn', { q: {}, notes: {} });
  const save = d => store.set('learn', d);
  const hash = s => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const shuffled = (arr, seed) => { const a = [...arr]; let h = hash(seed); for (let i = a.length - 1; i > 0; i--) { h = (h * 1103515245 + 12345) >>> 0; const j = h % (i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  const questions = m => [...m.try.map((x, i) => ({ ...x, id: `${m.id}:t${i}`, kind: 'try' })), ...m.quiz.map((x, i) => ({ ...x, type: 'choice', id: `${m.id}:q${i}`, kind: 'quiz' }))];
  const mstate = m => {
    const d = data(), qs = questions(m), done = qs.filter(q => d.q[q.id]).length, note = (d.notes[m.id] || '').trim().length >= MIN_NOTE;
    return { total: qs.length, done, note, complete: done === qs.length && note, xp: done * XP.q + (note ? XP.note : 0) + (done === qs.length && note ? XP.module : 0) };
  };
  const overall = () => {
    const ms = L.modules.map(mstate), xp = ms.reduce((a, s) => a + s.xp, 0), max = L.modules.reduce((a, m) => a + questions(m).length * XP.q + XP.note + XP.module, 0);
    const rank = RANKS.reduce((r, [name, f]) => (xp >= Math.round(f * max) ? name : r), RANKS[0][0]);
    return { ms, xp, max, rank, complete: ms.filter(s => s.complete).length };
  };
  const nextModule = () => L.modules.find((m, i) => !overall().ms[i].complete);

  // ---------- question widgets ----------
  function choice(q) {
    const d = data(), ok = d.q[q.id];
    return `<div class="opts" role="group" aria-label="Answers">${q.options.map((o, i) => {
      const bad = mem.wrong.has(q.id + ':' + i), good = ok && i === q.answer;
      return `<button type="button" class="opt ${good ? 'good' : ''} ${bad ? 'bad' : ''}" data-ln-choice="${q.id}" data-i="${i}"${ok || bad ? ' disabled' : ''}>${esc(o)}</button>`;
    }).join('')}</div>`;
  }
  function order(q) {
    const d = data(), ok = d.q[q.id], pick = mem.order[q.id] || [];
    const shown = shuffled(q.items.map((t, i) => i), q.id);
    const chosen = ok ? q.items.map((_, i) => i) : pick;
    return `<ol class="lnorder" aria-label="Your order">${chosen.map((i, k) => `<li class="${ok ? 'ok' : ''}"><span class="n">${k + 1}</span>${esc(q.items[i])}</li>`).join('') || '<li class="empty">Tap the steps below in the right order.</li>'}</ol>
      ${ok ? '' : `<div class="opts">${shown.filter(i => !pick.includes(i)).map(i => `<button type="button" class="opt" data-ln-order="${q.id}" data-i="${i}">${esc(q.items[i])}</button>`).join('')}</div>${pick.length ? `<button type="button" class="mini-btn" data-ln-reset="${q.id}">Start again</button>` : ''}`}`;
  }
  function match(q) {
    const d = data(), ok = d.q[q.id], sel = mem.match[q.id] || {}, rights = shuffled([...new Set(q.pairs.map(p => p[1]))], q.id), checked = mem.match[q.id + ':checked'];
    return `<div class="lnmatch">${q.pairs.map((p, i) => {
      const v = ok ? p[1] : sel[i] || '', right = v && v === p[1];
      return `<div class="mrow ${ok || (checked && right) ? 'right' : checked && v ? 'wrong' : ''}"><span class="ml">${esc(p[0])}</span>
        <select data-ln-match="${q.id}" data-i="${i}" aria-label="Answer for: ${esc(p[0])}"${ok ? ' disabled' : ''}><option value="">Choose…</option>${rights.map(r => `<option${v === r ? ' selected' : ''}>${esc(r)}</option>`).join('')}</select></div>`;
    }).join('')}</div>${ok ? '' : `<button type="button" class="btn" data-ln-check="${q.id}">Check my answers</button>`}`;
  }
  function question(q, n) {
    const ok = data().q[q.id];
    return `<li class="lnq ${ok ? 'ok' : ''}"><p class="lnqs"><span class="qn">${q.kind === 'try' ? 'Try it' : 'Quiz'} ${n}</span> ${esc(q.q)}</p>
      ${q.type === 'choice' ? choice(q) : q.type === 'order' ? order(q) : match(q)}
      ${ok ? `<div class="explain" role="status"><b>Right. +${XP.q} XP.</b> ${esc(q.why)}</div>` : mem.wrong.has('hint:' + q.id) ? '<p class="hint" role="status">Not quite. Look again, then try once more.</p>' : ''}</li>`;
  }

  // ---------- pages ----------
  function home() {
    document.title = 'Learn Lab';
    const o = overall(), pct = Math.round(o.xp / o.max * 100), next = nextModule();
    return `<div class="wide learnhome">
      <p class="kicker">Learn Lab</p><h1>Understand it, so you are not just trusting the AI.</h1>
      <p class="lede">${L.modules.length} short modules, each with examples, small games, a quiz and a box where you explain it back in your own words. Built from your own course and playbook. Do one a day: ten minutes is enough.</p>
      <section class="hud lhud"><div class="hud-main"><p class="rank"><span class="rank-name">${icon('star')} ${esc(o.rank)}</span> · ${o.complete} of ${L.modules.length} modules complete</p>
        <div class="xpbar" role="progressbar" aria-label="Learning points" aria-valuemin="0" aria-valuemax="${o.max}" aria-valuenow="${o.xp}"><span style="width:${pct}%"></span></div>
        <p class="xptext">${o.xp} / ${o.max} XP</p>
        ${next ? `<a class="btn big" href="#/learn/${next.id}">${o.ms[L.modules.indexOf(next)].done || o.ms[L.modules.indexOf(next)].note ? 'Continue' : 'Start'}: ${esc(next.title)} ${icon('arrow')}</a>` : '<p class="win">Every module is complete. Keep the habit: re-read one a month.</p>'}</div></section>
      <ol class="modgrid">${L.modules.map((m, i) => { const s = o.ms[i]; return `<li><a class="modcard ${s.complete ? 'done' : m === next ? 'next' : ''}" href="#/learn/${m.id}"><span class="mn">${s.complete ? icon('check') : i + 1}</span><span><b>${esc(m.title)}</b><small>${esc(m.blurb)}</small><small class="mprog">${s.complete ? 'Complete' : `${s.done} of ${s.total} games and questions${s.note ? ', explained' : ''}`}</small></span></a></li>`; }).join('')}</ol>
      <details class="howscore"><summary>Where this content comes from</summary><p>Everything here is built from your own documents: ${L.sources.map(s => `<b>${esc(s.file)}</b> (${esc(s.what)})`).join('; ')}. Fees, percentages and review times are left out on purpose because they change: see <a href="#/facts">Facts that change</a>. Where your documents disagree with the Handbook or with Google, the module says so and uses the safer source.</p></details>
    </div>`;
  }

  const chipsFor = m => `<p class="lnlinks">${m.levels.length ? `<b>Used in the quest:</b> ${m.levels.map(n => { const lv = GAME.levels[n]; return `<a class="chip" href="#/level/${n}">Level ${n}: ${esc(lv.name)}</a>`; }).join(' ')}` : ''} ${m.sections.length ? `<br><b>In your Handbook:</b> ${m.sections.map(id => { const x = byId[id]; return x ? `<a href="#/s/${id}">${esc((secLabel(x.s) + x.s.title.replace(/\s*\((?:MASVS|OWASP)[^)]*\)/g, '')).trim())}</a>` : ''; }).filter(Boolean).join(' · ')}` : ''}</p>`;

  function module(id) {
    const i = L.modules.findIndex(m => m.id === id), m = L.modules[i];
    if (!m) return home();
    document.title = `Learn: ${m.title}`;
    if (mem.at !== id) { mem.order = {}; mem.match = {}; mem.wrong = new Set(); mem.at = id; }
    const s = mstate(m), qs = questions(m), d = data(), prev = L.modules[i - 1], next = L.modules[i + 1];
    let tn = 0, qn = 0;
    return `<article class="lesson">
      <p class="crumb"><a href="#/">Home</a> › <a href="#/learn">Learn Lab</a> › Module ${i + 1}</p>
      <header class="lhero"><div><p class="kicker">Module ${i + 1} of ${L.modules.length}</p><h1>${esc(m.title)}</h1><p class="story">${esc(m.blurb)}</p></div>${ring(s.done + (s.note ? 1 : 0), s.total + 1, 'lring')}</header>
      ${s.complete ? `<div class="modbanner" role="status">${icon('trophy')}<span><b>Module complete.</b> You can explain this without the AI. ${next ? `<a href="#/learn/${next.id}">Next: ${esc(next.title)} →</a>` : ''}</span></div>` : ''}
      ${chipsFor(m)}
      <h2 class="sec-title">Understand it <small>read these cards, they take about five minutes</small></h2>
      <ol class="lncards">${m.cards.map((c, k) => `<li class="lncard"><span class="cn" aria-hidden="true">${k + 1}</span><div><h3>${esc(c.h)}</h3><p>${esc(c.body)}</p>
        ${c.ex ? `<p class="lnex"><b>Example.</b> ${esc(c.ex)}</p>` : ''}
        ${c.terms ? `<dl class="lnterms">${c.terms.map(([t, x]) => `<div><dt>${esc(t)}</dt><dd>${esc(x)}</dd></div>`).join('')}</dl>` : ''}
        ${c.note ? `<p class="lnnote" role="note">${icon('flag')}<span>${esc(c.note)}</span></p>` : ''}</div></li>`).join('')}</ol>
      <h2 class="sec-title">Try it <small>small games. You can retry as often as you like.</small></h2>
      <ol class="lnqs-list">${qs.filter(q => q.kind === 'try').map(q => question(q, ++tn)).join('')}</ol>
      <h2 class="sec-title">Check yourself <small>${qs.filter(q => q.kind === 'quiz' && d.q[q.id]).length} of ${m.quiz.length} right</small></h2>
      <ol class="lnqs-list">${qs.filter(q => q.kind === 'quiz').map(q => question(q, ++qn)).join('')}</ol>
      <h2 class="sec-title">Check the AI <small>use this the next time you ask it about ${esc(m.title.toLowerCase())}</small></h2>
      <ul class="lnai">${m.ai.map(a => `<li>${esc(a)}</li>`).join('')}</ul>
      <h2 class="sec-title">Explain it back <small>${XP.note} XP. This is how you know you really understand it.</small></h2>
      <div class="lnexplain"><label class="flabel" for="ln-note">${esc(m.explain)}</label>
        <textarea id="ln-note" rows="4" maxlength="1200" data-ln-note="${m.id}" placeholder="Write it as if you were telling a friend. At least ${MIN_NOTE} letters.">${esc(d.notes[m.id] || '')}</textarea>
        <div class="evi-btns"><button type="button" class="btn" data-ln-save="${m.id}">Save my explanation</button><span class="ma-status" id="ln-status" role="status" aria-live="polite">${s.note ? 'Saved' : ''}</span></div></div>
      <nav class="pager" aria-label="Modules">${prev ? `<a href="#/learn/${prev.id}"><small>← Previous</small>${esc(prev.title)}</a>` : '<span></span>'}${next ? `<a href="#/learn/${next.id}"><small>Next →</small>${esc(next.title)}</a>` : '<a href="#/learn"><small>Finish line</small>Back to the Learn Lab</a>'}</nav>
    </article>`;
  }

  const page = id => (id ? module(id) : home());

  // small pieces used by other pages
  function forLevel(n) {
    const ms = L.modules.filter(m => m.levels.includes(n));
    if (!ms.length) return '';
    const o = overall();
    return `<div class="care learnnote" role="note">${icon('book')}<span><b>Learn the basics for this level:</b> ${ms.map(m => { const s = o.ms[L.modules.indexOf(m)]; return `<a href="#/learn/${m.id}">${esc(m.title)}</a>${s.complete ? ' ✓' : ''}`; }).join(' · ')}</span></div>`;
  }
  const summary = () => { const o = overall(); return { complete: o.complete, total: L.modules.length, rank: o.rank, xp: o.xp, max: o.max }; };

  // ---------- interactions ----------
  function refresh() {
    const y = scrollY, key = document.activeElement?.dataset?.lnChoice || document.activeElement?.dataset?.lnOrder;
    const id = mem.at, before = overall().complete;
    main.innerHTML = module(id);
    scrollTo({ top: y, behavior: 'instant' });
    if (overall().complete > before) toast(`Module complete! +${XP.module} XP`);
  }
  function correct(qid) {
    const d = data(); if (d.q[qid]) return;
    d.q[qid] = true; save(d); Game.noteActivity?.();
    const before = overall(); toast(`Right! +${XP.q} XP`); void before;
  }

  function init() {
    main.addEventListener('click', e => {
      const t = e.target;
      const c = t.closest('[data-ln-choice]');
      if (c) { const q = findQ(c.dataset.lnChoice); if (+c.dataset.i === q.answer) correct(q.id); else { mem.wrong.add(q.id + ':' + c.dataset.i); mem.wrong.add('hint:' + q.id); } return refresh(); }
      const o = t.closest('[data-ln-order]');
      if (o) {
        const q = findQ(o.dataset.lnOrder), pick = (mem.order[q.id] ||= []); pick.push(+o.dataset.i);
        if (pick.length === q.items.length) { if (pick.every((v, k) => v === k)) correct(q.id); else { mem.wrong.add('hint:' + q.id); mem.order[q.id] = []; } }
        return refresh();
      }
      const r = t.closest('[data-ln-reset]'); if (r) { mem.order[r.dataset.lnReset] = []; return refresh(); }
      const k = t.closest('[data-ln-check]');
      if (k) {
        const q = findQ(k.dataset.lnCheck), sel = mem.match[q.id] || {};
        mem.match[q.id + ':checked'] = true;
        if (q.pairs.every((p, i) => sel[i] === p[1])) correct(q.id); else mem.wrong.add('hint:' + q.id);
        return refresh();
      }
      const sv = t.closest('[data-ln-save]');
      if (sv) {
        const ta = document.getElementById('ln-note'), v = Fill.clean(ta.value, 1200), st = document.getElementById('ln-status');
        if (v.length < MIN_NOTE) { st.textContent = `Write a little more (at least ${MIN_NOTE} letters).`; return; }
        const d = data(), had = (d.notes[sv.dataset.lnSave] || '').trim().length >= MIN_NOTE; d.notes[sv.dataset.lnSave] = v;
        if (!save(d)) { st.textContent = 'Could not save: the browser has no room left.'; return; }
        Game.noteActivity?.(); if (!had) toast(`Explanation saved. +${XP.note} XP`);
        return refresh();
      }
    });
    main.addEventListener('change', e => {
      const s = e.target.closest('[data-ln-match]');
      if (!s) return;
      const sel = (mem.match[s.dataset.lnMatch] ||= {}); sel[+s.dataset.i] = s.value; delete mem.match[s.dataset.lnMatch + ':checked'];
    });
  }
  const findQ = qid => questions(L.modules.find(m => m.id === qid.split(':')[0])).find(q => q.id === qid);

  return { page, init, forLevel, summary };
})();
