// search-index.js: the index. Two things, both built once from the content already in the app:
//  1. entries(): every page that is not a Handbook section (Learn Lab modules, help desk problems, facts that change,
//     bonus quests, quest levels, and the tool pages) in the same shape as a Handbook section, so ONE search box finds everything.
//  2. page(): an A to Z index of every topic, so you can browse instead of search.
// Nothing is stored: the index is rebuilt from learn-data.js, game-data.js and data.js each time the app opens.
const SearchIndex = (() => {
  const G = window.GAME;
  let cache = null, filter = '', type = '';

  // one search entry, shaped like {c, s, title, chTitle, text, raw} that search() already understands, plus an href
  const mk = (label, sub, title, raw, href, hasPrompt) => ({
    c: { id: 'X:' + label, label, title: sub, pdf: null },
    s: { id: href, title, page: 0, blocks: hasPrompt ? [{ t: 'prompt' }] : [] },
    title: title.toLowerCase(), chTitle: `${label} ${sub}`.toLowerCase(), raw, text: raw.toLowerCase(), href, type: label,
  });
  const secTitle = e => byId[typeof e === 'string' ? e : e.id]?.s.title || '';

  const TOOLS = [
    ['Quest map and progress', '#/play', 'journey map levels xp rank badges streak progress next small step today'],
    ['Start a new app (new game)', '#/new', 'new game name your app start quest app type'],
    ['My app details: fill in your prompts', '#/details', 'idea users company features blanks fill prompt IDEA LIST'],
    ['My app sheets: App info sheet', '#/myapp', 'app info sheet promise users must features budget accounts expert print pack'],
    ['My app sheets: Decisions log', '#/myapp/decisions', 'decisions log why options rejected PROJECT_LOG diary'],
    ['My app sheets: Cost table', '#/myapp/costs', 'cost table budget price monthly users 1000 official price page spending'],
    ['Check my project folder', '#/check', 'check folder files missing CLAUDE.md DATA_MAP gitignore env secrets keystore'],
    ['My proof: notes and pictures', '#/proof', 'proof evidence notes pictures screenshots print expert'],
    ['Prompt library: every prompt', '#/prompts', 'prompts copy library filter tell the AI'],
    ['Back up and restore my progress', '#/play', 'backup restore save progress file lose data json settings sliders'],
    ['Learn Lab home', '#/learn', 'learn lab modules lessons quiz study understand'],
    ['Something broke? Help desk', '#/help', 'help broke emergency hacked crash slow bill'],
    ['Flashcards: glossary words', '#/cards', 'flashcards glossary words flip cards memorize spaced repetition'],
    ['Daily challenge', '#/daily', 'daily challenge question streak quiz today'],
    ['My progress: stats and charts', '#/stats', 'stats progress chart xp heatmap reading time streak best'],
    ['Feature board (Must, Should, Could, Won\'t)', '#/moscow', 'feature board moscow must should could wont prioritize version 1 scope'],
    ['Pick my stack', '#/stack', 'stack picker backend supabase firebase clerk sign-in recommend tools choose'],
    ['Scores and sharing: progress card', '#/scores', 'scores leaderboard share progress card png rank xp apps compare'],
    ['Export my app sheets as Markdown', '#/myapp', 'export markdown md notion obsidian PROJECT_LOG download'],
    ['A to Z index', '#/index', 'index browse alphabet topics'],
  ];

  function entries() {
    if (cache) return cache;
    const out = [];
    const n = window.LEARN.modules.length;
    window.LEARN.modules.forEach((m, i) => out.push(mk('Learn Lab', `Module ${i + 1} of ${n}`, m.title,
      [m.blurb, ...m.cards.flatMap(c => [c.h, c.body, c.ex || '', c.note || '', ...(c.terms || []).flat()]), ...m.ai, m.explain, ...m.quiz.map(q => q.q), ...m.try.map(q => q.q)].join(' '), '#/learn/' + m.id)));
    G.helpTopics.forEach(t => out.push(mk('Something broke?', `${t.steps.length} steps`, t.ask, [t.title, t.note || '', ...t.steps.map(st => byId[st.sec]?.s.title || '')].join(' '), '#/help/' + t.id)));
    Facts.all().forEach(f => out.push(mk('Facts that change', f.topic, f.title, [f.says, f.where].join(' '), '#/facts')));
    Object.entries(G.extras).forEach(([id, e]) => {
      const lv = G.levels.find(l => l.extras.includes(id));
      out.push(mk('Bonus quest', lv ? `Level ${lv.n}: ${lv.name}` : '', e.title, [e.why, e.prompt || '', ...e.proofs].join(' '), lv ? '#/level/' + lv.n : '#/play', !!e.prompt));
    });
    G.levels.forEach(l => out.push(mk('Quest level', l.stage, `Level ${l.n}: ${l.name}`, [l.story, l.stage, ...l.sections.map(secTitle), ...l.extras.map(x => G.extras[x]?.title || '')].join(' '), '#/level/' + l.n)));
    TOOLS.forEach(([title, href, kw]) => out.push(mk('Tool', '', title, `${title} ${kw}`, href)));
    return (cache = out);
  }

  // ---------- A to Z page ----------
  const clean = t => t.replace(/\s*\((?:MASVS|OWASP)[^)]*\)/g, '').trim();
  function items() {
    const list = [];
    for (const x of all) { // Handbook sections (skip the empty "Introduction" pages and the glossary, which is listed term by term)
      if (x.s.title === 'Introduction' || x.c.id === '21') continue;
      list.push({ title: clean(x.s.title), ref: secLabel(x.s).trim(), type: 'Handbook', sub: `${chLabel(x.c)}`, href: `#/s/${x.s.id}` });
    }
    for (const [term, def] of glossary) list.push({ title: term, type: 'Glossary', sub: def, href: glossLink(term) });
    for (const e of entries()) list.push({ title: e.s.title, type: e.type, sub: e.c.title, href: e.href });
    return list.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base', numeric: true }));
  }
  const letterOf = t => { const c = t.trim()[0]?.toUpperCase() || '#'; return /[A-Z]/.test(c) ? c : '#'; };

  function listHtml() {
    const f = filter.trim().toLowerCase();
    const shown = items().filter(i => (!type || i.type === type) && (!f || `${i.title} ${i.sub} ${i.type}`.toLowerCase().includes(f)));
    const groups = {};
    shown.forEach(i => (groups[letterOf(i.title)] ||= []).push(i));
    const letters = Object.keys(groups).sort((a, b) => (a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b)));
    return `<p class="count" aria-live="polite">${shown.length} topic${shown.length === 1 ? '' : 's'}</p>
      ${letters.length ? `<nav class="azbar" aria-label="Jump to a letter">${letters.map(l => `<button type="button" data-az-jump="${l}">${l}</button>`).join('')}</nav>` : ''}
      ${letters.map(l => `<section class="azgroup" id="az-${l === '#' ? 'num' : l}"><h2>${l}</h2><ul>${groups[l].map(i => `<li><a href="${esc(i.href)}"><span class="azt">${esc(i.title)}${i.ref ? ` <small>${esc(i.ref)}</small>` : ''}</span><span class="azy">${esc(i.type)}</span>${i.sub && i.type !== 'Glossary' ? `<span class="azs">${esc(i.sub)}</span>` : ''}${i.type === 'Glossary' ? `<span class="azs">${esc(i.sub)}</span>` : ''}</a></li>`).join('')}</ul></section>`).join('') || '<p class="empty">No topics match. Clear the filter.</p>'}`;
  }

  function page() {
    document.title = 'A to Z index';
    const types = [...new Set(items().map(i => i.type))];
    return `<div class="wide azpage"><p class="crumb"><a href="#/">Home</a> › A to Z index</p>
      <h1>A to Z index</h1>
      <p class="lede">Every topic in the app in one alphabetical list: Handbook sections, glossary words, Learn Lab modules, help problems, facts that change, bonus quests, quest levels and tools. The search box at the top searches all of them too.</p>
      <label class="filter"><span class="sr">Filter the index</span><input id="az-filter" type="search" value="${esc(filter)}" placeholder="Filter the index…" autocomplete="off"></label>
      <div class="try" role="group" aria-label="Filter by kind"><button type="button" class="chip" data-az-type="" aria-pressed="${!type}">All</button>${types.map(t => `<button type="button" class="chip" data-az-type="${esc(t)}" aria-pressed="${type === t}">${esc(t)}</button>`).join('')}</div>
      <div id="az-list">${listHtml()}</div></div>`;
  }

  function init() {
    main.addEventListener('input', e => { if (e.target.id !== 'az-filter') return; filter = e.target.value; document.getElementById('az-list').innerHTML = listHtml(); });
    main.addEventListener('click', e => {
      const t = e.target.closest('[data-az-type]');
      if (t) { type = t.dataset.azType; const y = scrollY; main.innerHTML = page(); scrollTo({ top: y, behavior: 'instant' }); return; }
      const j = e.target.closest('[data-az-jump]');
      if (j) document.getElementById('az-' + (j.dataset.azJump === '#' ? 'num' : j.dataset.azJump))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  return { entries, page, init, count: () => items().length };
})();
