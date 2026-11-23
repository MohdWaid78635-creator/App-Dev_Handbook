// App Guide: reads window.HANDBOOK (made by build.mjs) and shows it.
const H = window.HANDBOOK;
const main = document.getElementById('main');
const q = document.getElementById('q');
const outline = document.getElementById('outline');

const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const terms = s => s.toLowerCase().split(/\s+/).filter(Boolean);
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// highlight only 3+ letter terms, so "lt"/"amp" can't break HTML entities
const mark = (html, ts) => (ts = ts.filter(t => t.length > 2)).length ? html.replace(new RegExp(`(${ts.map(reEsc).join('|')})(?![^<]*>)`, 'gi'), '<mark>$1</mark>') : html;

if (!H) {
  main.innerHTML = '<div class="empty"><h1>No handbook data yet</h1><p>Open a terminal in this folder and run <code>node build.mjs</code>, then reload this page.</p></div>';
  throw new Error('data.js missing');
}

// ---- small icon set (24px outline icons, drawn inline so the app works offline) ----
const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/>',
  route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h8a3 3 0 0 0 0-6H8a3 3 0 0 1 0-6h8"/>',
  terminal: '<path d="m4 17 6-5-6-5"/><path d="M12 19h8"/>',
  sliders: '<path d="M4 6h8M18 6h2M4 12h2M12 12h8M4 18h10M18 18h2"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="16" cy="18" r="2"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  flag: '<path d="M5 21V4m0 0h11l-2 4 2 4H5"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  flame: '<path d="M12 3c.6 3 3.6 4.6 3.6 8.4a3.6 3.6 0 0 1-7.2 0c0-1.6.8-2.8 1.8-3.6.1 1.6.8 2.4 1.6 2.4.6-2.2-.2-4.6.2-7.2z"/><path d="M8.5 15a3.6 3.6 0 0 0 7 0"/>',
  clip: '<path d="m20 11-8.5 8.5a5 5 0 0 1-7-7L13 4a3.3 3.3 0 0 1 4.7 4.7l-8.6 8.5a1.7 1.7 0 0 1-2.4-2.4L14 7.5"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17h.01"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  shield: '<path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z"/><path d="m9 12 2 2 4-4"/>',
  rocket: '<path d="M5 19c0-3 1-5 3-7l4-4c3-3 6-4 8-4 0 2-1 5-4 8l-4 4c-2 2-4 3-7 3z"/><circle cx="15" cy="9" r="1.5"/><path d="M5 19l-2 2M9 15l-3 0M9 15l0 3"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a2 2 0 0 0 2 4M16 6h3a2 2 0 0 1-2 4M12 13v4M9 20h6M10 17h4"/>',
};
const icon = n => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[n]}</svg>`;
document.querySelectorAll('[data-icon]').forEach(el => (el.innerHTML = icon(el.dataset.icon)));

// ---- saved settings, ticks and reading progress (all in this browser, localStorage) ----
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem('guide.' + k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('guide.' + k, JSON.stringify(v)); return true; } catch { return false; } },
};
let apps = store.get('apps', []);
let currentApp = apps.includes(store.get('current')) ? store.get('current') : apps[0] || ''; // '' = no game started yet
let tickSet = new Set();
const loadTicks = () => (tickSet = new Set(store.get('ticks:' + currentApp, [])));
// key = section + item text, so ticks survive a rebuild that reorders items
const tickKey = (sid, text) => sid + '|' + text;

function renderAppPicker() {
  const sel = document.getElementById('app');
  sel.innerHTML = apps.length ? apps.map(a => `<option${a === currentApp ? ' selected' : ''}>${esc(a)}</option>`).join('') : '<option value="">No app yet</option>';
  document.getElementById('app-del').disabled = !apps.length;
  store.set('apps', apps); store.set('current', currentApp);
}

// ---- reading comfort: text size and focus mode (paper look only) ----
const prefs = { size: 'm', focus: false, mode: 'auto', ...store.get('prefs', {}) };
delete prefs.theme; // old saved colour choice from an earlier version
function applyPrefs() {
  const root = document.documentElement;
  root.dataset.size = prefs.size;
  prefs.focus ? (root.dataset.focus = '1') : delete root.dataset.focus;
  const dark = prefs.mode === 'dark' || (prefs.mode === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  dark ? (root.dataset.theme = 'dark') : delete root.dataset.theme;
  document.querySelectorAll('.seg').forEach(seg => seg.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === prefs[seg.dataset.pref]))));
  document.getElementById('focus-mode').checked = prefs.focus;
  const mb = document.getElementById('menu');
  if (mb) {
    if (matchMedia('(max-width: 860px)').matches) mb.setAttribute('aria-label', 'Open chapter list');
    else { mb.setAttribute('aria-expanded', String(!prefs.focus)); mb.setAttribute('aria-label', prefs.focus ? 'Show chapter list' : 'Hide chapter list'); }
  }
  store.set('prefs', prefs);
}

matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => prefs.mode === 'auto' && applyPrefs());

// flat list of every section for search and lookups
const all = H.chapters.flatMap(c => c.sections.map(s => {
  const text = s.blocks.map(b => b.text || b.items.flat().join(' ')).join(' ');
  return { c, s, title: s.title.toLowerCase(), chTitle: c.title.toLowerCase(), text: text.toLowerCase(), raw: text };
}));
const byId = Object.fromEntries(all.map(x => [x.s.id, x]));
const chapterById = id => H.chapters.find(c => c.id === id);
const chLabel = c => c.label || (c.id === 'P' ? 'Print Pack' : `Chapter ${c.id}`);
const whereLine = x => [chLabel(x.c), x.c.title].filter(Boolean).join(' · ');
const hrefOf = (x, enc) => x.href || `#/s/${x.s.id}/${enc}`; // Handbook sections open in the reader with your words highlighted; other pages open directly
let searchAll = null;
const searchable = () => (searchAll ||= all.concat(SearchIndex.entries())); // the Handbook plus every other page, built once
const secLabel = s => /^\d+\.\d+$/.test(s.id) ? `${s.id} ` : ''; // only the book's own numbers, not split parts
const glossary = chapterById('21')?.sections[0].blocks.find(b => b.t === 'dl')?.items || [];
const pdfLink = (c, s) => `<a class="pdf" href="../${encodeURI(c.pdf)}#page=${s.page}" target="_blank" rel="noopener">Open page ${s.page} in the PDF ↗</a>`;

// ---- search: every query word becomes a group of alternatives (word, its root, everyday synonyms) ----
const STOP = new Set('a an the i my me we our you your to do does did how what why when where which is are was it its of in on at for and or can could should would with this that be by from got get getting has have had been am will just very really please there'.split(' '));
const SYN = window.SYNONYMS || {};
const stem = t => t.length > 4 ? t.replace(/(ies|es|s|ing|ed)$/, m => m === 'ies' ? 'y' : '') : t;
function queryGroups(query) {
  const words = terms(query);
  const kept = words.filter(t => !STOP.has(t));
  return (kept.length ? kept : words).map(t => ({
    word: t,
    own: [...new Set([t, stem(t)])],
    syn: (SYN[t] || SYN[stem(t)] || []).filter(s => s !== t && s !== stem(t)),
  }));
}
const allWords = groups => groups.flatMap(g => [...g.own, ...g.syn]);

function groupScore(x, g) {
  const one = a => (x.title.includes(a) ? 20 : 0) + (x.chTitle.includes(a) ? 5 : 0) + Math.min(x.text.split(a).length - 1, 10);
  return Math.max(0, ...g.own.map(one), ...g.syn.map(a => one(a) * 0.5)); // book's own word beats a synonym
}

// Sections matching every word. If none, the best partial matches (most words matched first).
function search(query) {
  const groups = queryGroups(query);
  if (!groups.length) return { hits: [], partial: false, groups };
  const scored = searchable().map(x => {
    const per = groups.map(g => groupScore(x, g));
    return { x, matched: per.filter(Boolean).length, score: per.reduce((a, b) => a + b, 0) };
  }).filter(r => r.matched);
  const full = scored.filter(r => r.matched === groups.length);
  const list = full.length ? full : scored;
  list.sort((a, b) => b.matched - a.matched || b.score - a.score);
  return { hits: list.slice(0, 40), partial: !full.length, groups };
}

// glossary words that answer the query directly (e.g. "rls", "what is idempotent")
function glossaryHits(groups) {
  const phrase = groups.map(g => g.word).join(' ');
  if (phrase.length < 2) return [];
  return glossary.map(([term, def]) => {
    const t = term.toLowerCase();
    const parts = t.split(/\s*[/(),]\s*/).map(p => p.trim()).filter(Boolean); // "rls (row level security)" -> ["rls", "row level security"]
    const rank = parts.includes(phrase) ? 3 : groups.some(g => g.own.some(w => parts.includes(w))) ? 2
      : (phrase.length > 3 && t.includes(phrase)) || groups.some(g => g.own.some(w => w.length > 2 && parts.some(p => p.startsWith(w + ' ')))) ? 1 : 0;
    return { term, def, rank };
  }).filter(g => g.rank).sort((a, b) => b.rank - a.rank).slice(0, 3);
}
const glossLink = term => `#/s/21/${encodeURIComponent(term.split(/\s*[(/]/)[0])}`;

function snippet(raw, ts) {
  const i = Math.max(0, ...ts.map(t => raw.toLowerCase().indexOf(t)).filter(i => i >= 0).slice(0, 1));
  const start = Math.max(0, i - 80);
  return (start ? '…' : '') + raw.slice(start, start + 220) + '…';
}

// ---- rendering blocks ----
function renderBlock(b, sid) {
  switch (b.t) {
    case 'h': return `<h3>${esc(b.text)}</h3>`;
    case 'label': return `<p class="label">${esc(b.text)}</p>`;
    case 'pre': return `<pre class="table">${esc(b.text)}</pre>`;
    case 'table': return `<div class="tblwrap"><table class="bt"><thead><tr>${b.head.map(h => `<th scope="col">${esc(h)}</th>`).join('')}${b.tick ? '<th scope="col">Tested?</th>' : ''}</tr></thead><tbody>${b.rows.map(r => { const k = tickKey(sid, 'Tested: ' + r[0]); return `<tr>${r.map((c, i) => `<td data-label="${esc(b.head[i])}">${esc(c)}</td>`).join('')}${b.tick ? `<td class="tc" data-label="Tested?"><input type="checkbox" data-key="${esc(k)}"${tickSet.has(k) ? ' checked' : ''} aria-label="I tested: ${esc(r[0])}"></td>` : ''}</tr>`; }).join('')}</tbody></table></div>`;
    case 'dl': return `<dl class="gloss">${b.items.map(([t, d]) => `<div><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join('')}</dl>`;
    case 'check': return `<ul class="check">${b.items.map(i => { const k = tickKey(sid, i); return `<li><label><input type="checkbox" data-key="${esc(k)}"${tickSet.has(k) ? ' checked' : ''}> <span>${esc(i)}</span></label>${Evidence.row(k, i, false)}</li>`; }).join('')}</ul>`;
    case 'prompt': return `<div class="prompt"><div class="prompt-head"><span>${icon('terminal')}${esc(b.title ? b.title[0] + b.title.slice(1).toLowerCase() : 'Tell the AI (copy exactly)')}</span><button type="button" class="copy">${icon('copy')}<b>Copy</b></button></div><pre>${Fill.html(b.text, sid, { stage: b.stage })}</pre>${Fill.hint(b.text, sid, { stage: b.stage })}</div>`;
    default: return `<p>${esc(b.text)}</p>`;
  }
}

// the book's labelled parts (what it is / why / what goes wrong / how you check) get a colour, so they are quick to scan
const labelClass = t => /^WHAT IT IS/.test(t) ? 'g-what' : /^WHY IT MATTERS/.test(t) ? 'g-why' : /^WHAT GOES WRONG/.test(t) ? 'g-wrong' : /^HOW YOU CHECK/.test(t) ? 'g-check' : '';
function renderBlocks(blocks, sid) {
  let out = '', open = false;
  const close = () => { if (open) { out += '</div>'; open = false; } };
  for (const b of blocks) {
    if (b.t === 'label') {
      close();
      const cls = labelClass(b.text);
      if (cls) { out += `<div class="grp ${cls}">`; open = true; }
    } else if (b.t === 'prompt' || b.t === 'h') close(); // prompts and sub-headings stand on their own
    out += renderBlock(b, sid);
  }
  close();
  return out;
}

const renderSection = (c, s) => `<details class="sec" id="s-${s.id}" data-sid="${s.id}" open>
  <summary><span class="chev">${icon('chevron')}</span><h2>${s.title === 'Introduction' ? '' : `<span>${esc(secLabel(s))}</span>`}${esc(s.title)}</h2></summary>
  <div class="sec-body">
    ${pdfLink(c, s)}
    ${renderBlocks(s.blocks, s.id)}
  </div>
</details>`;

// ---- reading progress: which chapters you finished ----
const seen = new Set(store.get('seen', []));
const toc = document.getElementById('toc-list');
function renderToc() {
  toc.innerHTML = H.chapters.map(c => `<li><a href="#/c/${c.id}" data-id="${c.id}"${seen.has(c.id) ? ' class="seen"' : ''}><span class="n">${esc(c.id)}</span><span>${esc(c.title)}${seen.has(c.id) ? '<span class="sr"> (read)</span>' : ''}</span></a></li>`).join('');
  markCurrentToc();
}
let page = '', curChapter = null;
function markCurrentToc() {
  toc.querySelectorAll('a').forEach(a => a.toggleAttribute('aria-current', page === 'c' && a.dataset.id === curChapter));
}
function markRead(id) {
  if (seen.has(id)) return;
  seen.add(id); store.set('seen', [...seen]); renderToc();
}

// ---- pages ----
function home() {
  document.title = 'App Guide';
  const last = store.get('last');
  const lastCh = last && chapterById(last.id);
  const gs = Game.summary();
  const nPrompts = all.reduce((n, x) => n + x.s.blocks.filter(b => b.t === 'prompt').length, 0);
  return `<div class="wide home">
    <section class="hero">
      <h1>What do you need help with?</h1>
      <p>Search your handbook in plain words, play the build quest level by level, or copy a ready-made prompt for your AI.</p>
      <div class="try" role="group" aria-label="Try a search">${['backups', 'access rules', 'OTP abuse', 'slow app', 'my app got hacked', 'undo a bad change', 'demand proof'].map(t => `<a class="chip" href="#/q/${encodeURIComponent(t)}">${esc(t)}</a>`).join('')}</div>
    </section>
    <div class="cards2">
      <a class="tile primary" href="${gs ? '#/play' : '#/new'}">
        ${gs ? `<div class="ring" style="--p:${Math.round(gs.o.xp / gs.o.max * 100)}"><span>${gs.o.doneLevels}/${gs.o.levels.length}</span></div>` : `<span class="logo" style="width:48px;height:48px;border-radius:14px;background:var(--surface);color:var(--accent-ink)" aria-hidden="true">${icon('rocket')}</span>`}
        <div><div class="big">${gs ? `Your quest: ${esc(currentApp)}` : 'Start your app quest'}</div><div class="sub">${gs ? (gs.cur ? `${esc(gs.o.rank)} · next is Level ${gs.cur.n}, ${esc(gs.cur.name)}` : 'Every level is done') : 'Name your app and play through 16 levels, from idea to launch'}</div></div>
      </a>
      <a class="tile" href="${lastCh ? `#/c/${lastCh.id}` : '#/c/0'}">
        <span class="logo" style="width:48px;height:48px;border-radius:14px" aria-hidden="true">${icon('book')}</span>
        <div><div class="big">${lastCh ? 'Continue reading' : 'Start with Chapter 0'}</div><div class="sub">${esc(lastCh ? `${chLabel(lastCh)}: ${lastCh.title}` : 'How to use this book')}</div></div>
      </a>
      <a class="tile" href="#/prompts">
        <span class="logo" style="width:48px;height:48px;border-radius:14px;background:var(--warm)" aria-hidden="true">${icon('terminal')}</span>
        <div><div class="big">Prompt library</div><div class="sub">${nPrompts} ready-to-copy instructions for your AI</div></div>
      </a>
    </div>
    <h2 class="sec-title">All chapters</h2>
    <div class="grid">${H.chapters.map(c => `<a class="card${seen.has(c.id) ? ' seen' : ''}" href="#/c/${c.id}"><span class="num">${seen.has(c.id) ? icon('check') : esc(c.id)}</span><span><span class="t">${esc(c.title)}</span><span class="meta">${c.sections.length} part${c.sections.length > 1 ? 's' : ''}${seen.has(c.id) ? ' · read' : ''}</span></span></a>`).join('')}</div>
    <p class="foot">Built from your PDFs on ${new Date(H.builtAt).toLocaleDateString()}. Facts marked CHECK THE DATE in the book change over time. Progress is saved in this browser.</p>
  </div>`;
}

function chapter(id, focusId, ts = []) {
  const c = chapterById(id);
  if (!c) return notFound();
  document.title = `${chLabel(c)}: ${c.title}`;
  curChapter = c.id; store.set('last', { id: c.id });
  const i = H.chapters.indexOf(c), prev = H.chapters[i - 1], next = H.chapters[i + 1];
  const many = c.sections.length > 1;
  const jump = s => `<a href="#/s/${s.id}" data-jump="${s.id}">${esc(secLabel(s) + s.title)}</a>`;
  const html = `<article>
    <p class="crumb"><a href="#/">Home</a> › ${chLabel(c)}</p>
    <h1>${esc(c.title)}</h1>
    <p class="readmeta">~${Math.max(1, Math.ceil(all.filter(x => x.c === c).reduce((n, x) => n + x.raw.split(/\s+/).length, 0) / 200))} min read</p>
    ${many ? `<div class="chapter-tools"><button type="button" class="chip" data-act="toggle-all">Collapse all sections</button></div>
    <nav class="inpage" aria-label="In this chapter"><strong>In this chapter</strong><ul>${c.sections.map(s => `<li>${jump(s)}</li>`).join('')}</ul></nav>` : ''}
    ${c.sections.map(s => renderSection(c, s)).join('')}
    <nav class="pager" aria-label="Previous and next chapter">${prev ? `<a href="#/c/${prev.id}"><small>← Previous</small>${esc(prev.title)}</a>` : '<span></span>'}${next ? `<a href="#/c/${next.id}"><small>Next →</small>${esc(next.title)}</a>` : ''}</nav>
  </article>`;
  main.innerHTML = mark(html, ts);
  outline.innerHTML = many ? `<p>On this page</p><ul>${c.sections.map(s => `<li>${jump(s)}</li>`).join('')}</ul>` : '';
  const target = focusId && document.getElementById('s-' + focusId);
  const firstHit = ts.length && (target || main).querySelector('mark');
  (firstHit || target || main).scrollIntoView({ block: firstHit ? 'center' : 'start', behavior: 'instant' });
  if (!focusId && !ts.length) window.scrollTo({ top: 0, behavior: 'instant' });
  return null;
}

let onlyPrompts = false;
function results(query) {
  const { hits: all40, partial, groups } = search(query);
  const hits = onlyPrompts ? all40.filter(({ x }) => x.s.blocks.some(b => b.t === 'prompt')) : all40;
  const ts = allWords(groups);
  const syns = [...new Set(groups.flatMap(g => g.syn))];
  const gl = glossaryHits(groups);
  document.title = `Search: ${query}`;
  const cards = gl.length ? `<div class="answers" aria-label="Glossary">${gl.map(g => `<a class="answer" href="${glossLink(g.term)}"><span class="where">Glossary: plain meaning</span><strong>${esc(g.term)}</strong><span>${esc(g.def)}</span></a>`).join('')}</div>` : '';
  if (!all40.length && !gl.length) return `<div class="empty"><h1>Nothing found for “${esc(query)}”</h1><p>Try a shorter or simpler word (for example “backup” instead of “backing up the database”), or browse the <a href="#/">chapters</a>. You can teach the search your own words in <code>synonyms.js</code>.</p></div>`;
  return `<div class="wide"><h1 class="rh">${hits.length}${hits.length === 40 ? '+' : ''} result${hits.length === 1 ? '' : 's'} for “${esc(query)}”</h1>
    ${syns.length ? `<p class="also">Also searched the book's words: ${syns.map(esc).join(', ')}</p>` : ''}
    ${cards}
    <div class="chapter-tools"><button type="button" class="chip" data-act="only-prompts" aria-pressed="${onlyPrompts}">Only parts with an AI prompt</button></div>
    ${partial && hits.length ? `<p class="also">No part matches every word, so these match some of them.</p>` : ''}
    <ol class="results">${hits.map(({ x }) => `<li><a href="${esc(hrefOf(x, encodeURIComponent(query)))}">
      <span class="where">${esc(whereLine(x))}</span>
      <span class="t">${mark(esc(secLabel(x.s) + x.s.title), ts)}</span>
      <span class="snip">${mark(esc(snippet(x.raw, ts)), ts)}</span>
      ${x.s.blocks.some(b => b.t === 'prompt') ? '<span class="badge">HAS AI PROMPT</span>' : ''}</a></li>`).join('') || '<li class="empty">No results with an AI prompt. Turn the filter off to see all.</li>'}</ol></div>`;
}

let promptCh = '';
function prompts(filter = '') {
  document.title = 'Prompt library';
  const ts = terms(filter);
  const everyPrompt = all.flatMap(x => x.s.blocks.filter(b => b.t === 'prompt').map(b => ({ x, b })));
  const chs = [...new Set(everyPrompt.map(p => p.x.c.id))];
  const list = everyPrompt.filter(({ x, b }) => (!promptCh || x.c.id === promptCh) && ts.every(t => (b.text + ' ' + x.s.title).toLowerCase().includes(t)));
  return `<div class="wide"><h1>Prompt library</h1>
    <p class="lede">Every ready-to-copy instruction in the book, in book order. Replace anything in [SQUARE BRACKETS], then paste it into your AI.</p>
    <label class="filter"><span class="sr">Filter prompts</span><input id="pf" type="search" value="${esc(filter)}" placeholder="Filter: test, database, release…"></label>
    <div class="try" role="group" aria-label="Filter by chapter"><button type="button" class="chip" data-pch="" aria-pressed="${!promptCh}">All</button>${chs.map(id => `<button type="button" class="chip" data-pch="${id}" aria-pressed="${promptCh === id}">${id === 'P' ? 'Print Pack' : 'Ch ' + id}</button>`).join('')}</div>
    <p class="count" aria-live="polite">${list.length} prompt${list.length === 1 ? '' : 's'}</p>
    <div style="max-width:var(--measure)">${list.map(({ x, b }) => `<div class="pitem"><a class="where" href="#/s/${x.s.id}">${chLabel(x.c)} › ${esc(secLabel(x.s) + x.s.title)}</a>${renderBlock(b, x.s.id)}</div>`).join('') || '<p class="empty">No prompts match. Clear the filter to see all.</p>'}</div></div>`;
}

// the 15 stages (each stage is a game level; the 'done means' proofs are the boss gate)
const J = window.JOURNEY;

const notFound = () => `<div class="empty"><h1>Page not found</h1><p><a href="#/">Go to the start</a></p></div>`;

// ---- routing ----
let rtCh = null, rtAt = 0;
function flushReadTime() {
  if (rtCh && !document.hidden) {
    const s = Math.min(1800, Math.round((Date.now() - rtAt) / 1000));
    if (s > 0) { const rt = store.get('readtime', {}); rt[rtCh] = (rt[rtCh] || 0) + s; store.set('readtime', rt); }
  }
  rtAt = Date.now();
}
addEventListener('visibilitychange', () => { if (document.hidden) { flushReadTime(); rtCh = null; } else { rtCh = curChapter; rtAt = Date.now(); } });
addEventListener('pagehide', () => { flushReadTime(); rtCh = null; });
function route() {
  flushReadTime();
  const [, kind = '', a = '', b = ''] = decodeURIComponent(location.hash).split('/');
  page = kind === 'c' || kind === 's' ? 'c' : kind || 'home';
  curChapter = null; outline.innerHTML = '';
  hideSugg(); closeDrawer();
  let html = null;
  if (kind === 'c') html = chapter(a);
  else if (kind === 's') { const x = byId[a]; html = x ? chapter(x.c.id, a, allWords(queryGroups(b))) : notFound(); if (x) q.value = b; }
  else if (kind === 'q') { q.value = a; html = results(a); }
  else if (kind === 'prompts') html = prompts(a);
  else if (kind === 'journey') { location.replace('#/play'); return; } // the old journey page is now the quest
  else if (kind === 'play') html = Game.play();
  else if (kind === 'new') html = Game.newGame();
  else if (kind === 'details') html = Fill.page();
  else if (kind === 'check') html = Check.page();
  else if (kind === 'proof') html = Evidence.page();
  else if (kind === 'myapp') html = MyApp.page(a);
  else if (kind === 'facts') html = Facts.page();
  else if (kind === 'help') html = Help.page(a);
  else if (kind === 'learn') html = Learn.page(a);
  else if (kind === 'index') html = SearchIndex.page();
  else if (kind === 'cards') html = Flashcards.page();
  else if (kind === 'daily') html = Daily.page();
  else if (kind === 'stats') html = Stats.page();
  else if (kind === 'moscow') html = Moscow.page();
  else if (kind === 'stack') html = StackPicker.page();
  else if (kind === 'scores') html = Scorecard.page();
  else if (kind === 'level') html = /^\d+$/.test(a) ? Game.level(+a) : notFound();
  else { q.value = ''; html = home(); }
  Game.resetWrong();
  if (html !== null) { main.innerHTML = html; window.scrollTo({ top: 0, behavior: 'instant' }); }
  Game.setSnap();
  Game.renderMini();
  main.removeAttribute('aria-busy'); // the loading skeleton is gone once a page is drawn
  markCurrentToc();
  rtCh = curChapter; rtAt = Date.now(); // start timing the chapter you just opened
  document.querySelectorAll('.topnav a').forEach(l => ((l.dataset.nav === kind || (l.dataset.nav === 'play' && (kind === 'level' || kind === 'new'))) ? l.setAttribute('aria-current', 'page') : l.removeAttribute('aria-current')));
  updateReading();
}

// reading bar, "on this page" highlight and "finished chapter" tracking
let ticking = false;
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; updateReading(); }); } }, { passive: true });
function updateReading() {
  const bar = document.getElementById('read-bar');
  const ring = document.getElementById('read-ring');
  ring.hidden = page !== 'c';
  if (page !== 'c') { bar.style.width = '0'; return; }
  const max = document.documentElement.scrollHeight - innerHeight;
  const pct = max > 0 ? Math.min(1, scrollY / max) : 1;
  bar.style.width = pct * 100 + '%';
  ring.style.setProperty('--p', Math.round(pct * 100)); ring.firstChild.textContent = Math.round(pct * 100) + '%';
  const secs = [...main.querySelectorAll('.sec')];
  let cur = secs[0];
  for (const s of secs) if (s.getBoundingClientRect().top <= 140) cur = s;
  outline.querySelectorAll('a').forEach(a => a.setAttribute('aria-current', String(!!cur && a.dataset.jump === cur.dataset.sid)));
  if (curChapter && pct >= 0.85) markRead(curChapter);
}

// ---- toast ----
const toastEl = document.getElementById('toast');
let toastTimer;
function toast(msg) {
  toastEl.textContent = msg; toastEl.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
}

// ---- live suggestions under the search box ----
const sugg = document.getElementById('sugg');
let suggIdx = -1;
function hideSugg() { sugg.hidden = true; q.setAttribute('aria-expanded', 'false'); q.removeAttribute('aria-activedescendant'); suggIdx = -1; }
function showSugg() {
  const v = q.value.trim();
  if (v.length < 2) return hideSugg();
  const { hits, groups } = search(v), gl = glossaryHits(groups), ts = allWords(groups), enc = encodeURIComponent(v);
  const rows = [];
  if (gl[0]) rows.push(`<a class="sg gl" role="option" href="${glossLink(gl[0].term)}"><span class="tag">Plain meaning</span><b>${esc(gl[0].term)}</b><small>${esc(gl[0].def)}</small></a>`);
  hits.slice(0, 5).forEach(({ x }) => rows.push(`<a class="sg" role="option" href="${esc(hrefOf(x, enc))}"><b>${mark(esc(secLabel(x.s) + x.s.title), ts)}</b><small>${esc(whereLine(x))}</small></a>`));
  sugg.innerHTML = rows.length
    ? rows.join('') + `<a class="sg" role="option" href="#/q/${enc}"><b>See all results for “${esc(v)}”</b><small>Press Enter</small></a>`
    : '<div class="sg-foot">Nothing yet. Try a simpler word, like “backup” or “login”.</div>';
  sugg.querySelectorAll('[role=option]').forEach((el, i) => (el.id = 'sg-' + i));
  sugg.hidden = false; q.setAttribute('aria-expanded', 'true'); suggIdx = -1;
}
function moveSugg(d) {
  const items = [...sugg.querySelectorAll('[role=option]')];
  if (!items.length) return;
  items.forEach(el => el.removeAttribute('aria-selected'));
  suggIdx = (suggIdx + d + items.length) % items.length;
  items[suggIdx].setAttribute('aria-selected', 'true');
  items[suggIdx].scrollIntoView({ block: 'nearest' });
  q.setAttribute('aria-activedescendant', items[suggIdx].id);
}
let timer;
q.addEventListener('input', () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    const v = q.value.trim();
    if (page === 'q') { history.replaceState(null, '', v ? `#/q/${encodeURIComponent(v)}` : '#/'); route(); } // already on results: update them live
    else showSugg();
  }, 150);
});
q.addEventListener('focus', () => { if (q.value.trim().length > 1 && page !== 'q') showSugg(); });
q.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown') { e.preventDefault(); if (sugg.hidden) showSugg(); moveSugg(1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); moveSugg(-1); }
  else if (e.key === 'Enter') {
    e.preventDefault();
    const sel = sugg.querySelector('[aria-selected="true"]');
    if (sel) location.hash = sel.getAttribute('href');
    else if (q.value.trim()) location.hash = `#/q/${encodeURIComponent(q.value.trim())}`;
  }
});
sugg.addEventListener('mousedown', e => e.preventDefault()); // keep focus in the box while clicking a suggestion

// ---- drawer (chapter list on phones) and settings panel ----
const side = document.getElementById('side'), menuBtn = document.getElementById('menu'), backdrop = document.getElementById('backdrop');
function closeDrawer() { side.classList.remove('open'); backdrop.hidden = true; if (isPhone()) menuBtn.setAttribute('aria-expanded', 'false'); }
const isPhone = () => matchMedia('(max-width: 860px)').matches;
menuBtn.addEventListener('click', () => {
  if (!isPhone()) { prefs.focus = !prefs.focus; applyPrefs(); return; } // computer: show or hide the chapter list
  const o = !side.classList.contains('open'); side.classList.toggle('open', o); backdrop.hidden = !o; menuBtn.setAttribute('aria-expanded', String(o)); // phone: slide-in list
});
backdrop.addEventListener('click', closeDrawer);
const setBtn = document.getElementById('set-btn'), setPanel = document.getElementById('settings');
const closeSettings = () => { setPanel.hidden = true; setBtn.setAttribute('aria-expanded', 'false'); };
setBtn.addEventListener('click', () => { setPanel.hidden = !setPanel.hidden; setBtn.setAttribute('aria-expanded', String(!setPanel.hidden)); });
setPanel.addEventListener('click', e => {
  const b = e.target.closest('.seg button');
  if (!b) return;
  prefs[b.closest('.seg').dataset.pref] = b.dataset.v; applyPrefs();
});
document.getElementById('focus-mode').addEventListener('change', e => { prefs.focus = e.target.checked; applyPrefs(); });
document.addEventListener('click', e => {
  if (!e.target.closest('.settings-wrap')) closeSettings();
  if (!e.target.closest('.searchbox')) hideSugg();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { hideSugg(); closeSettings(); closeDrawer(); }
  const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  if ((e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) { e.preventDefault(); q.focus(); q.select(); }
});

// ---- clicks inside the page ----
main.addEventListener('input', e => {
  if (e.target.id !== 'pf') return;
  const v = e.target.value, pos = e.target.selectionStart;
  history.replaceState(null, '', `#/prompts/${encodeURIComponent(v)}`);
  main.innerHTML = prompts(v);
  const pf = document.getElementById('pf'); pf.focus(); pf.setSelectionRange(pos, pos);
});

// jump within a chapter without redrawing it (also opens the section if it was collapsed)
document.addEventListener('click', e => {
  const j = e.target.closest('[data-jump]');
  const sec = j && document.getElementById('s-' + j.dataset.jump);
  if (!sec) return;
  e.preventDefault(); sec.open = true; sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

main.addEventListener('click', async e => {
  const act = e.target.closest('[data-act]')?.dataset.act;
  if (act === 'toggle-all') {
    const secs = [...main.querySelectorAll('details.sec')], anyOpen = secs.some(s => s.open);
    secs.forEach(s => (s.open = !anyOpen));
    e.target.closest('button').textContent = anyOpen ? 'Expand all sections' : 'Collapse all sections';
    return;
  }
  if (act === 'only-prompts') { onlyPrompts = !onlyPrompts; main.innerHTML = results(decodeURIComponent(location.hash.split('/')[2] || '')); return; }
  const pch = e.target.closest('[data-pch]');
  if (pch) { promptCh = pch.dataset.pch; main.innerHTML = prompts(document.getElementById('pf')?.value || ''); return; }

  // copy buttons (the clipboard API is blocked on some file:// setups, so fall back to select + copy)
  const btn = e.target.closest('.copy');
  if (!btn) return;
  const pre = btn.closest('.prompt').querySelector('pre');
  let ok = false;
  try { await navigator.clipboard.writeText(pre.innerText); ok = true; }
  catch {
    const r = document.createRange(); r.selectNodeContents(pre);
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
    ok = document.execCommand('copy');
  }
  const label = btn.querySelector('b');
  label.textContent = ok ? 'Copied' : 'Press Ctrl+C';
  btn.classList.toggle('done', ok);
  if (ok) { Game.onCopy(); Game.noteActivity(); }
  const blanks = [...btn.closest('.prompt').querySelectorAll('.ph.off')].map(m => m.textContent);
  toast(!ok ? 'Text selected. Press Ctrl+C to copy.' : blanks.length ? `Copied. Before you send it, replace: ${[...new Set(blanks)].join(', ')}` : 'Copied. Now paste it into your AI.');
  setTimeout(() => { label.textContent = 'Copy'; btn.classList.remove('done'); }, 2000);
});

// save a tick for the current app
main.addEventListener('change', e => {
  const k = e.target.dataset?.key;
  if (!k) return;
  e.target.checked ? (tickSet.add(k), Game.noteActivity()) : tickSet.delete(k);
  if (!store.set('ticks:' + currentApp, [...tickSet])) alert('Could not save this tick: your browser is blocking saved data for this page.');
  if (page === 'play' || page === 'level') Game.refresh(); else Game.renderMini(); // redraw progress, keep scroll position and focus
});
// ---- app picker ----
const rerender = () => { loadTicks(); renderAppPicker(); route(); };
document.getElementById('app').addEventListener('change', e => { currentApp = e.target.value; rerender(); });
document.getElementById('app-new').addEventListener('click', () => { location.hash = '#/new'; closeDrawer(); });
document.getElementById('app-del').addEventListener('click', () => {
  if (!currentApp) return;
  if (!confirm(`Delete the quest for “${currentApp}”, with all its ticks, points and quiz answers?
This cannot be undone.`)) return;
  ['ticks:', 'game:', 'quiz:', 'copies:', 'dates:', 'profile:', 'days:', 'proof:', 'decisions:', 'costs:', 'xplog:', 'moscow:', 'stack:'].forEach(k => localStorage.removeItem('guide.' + k + currentApp));
  Object.keys(localStorage).filter(k => k.startsWith('guide.img:' + currentApp + ':')).forEach(k => localStorage.removeItem(k)); // pictures saved with proofs
  apps = apps.filter(a => a !== currentApp);
  currentApp = apps[0] || '';
  rerender();
});

// called from index.html after game.js has loaded
function boot() {
  addEventListener('hashchange', route);
  Game.init();
  Backup.init();
  Fill.init();
  Check.init();
  Evidence.init();
  MyApp.init();
  Facts.init();
  Learn.init();
  Flashcards.init();
  Daily.init();
  Stats.init();
  Moscow.init();
  Boss.init();
  Scorecard.init();
  StackPicker.init();
  SearchIndex.init();
  applyPrefs(); loadTicks(); renderAppPicker(); renderToc();
  route();
}
