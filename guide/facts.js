// facts.js: "Facts that change". Every "CHECK THE DATE" box in the book, in one list, with the day the book says it
// was read and the day YOU last checked. The page tells you which ones are due again, so you re-check them before launch.
// The facts are read straight from data.js. The short titles and the "cross-checked by this guide" notes are in game-data.js.
// Saved in this browser (not per app, because the real world is the same for every app): guide.facts and guide.factsDays.
const Facts = (() => {
  const G = window.GAME;
  const DAY = 864e5, CHOICES = [30, 60, 90, 180];
  let cache = null, topic = '';

  const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const parseBook = s => { const t = Date.parse(s + ' 12:00'); return Number.isNaN(t) ? null : new Date(t); }; // "22 Nov 2026"
  const parseKey = k => (/^\d{4}-\d{2}-\d{2}$/.test(k || '') ? new Date(k + 'T12:00:00') : null);
  const mine = () => store.get('facts', {});
  const days = () => (CHOICES.includes(store.get('factsDays', 90)) ? store.get('factsDays', 90) : 90);
  const ageDays = d => Math.floor((Date.now() - d.getTime()) / DAY);
  const fmtDate = d => d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

  // which level each section is played in (so a fact can say "matters in Level 8")
  function levelMap() {
    const m = {};
    G.levels.forEach(l => { l.sections.forEach(e => (m[typeof e === 'string' ? e : e.id] = l.n)); (l.intro || []).forEach(i => (m[i] = l.n)); });
    return m;
  }

  // read every "CHECK THE DATE" box from the book
  function all() {
    if (cache) return cache;
    const lv = levelMap(), out = [];
    for (const c of H.chapters) for (const s of c.sections) {
      let k = 0;
      s.blocks.forEach((b, i) => {
        if (b.t !== 'p' || !/^⏰\s*CHECK THE DATE\s*$/.test(b.text)) return;
        const paras = []; let joined = '';
        for (let j = i + 1; j < s.blocks.length && s.blocks[j].t === 'p' && !/^⏰/.test(s.blocks[j].text) && paras.length < 5; j++) {
          paras.push(s.blocks[j].text); joined = paras.join(' ');
          if (/Read on \d{1,2} [A-Za-z]+ \d{4}/.test(joined)) break;
          if (/Where to check:/.test(joined) && /[.)]$/.test(paras.at(-1))) break;
        }
        const key = `${s.id}#${k++}`, info = G.factInfo[key] || { title: key, topic: 'Other' };
        const read = joined.match(/Read on (\d{1,2} [A-Za-z]+ \d{4})/);
        const [says, rest = ''] = joined.split(/Where to check:/);
        out.push({
          key, sid: s.id, title: info.title, topic: info.topic, level: lv[s.id],
          says: says.trim(), where: rest.replace(/\s*Read on .*$/, '').replace(/(\w)-\s+(\w)/g, '$1-$2').trim(),
          bookDate: read ? parseBook(read[1]) : null, verified: G.verifiedFacts?.[key] || [],
        });
      });
    }
    return (cache = out);
  }

  // status of one fact: the date that counts is the later of your check and the book's reading date
  function status(f) {
    const my = parseKey(mine()[f.key]);
    const eff = [my, f.bookDate].filter(Boolean).sort((a, b) => b - a)[0] || null;
    if (!eff) return { s: 'due', label: 'No date yet. Check it now.', eff: null, mine: my };
    const a = ageDays(eff), who = my && eff === my ? 'you checked' : 'the book was read';
    return { s: a > days() ? 'due' : 'ok', label: `${a <= 0 ? 'today' : a === 1 ? '1 day ago' : a + ' days ago'} (${who} on ${fmtDate(eff)})`, eff, mine: my, age: a };
  }
  const dueFacts = () => all().filter(f => status(f).s === 'due');
  const dueCount = () => dueFacts().length;

  // --- small callouts used on the Quest page and on level pages ---
  function banner() {
    const n = dueCount();
    return n ? `<section class="factbanner" role="note"><span>${icon('flag')}<span><b>${n} fact${n > 1 ? 's' : ''} that change${n > 1 ? '' : 's'} ${n > 1 ? 'are' : 'is'} due for a re-check.</b> Prices and Google rules move. The book says to re-check them before every launch.</span></span><a class="btn" href="#/facts">Check them</a></section>` : '';
  }
  function levelNote(n) {
    const here = all().filter(f => f.level === n), due = here.filter(f => status(f).s === 'due');
    if (!here.length) return '';
    if (n === 13) { // Release: the book's "before every launch" moment
      const d = dueCount();
      return `<div class="care factnote" role="note">${icon('flag')}<span><b>Before you launch:</b> re-check every fact that changes. ${d ? `${d} ${d === 1 ? 'is' : 'are'} due now.` : 'None are due right now.'} <a href="#/facts">Open the list</a></span></div>`;
    }
    return due.length ? `<div class="care factnote" role="note">${icon('flag')}<span><b>${due.length} fact${due.length > 1 ? 's' : ''} in this level ${due.length > 1 ? 'need' : 'needs'} a re-check:</b> ${due.map(f => esc(f.title)).join('; ')}. <a href="#/facts">Open the list</a></span></div>` : '';
  }

  // --- the page ---
  function card(f) {
    const st = status(f), my = mine()[f.key] || '';
    return `<article class="fact ${st.s}" data-fact="${esc(f.key)}">
      <header><span class="fstate ${st.s}">${st.s === 'due' ? 'Re-check' : 'Up to date'}</span><span class="ftopic">${esc(f.topic)}</span>${f.level !== undefined ? `<a class="flevel" href="#/level/${f.level}">Level ${f.level}</a>` : ''}</header>
      <h3>${esc(f.title)}</h3>
      <p class="fsays">${esc(f.says)}</p>
      <p class="fwhere"><b>Where to check:</b> ${esc(f.where) || 'see the book'}</p>
      <p class="fage">${st.eff ? `Last checked ${esc(st.label)}.` : esc(st.label)}${f.bookDate || st.mine ? '' : ' The book gives no reading date for this one.'}</p>
      ${f.verified.length ? `<div class="fverified"><b>Cross-checked by this guide on ${esc(G.checked)}:</b><ul>${f.verified.map(v => `<li>${esc(v.note)} <a href="${esc(v.url)}" target="_blank" rel="noopener noreferrer">${esc(v.label)} ↗</a></li>`).join('')}</ul></div>` : ''}
      <div class="factact">
        <button type="button" class="btn" data-fact-today>I checked this today</button>
        <label class="fdate"><span>or I checked on</span><input type="date" data-fact-date value="${esc(my)}" max="${todayKey()}"></label>
        ${my ? '<button type="button" class="linkbtn" data-fact-forget>Forget my date</button>' : ''}
        <a class="linkbtn" href="#/s/${f.sid}">Read it in the book</a>
      </div></article>`;
  }

  function page() {
    document.title = 'Facts that change';
    const list = all(), n = days(), topics = [...new Set(list.map(f => f.topic))];
    const shown = list.filter(f => !topic || f.topic === topic).sort((a, b) => (status(a).s === 'due' ? 0 : 1) - (status(b).s === 'due' ? 0 : 1) || (a.level ?? 99) - (b.level ?? 99));
    const due = dueCount();
    return `<div class="wide factspage">
      <p class="crumb"><a href="#/">Home</a> › Facts that change</p>
      <h1>Facts that change</h1>
      <p class="lede">The book marks ${list.length} facts with “check the date”, because Google, Supabase and India’s law keep moving. Here they all are. Open the official page, check the fact, then press <b>I checked this today</b>. Re-check them all before every launch (Level 13).</p>
      <div class="factsum ${due ? 'due' : 'ok'}" role="status"><b>${due ? `${due} of ${list.length} due for a re-check` : `All ${list.length} are up to date`}</b>
        <label class="fdays">Remind me after <select id="fdays" aria-label="Days before a fact is due again">${CHOICES.map(c => `<option value="${c}"${c === n ? ' selected' : ''}>${c}</option>`).join('')}</select> days <small>(the book gives no number. 90 is this guide’s suggestion.)</small></label></div>
      <div class="try" role="group" aria-label="Filter by topic"><button type="button" class="chip" data-fact-topic="" aria-pressed="${!topic}">All</button>${topics.map(t => `<button type="button" class="chip" data-fact-topic="${esc(t)}" aria-pressed="${topic === t}">${esc(t)}</button>`).join('')}</div>
      <div class="factlist">${shown.map(card).join('')}</div>
      <p class="fnote">This page uses real web pages you open yourself. It does not look anything up for you, and it cannot know if a fact changed. Only you can check that.</p></div>`;
  }

  function init() {
    main.addEventListener('click', e => {
      const art = e.target.closest('[data-fact]');
      const t = e.target.closest('[data-fact-topic]');
      if (t) { topic = t.dataset.factTopic; main.innerHTML = page(); return; }
      if (!art) return;
      const key = art.dataset.fact, all_ = mine();
      if (e.target.closest('[data-fact-today]')) { all_[key] = todayKey(); }
      else if (e.target.closest('[data-fact-forget]')) { delete all_[key]; }
      else return;
      store.set('facts', all_); const y = scrollY; main.innerHTML = page(); scrollTo({ top: y, behavior: 'instant' }); Game.renderMini?.(); toast('Saved.');
    });
    main.addEventListener('change', e => {
      if (e.target.id === 'fdays') { store.set('factsDays', +e.target.value); const y = scrollY; main.innerHTML = page(); scrollTo({ top: y, behavior: 'instant' }); Game.renderMini?.(); return; }
      if (!e.target.matches('[data-fact-date]')) return;
      const key = e.target.closest('[data-fact]').dataset.fact, v = e.target.value, all_ = mine();
      if (!v) delete all_[key];
      else if (v > todayKey()) return toast('That date is in the future. Pick today or earlier.');
      else all_[key] = v;
      store.set('facts', all_); const y = scrollY; main.innerHTML = page(); scrollTo({ top: y, behavior: 'instant' }); Game.renderMini?.(); toast('Saved.');
    });
  }

  return { page, init, banner, levelNote, dueCount, all, status };
})();
