// myapp.js: "My app sheets". The book's printed Print Pack sheets, typed in the app instead of on paper:
//   App info sheet (P.1)  ·  Decisions log (P.2)  ·  Cost table (3.5, with the four checks the book asks for).
// Saved in this browser per app (profile, decisions, costs), included in the backup file, and printable.
// Nothing here ticks a proof box for you: the checks only tell you what is still missing.
const MyApp = (() => {
  const G = window.GAME;
  const LIM = { promise: 300, users: 300, must: 800, notnow: 1000, talks: 1500, budget: 14, currency: 4, accounts: 600, expert: 400 };
  const TABS = [['', 'App info sheet'], ['decisions', 'Decisions log'], ['costs', 'Cost table']];
  const GROWS = ['No', 'Yes', 'Yes, very fast', 'Not sure'];
  let tab = '';

  const profile = () => store.get('profile:' + currentApp, {});
  const putProfile = patch => { const p = { ...profile(), ...patch }; for (const k of Object.keys(p)) if (!p[k]) delete p[k]; return store.set('profile:' + currentApp, p); };
  const decisions = () => store.get('decisions:' + currentApp, []);
  const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const clean = (s, n) => Fill.clean(s, n);
  const cur = () => (profile().currency ?? '₹');

  // money: typed text -> whole minor units (paise/cents), so adding never gives 0.1 + 0.2 style errors
  const toMinor = s => { const t = String(s ?? '').replace(/[^0-9.\-]/g, ''); if (!t || t === '-' || t === '.') return null; const n = Math.round(parseFloat(t) * 100); return Number.isFinite(n) ? n : null; };
  const money = n => `${cur()}${(n / 100).toLocaleString(undefined, { minimumFractionDigits: n % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;
  const goodLink = s => /^https?:\/\/\S+\.\S+/i.test(String(s || '').trim());

  // ----- cost table data -----
  function costs() {
    let c = store.get('costs:' + currentApp, null);
    if (!c) { // first visit: the book's own list of common costs, with no numbers on purpose
      c = { rows: G.costItems.map(i => ({ id: uid(), item: i.item, note: i.note, link: '', grows: i.grows || '', once: '', m100: '', m1k: '', m10k: '', checked: '' })) };
      store.set('costs:' + currentApp, c);
    }
    return c;
  }
  const saveCosts = c => store.set('costs:' + currentApp, c);
  function totals(c) {
    const t = { once: 0, m100: 0, m1k: 0, m10k: 0 };
    for (const r of c.rows) for (const k of Object.keys(t)) t[k] += toMinor(r[k]) || 0;
    return t;
  }
  // the four checks from section 3.5. They only report; you tick the real boxes yourself.
  function bookChecks(c) {
    const p = profile(), rows = c.rows, withMoney = rows.filter(r => ['once', 'm100', 'm1k', 'm10k'].some(k => toMinor(r[k]) !== null));
    const budget = toMinor(p.budget);
    return [
      { ok: withMoney.length > 0 && withMoney.every(r => goodLink(r.link)), text: 'Every cost has a link to an official price page', todo: withMoney.length ? `${withMoney.filter(r => !goodLink(r.link)).length} still need a link` : 'add your costs first' },
      { ok: rows.length > 0 && rows.every(r => r.grows), text: 'Costs that grow with users are clearly marked', todo: `${rows.filter(r => !r.grows).length} rows still need an answer` },
      { ok: rows.length > 0 && rows.every(r => toMinor(r.m1k) !== null), text: 'I know my monthly cost at 1,000 users', todo: `${rows.filter(r => toMinor(r.m1k) === null).length} rows have no number (type 0 if it costs nothing)` },
      { ok: budget !== null && budget > 0, text: 'I set a monthly budget limit and wrote it on the App info sheet', todo: 'set it on the App info sheet or below' },
    ];
  }

  // ----- pieces of html -----
  const tabs = () => `<nav class="matabs ma-noprint" aria-label="My app sheets">${TABS.map(([id, name]) => `<a class="chip" href="#/myapp${id ? '/' + id : ''}"${tab === id ? ' aria-current="page" aria-pressed="true"' : ''}>${esc(name)}${id === 'decisions' && decisions().length ? ` (${decisions().length})` : ''}</a>`).join('')}</nav>`;
  const tools = (copyId) => `<div class="matools ma-noprint"><button type="button" class="mini-btn" data-ma-copy="${copyId}">Copy as text</button><button type="button" class="mini-btn" onclick="window.print()">Print or save as PDF</button><span id="ma-status" class="ma-status" role="status" aria-live="polite"></span></div>`;
  const field = (id, label, hint, rows, extra = '') => {
    const v = profile()[id] || '';
    return `<div class="mafield"><label class="flabel" for="m-${id}">${esc(label)} ${extra}</label>
      ${rows === 1 ? `<input id="m-${id}" type="text" data-ma-field="${id}" maxlength="${LIM[id]}" value="${esc(v)}" aria-describedby="mh-${id}" autocomplete="off">`
        : `<textarea id="m-${id}" rows="${rows}" data-ma-field="${id}" maxlength="${LIM[id]}" aria-describedby="mh-${id}">${esc(v)}</textarea>`}
      <p class="fnote" id="mh-${id}">${hint}</p><p class="ferr" id="me-${id}" role="alert" hidden></p></div>`;
  };

  function sheet() {
    const p = profile(), rec = store.get('game:' + currentApp, {}), tps = (rec.types || []).map(id => G.appTypes.find(t => t.id === id)).filter(Boolean);
    const started = rec.started ? new Date(rec.started).toLocaleDateString() : '';
    const mustN = (p.must || '').split('\n').filter(l => l.trim()).length;
    const exp = tps.filter(t => !/^Usually not/.test(t.expert));
    return `<section class="masheet" aria-label="App info sheet">
      <p class="sheethead"><b>App:</b> ${esc(currentApp)} · <b>Started:</b> ${esc(started)}</p>
      ${field('promise', 'One-sentence promise', 'The book’s format: <b>For</b> [who], <b>it</b> [does what], <b>unlike</b> [what they use now].', 2)}
      ${field('users', 'Who the users are', 'Age, phone types, internet. Also used to fill your prompts.', 2)}
      <div class="mafield"><span class="flabel">App type(s)</span><p>${tps.length ? tps.map(t => `<span class="tchip">${esc(t.name)}</span>`).join(' ') : '<small>None ticked. You choose these when you start the game.</small>'}</p></div>
      ${field('must', 'MUST features for version 1', 'One per line. The book says 3 to 7. Level 2 helps you cut the list.', 5, `<small id="must-count" class="mc ${mustN && (mustN < 3 || mustN > 7) ? 'warn' : ''}">${mustN ? `${mustN} listed${mustN < 3 ? ', aim for at least 3' : mustN > 7 ? ', aim for 7 or fewer' : ''}` : ''}</small>`)}
      ${field('notnow', 'NOT in this version', 'One per line. Also used to fill your prompts.', 4)}
      ${field('talks', 'Notes from 5 real user talks', 'Who you spoke to and what they said, in their words if you can.', 5)}
      <div class="mafield maprice"><div><label class="flabel" for="m-currency">Currency</label><input id="m-currency" type="text" data-ma-field="currency" maxlength="${LIM.currency}" value="${esc(cur())}" style="max-width:6rem"></div>
        <div><label class="flabel" for="m-budget">Monthly budget limit</label><input id="m-budget" type="text" inputmode="decimal" data-ma-field="budget" maxlength="${LIM.budget}" value="${esc(p.budget || '')}" aria-describedby="mh-budget"></div>
        <p class="fnote" id="mh-budget">The most you are willing to spend each month. The cost table compares it with your cost at 1,000 users.</p><p class="ferr" id="me-budget" role="alert" hidden></p></div>
      ${field('accounts', 'Accounts', 'Play Console owner email, Supabase dev and prod project names, GitHub repo. <b>Names and emails only. Never write a password or key here</b> (section 8.4).', 3)}
      ${field('expert', 'Human expert needed?', `For money, health or children: who, and when.${exp.length ? ` Your app types say: ${exp.map(t => `${esc(t.name)}: ${esc(t.expert)}`).join(' ')}` : ''}`, 2)}
    </section>`;
  }

  function decisionsTab() {
    const list = decisions();
    return `<section aria-label="Decisions log">
      <p class="lede">Write every important decision, so a new chat with your AI cannot quietly undo it. The book says to copy this into <b>PROJECT_LOG.md</b>.</p>
      <form class="gform ma-noprint" data-ma-decision novalidate>
        <div class="mafield"><label class="flabel" for="dec-date">Date</label><input id="dec-date" name="date" type="date" value="${todayKey()}" style="max-width:12rem"></div>
        <div class="mafield"><label class="flabel" for="dec-what">Decision</label><input id="dec-what" name="decision" type="text" maxlength="200" placeholder="e.g. Sign in with phone number (OTP) only" autocomplete="off"><p class="ferr" id="dec-err" role="alert" hidden></p></div>
        <div class="mafield"><label class="flabel" for="dec-why">Why</label><textarea id="dec-why" name="why" rows="2" maxlength="300"></textarea></div>
        <div class="mafield"><label class="flabel" for="dec-rej">Options rejected</label><textarea id="dec-rej" name="rejected" rows="2" maxlength="300"></textarea></div>
        <div><button type="submit" class="btn">Add to the log</button></div>
      </form>
      ${tools('decisions')}
      ${list.length ? `<ol class="declist">${[...list].sort((a, b) => String(b.date).localeCompare(String(a.date)) || b.id.localeCompare(a.id)).map(d => `<li class="dec"><p class="dec-date">${esc(d.date)} <button type="button" class="linkbtn ma-noprint" data-ma-deldec="${d.id}" aria-label="Delete decision: ${esc(d.decision)}">Delete</button></p><p class="dec-what"><b>${esc(d.decision)}</b></p>${d.why ? `<p><small>Why</small> ${esc(d.why)}</p>` : ''}${d.rejected ? `<p><small>Rejected</small> ${esc(d.rejected)}</p>` : ''}</li>`).join('')}</ol>` : '<div class="empty"><p>No decisions yet. Your first one might be the name of the app, or how users sign in.</p></div>'}
    </section>`;
  }

  const rowHtml = r => `<li class="corow" data-row="${r.id}">
    <div class="co-top"><div class="mafield"><label class="flabel" for="c-${r.id}-item">Item</label><input id="c-${r.id}-item" type="text" data-f="item" maxlength="80" value="${esc(r.item)}"></div>
      <button type="button" class="linkbtn ma-noprint" data-ma-delrow="${r.id}" aria-label="Remove ${esc(r.item)}">Remove</button></div>
    ${r.note ? `<p class="co-note">From the book: ${esc(r.note)}</p>` : ''}
    <div class="co-money">${[['once', 'One-time'], ['m100', 'Monthly at 100 users'], ['m1k', 'Monthly at 1,000 users'], ['m10k', 'Monthly at 10,000 users']].map(([k, l]) => `<div class="mafield"><label class="flabel" for="c-${r.id}-${k}">${l}</label><input id="c-${r.id}-${k}" type="text" inputmode="decimal" data-f="${k}" maxlength="14" value="${esc(r[k])}"></div>`).join('')}</div>
    <div class="co-meta"><div class="mafield"><label class="flabel" for="c-${r.id}-grows">Grows with users?</label><select id="c-${r.id}-grows" data-f="grows"><option value="">Choose…</option>${GROWS.map(g => `<option${r.grows === g ? ' selected' : ''}>${g}</option>`).join('')}</select></div>
      <div class="mafield"><label class="flabel" for="c-${r.id}-link">Link to the official price page</label><input id="c-${r.id}-link" type="url" data-f="link" maxlength="300" placeholder="https://" value="${esc(r.link)}"></div></div>
    <label class="co-conf"><input type="checkbox" data-f="checked"${r.checked ? ' checked' : ''}> <span>I confirmed these numbers on the official page${r.checked ? ` <small>(on ${esc(r.checked)}. Prices change often: check again before launch.)</small>` : ''}</span></label>
    <p class="ferr" id="cerr-${r.id}" role="alert" hidden></p></li>`;

  function totalsHtml(c) {
    const t = totals(c), b = toMinor(profile().budget), checks = bookChecks(c);
    let msg = '';
    if (b > 0) msg = t.m1k > b ? `<p class="over" role="alert"><b>Over budget:</b> at 1,000 users you would spend ${money(t.m1k - b)} more each month than your limit of ${money(b)}.</p>` : `<p class="under"><b>Within budget:</b> at 1,000 users you keep ${money(b - t.m1k)} of your ${money(b)} monthly limit.</p>`;
    return `<div id="ma-totals"><div class="cototals"><div><small>One-time</small><b>${money(t.once)}</b></div><div><small>Monthly at 100</small><b>${money(t.m100)}</b></div><div><small>Monthly at 1,000</small><b>${money(t.m1k)}</b></div><div><small>Monthly at 10,000</small><b>${money(t.m10k)}</b></div></div>${msg}
      <h3>The book’s four checks <small>(section 3.5). Tick the real boxes in Level 2 when you are sure.</small></h3>
      <ul class="bookchecks">${checks.map(k => `<li class="${k.ok ? 'ok' : ''}"><span aria-hidden="true">${k.ok ? icon('check') : '·'}</span><span>${esc(k.text)}${k.ok ? '' : ` <small>(${esc(k.todo)})</small>`}</span></li>`).join('')}</ul></div>`;
  }

  function costsTab() {
    const c = costs();
    return `<section aria-label="Cost table">
      <p class="lede">What the app costs to build and to run each month. The book gives no prices on purpose, because they change: type what the <b>official price page</b> says today, and link to it. Amounts are in ${esc(cur())}; change the currency on the App info sheet.</p>
      <div class="mafield maprice ma-noprint"><div><label class="flabel" for="m-budget2">Monthly budget limit</label><input id="m-budget2" type="text" inputmode="decimal" data-ma-field="budget" maxlength="${LIM.budget}" value="${esc(profile().budget || '')}"></div></div>
      ${tools('costs')}
      <ol class="colist">${c.rows.map(rowHtml).join('')}</ol>
      <p class="ma-noprint"><button type="button" class="btn ghost" data-ma-addrow>+ Add another cost</button></p>
      ${totalsHtml(c)}</section>`;
  }

  function page(which) {
    tab = TABS.some(([id]) => id === which) ? which : '';
    document.title = 'My app sheets';
    if (!currentApp || !store.get('game:' + currentApp)) return '<div class="wide"><h1>My app sheets</h1><p class="lede">Start your quest first. Then you can fill in your App info sheet, decisions log and cost table here.</p><a class="btn" href="#/new">Start the game</a></div>';
    return `<div class="wide myapp"><p class="crumb ma-noprint"><a href="#/">Home</a> › <a href="#/play">Quest</a> › My app sheets</p>
      <h1>${esc(currentApp)}: ${esc(TABS.find(([id]) => id === tab)[1])}</h1>
      ${tab === '' ? '<p class="lede">The book’s App info sheet, typed here instead of on paper. It saves as you go.</p>' : ''}
      ${tabs()}${tab === '' ? tools('sheet') + sheet() : tab === 'decisions' ? decisionsTab() : costsTab()}</div>`;
  }

  // ----- plain-text versions (to paste into your AI or PROJECT_LOG.md) -----
  function asText(which) {
    const p = profile();
    if (which === 'decisions') return ['## Decisions', ...decisions().sort((a, b) => String(a.date).localeCompare(String(b.date))).map(d => `- ${d.date}: ${d.decision}${d.why ? ` | Why: ${d.why}` : ''}${d.rejected ? ` | Options rejected: ${d.rejected}` : ''}`)].join('\n');
    if (which === 'costs') {
      const c = costs(), t = totals(c), n = s => (toMinor(s) === null ? '' : money(toMinor(s)));
      return ['## Cost table', `Currency: ${cur()}`, '', '| Item | One-time | Monthly at 100 | at 1,000 | at 10,000 | Grows with users? | Official price page | Confirmed |', '|---|---|---|---|---|---|---|---|',
        ...c.rows.map(r => `| ${r.item} | ${n(r.once)} | ${n(r.m100)} | ${n(r.m1k)} | ${n(r.m10k)} | ${r.grows} | ${r.link} | ${r.checked || 'not confirmed'} |`),
        `| **Total** | ${money(t.once)} | ${money(t.m100)} | ${money(t.m1k)} | ${money(t.m10k)} | | | |`, p.budget ? `Monthly budget limit: ${money(toMinor(p.budget))}` : ''].filter(x => x !== '').join('\n');
    }
    const rec = store.get('game:' + currentApp, {}), tps = (rec.types || []).map(id => G.appTypes.find(t => t.id === id)?.name).filter(Boolean);
    const line = (l, v) => `${l}:\n${v || '(not filled in yet)'}\n`;
    return [`# App info sheet: ${currentApp}`, '', line('One-sentence promise', p.promise), line('Who the users are', p.users), line('App type(s)', tps.join(', ')), line('MUST features for version 1', p.must), line('NOT in this version', p.notnow), line('Notes from 5 real user talks', p.talks), line('Monthly budget limit', p.budget ? money(toMinor(p.budget)) : ''), line('Accounts', p.accounts), line('Human expert needed?', p.expert)].join('\n');
  }
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch {
      const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
      const ok = document.execCommand('copy'); ta.remove(); return ok;
    }
  }

  const say = m => { const el = document.getElementById('ma-status'); if (el) { el.textContent = m; clearTimeout(say.t); say.t = setTimeout(() => (el.textContent = ''), 2500); } };
  const secretLike = s => /(pass(word|wd)|secret|api[_ -]?key|token|service[_ -]?role)\s*[:=]/i.test(s) || /\b(sk|rk|pk)_(live|test)_[A-Za-z0-9]{8,}/.test(s) || /\beyJ[A-Za-z0-9_-]{20,}\./.test(s);

  function init() {
    main.addEventListener('change', e => {
      const t = e.target;
      if (t.dataset.maField) { // App info sheet field (and the budget box on the cost tab)
        const id = t.dataset.maField, err = document.getElementById('me-' + id);
        const v = clean(t.value, LIM[id]);
        const fail = m => { if (err) { err.textContent = m; err.hidden = false; } t.setAttribute('aria-invalid', 'true'); };
        if (err) err.hidden = true; t.removeAttribute('aria-invalid');
        if (id === 'accounts' && secretLike(v)) return fail('This looks like a password or key, so it was NOT saved. Remove it. Secrets never go here (section 8.4).');
        if (id === 'budget' && v && toMinor(v) === null) return fail('Type a number, like 5000.');
        if (id === 'budget' && v && toMinor(v) < 0) return fail('The budget cannot be negative.');
        if (putProfile({ [id]: v })) say('Saved'); else say('Could not save: the browser has no room left.');
        if (id === 'budget' || id === 'currency') { const tt = document.getElementById('ma-totals'); if (tt) tt.outerHTML = totalsHtml(costs()); }
        return;
      }
      const row = t.closest('[data-row]');
      if (row && t.dataset.f) { // cost table cell
        const c = costs(), r = c.rows.find(x => x.id === row.dataset.row), f = t.dataset.f, err = document.getElementById('cerr-' + r.id);
        let v = f === 'checked' ? (t.checked ? todayKey() : '') : clean(t.value, f === 'link' ? 300 : f === 'item' ? 80 : 14);
        err.hidden = true;
        if (['once', 'm100', 'm1k', 'm10k'].includes(f) && v && toMinor(v) === null) { err.textContent = 'Type a number, like 1200 (or 0).'; err.hidden = false; t.setAttribute('aria-invalid', 'true'); return; }
        if (f === 'link' && v && !goodLink(v)) { err.textContent = 'Paste the full web address, starting with https://'; err.hidden = false; t.setAttribute('aria-invalid', 'true'); return; }
        t.removeAttribute('aria-invalid');
        r[f] = v; saveCosts(c); say('Saved');
        if (f === 'checked') { row.querySelector('.co-conf span').innerHTML = `I confirmed these numbers on the official page${v ? ` <small>(on ${esc(v)}. Prices change often: check again before launch.)</small>` : ''}`; }
        document.getElementById('ma-totals').outerHTML = totalsHtml(c);
      }
    });
    main.addEventListener('input', e => { // live count of MUST features
      if (e.target.dataset?.maField !== 'must') return;
      const n = e.target.value.split('\n').filter(l => l.trim()).length, el = document.getElementById('must-count');
      el.textContent = n ? `${n} listed${n < 3 ? ', aim for at least 3' : n > 7 ? ', aim for 7 or fewer' : ''}` : '';
      el.classList.toggle('warn', !!n && (n < 3 || n > 7));
    });
    main.addEventListener('submit', e => {
      const f = e.target.closest('[data-ma-decision]');
      if (!f) return;
      e.preventDefault();
      const d = clean(f.decision.value, 200), err = document.getElementById('dec-err');
      if (!d) { err.textContent = 'Write the decision first.'; err.hidden = false; f.decision.focus(); return; }
      const list = decisions();
      if (list.length >= 200) { err.textContent = 'The log is full (200 decisions). Copy it into PROJECT_LOG.md and delete old ones.'; err.hidden = false; return; }
      list.push({ id: uid(), date: /^\d{4}-\d{2}-\d{2}$/.test(f.date.value) ? f.date.value : todayKey(), decision: d, why: clean(f.why.value, 300), rejected: clean(f.rejected.value, 300) });
      store.set('decisions:' + currentApp, list);
      main.innerHTML = page('decisions'); document.getElementById('dec-what').focus(); toast('Decision added to the log.');
    });
    main.addEventListener('click', async e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.maCopy) { const ok = await copyText(asText(b.dataset.maCopy)); say(ok ? 'Copied. Paste it into your AI or into PROJECT_LOG.md.' : 'Could not copy. Use Print instead.'); }
      else if (b.dataset.maDeldec) { if (!confirm('Delete this decision from the log?')) return; store.set('decisions:' + currentApp, decisions().filter(d => d.id !== b.dataset.maDeldec)); main.innerHTML = page('decisions'); }
      else if (b.dataset.maAddrow !== undefined) { const c = costs(); if (c.rows.length >= 40) return toast('That is plenty of rows (40).'); c.rows.push({ id: uid(), item: '', note: '', link: '', grows: '', once: '', m100: '', m1k: '', m10k: '', checked: '' }); saveCosts(c); main.innerHTML = page('costs'); document.querySelector('.corow:last-child [data-f="item"]')?.focus(); }
      else if (b.dataset.maDelrow) { if (!confirm('Remove this cost row?')) return; const c = costs(); c.rows = c.rows.filter(r => r.id !== b.dataset.maDelrow); saveCosts(c); main.innerHTML = page('costs'); }
    });
  }

  return { page, init };
})();
