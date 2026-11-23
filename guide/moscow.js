// moscow.js: feature board. Sort your ideas into Must / Should / Could / Won't (for this version).
// Saved per app: moscow:<app> = { cards: [{ id, name, note, col: 'M'|'S'|'C'|'W' }] }, included in the backup file and the Markdown export.
// Every card has a "Move to" menu, so dragging is optional (it does not work on touch screens and not for keyboard users).
const Moscow = (() => {
  const COLS = [['M', 'Must', 'The app is useless without these'], ['S', 'Should', 'Important, but version 1 can ship without'], ['C', 'Could', 'Nice to have if time is left'], ['W', "Won't (this time)", 'Written down so it stops nagging you']];
  const MAX = 100;
  const key = () => 'moscow:' + currentApp;
  const cards = () => store.get(key(), { cards: [] }).cards;
  const save = list => store.set(key(), { cards: list });
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const ready = () => currentApp && store.get('game:' + currentApp);

  function cardHtml(c) {
    return `<li class="mo-card" draggable="true" data-id="${c.id}"><div><b>${esc(c.name)}</b>${c.note ? `<span>${esc(c.note)}</span>` : ''}</div>
      <div class="mo-ctl ma-noprint"><label class="sr" for="mv-${c.id}">Move ${esc(c.name)} to</label>
        <select id="mv-${c.id}" data-mo-move="${c.id}">${COLS.map(([k, n]) => `<option value="${k}"${c.col === k ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select>
        <button type="button" class="mo-del" data-mo-del="${c.id}" aria-label="Delete ${esc(c.name)}">Delete</button></div></li>`;
  }
  function page() {
    document.title = 'Feature board';
    if (!ready()) return '<div class="empty"><h1>Feature board</h1><p>Start your quest first. Then you can sort your features here.</p><a class="btn" href="#/new">Start the game</a></div>';
    const list = cards();
    return `<div class="wide myapp"><p class="crumb ma-noprint"><a href="#/">Home</a> › <a href="#/myapp">My app sheets</a> › Feature board</p>
      <h1>${esc(currentApp)}: Feature board</h1>
      <p class="lede">Put each feature in one box. Be strict: if "Must" has more than 7 cards, the first version is too big.</p>
      <form class="mo-add ma-noprint" data-mo-add novalidate>
        <div class="mafield"><label class="flabel" for="mo-name">Feature</label><input id="mo-name" name="name" type="text" maxlength="80" autocomplete="off" required></div>
        <div class="mafield"><label class="flabel" for="mo-note">One-line note (optional)</label><input id="mo-note" name="note" type="text" maxlength="140" autocomplete="off"></div>
        <div class="mafield"><label class="flabel" for="mo-col">Box</label><select id="mo-col" name="col">${COLS.map(([k, n]) => `<option value="${k}">${esc(n)}</option>`).join('')}</select></div>
        <button class="btn" type="submit">Add feature</button><p class="ferr" id="mo-err" role="alert" hidden></p>
      </form>
      <p class="ma-noprint"><button type="button" class="mini-btn" data-mo-import>Fill from my App info sheet</button> <span class="ma-status" id="mo-status" role="status"></span></p>
      <div class="mo-board">${COLS.map(([k, n, hint]) => { const cs = list.filter(c => c.col === k); return `<section class="mo-col" data-col="${k}" aria-label="${esc(n)}"><h2>${esc(n)} <small>${cs.length}</small></h2><p class="mo-hint">${esc(hint)}</p>
        <ul class="mo-list">${cs.map(cardHtml).join('')}</ul>${cs.length ? '' : '<p class="mo-empty">Nothing here yet</p>'}</section>`; }).join('')}</div></div>`;
  }
  function asText() {
    const list = cards();
    if (!list.length) return '';
    return ['## Feature board (MoSCoW)', ...COLS.flatMap(([k, n]) => { const cs = list.filter(c => c.col === k); return cs.length ? [`### ${n}`, ...cs.map(c => `- ${c.name}${c.note ? `: ${c.note}` : ''}`)] : []; })].join('\n');
  }
  const redraw = () => { const y = scrollY; main.innerHTML = page(); scrollTo(0, y); };
  const here = () => location.hash.split('/')[1] === 'moscow';

  function init() {
    main.addEventListener('submit', e => {
      if (!here() || !e.target.matches('[data-mo-add]')) return;
      e.preventDefault();
      const f = e.target, err = document.getElementById('mo-err'), name = Fill.clean(f.name.value, 80), list = cards();
      err.hidden = true;
      if (!name) { err.textContent = 'Write the feature first.'; err.hidden = false; f.name.focus(); return; }
      if (list.length >= MAX) { err.textContent = `The board is full (${MAX} cards). Delete some first.`; err.hidden = false; return; }
      if (list.some(c => c.name.toLowerCase() === name.toLowerCase())) { err.textContent = 'That feature is already on the board.'; err.hidden = false; return; }
      list.push({ id: uid(), name, note: Fill.clean(f.note.value, 140), col: COLS.some(([k]) => k === f.col.value) ? f.col.value : 'M' });
      if (!save(list)) toast('Could not save: your browser is blocking saved data.');
      redraw(); document.getElementById('mo-name').focus();
    });
    main.addEventListener('change', e => {
      const id = e.target.dataset?.moMove;
      if (!here() || !id) return;
      const list = cards(), c = list.find(x => x.id === id);
      if (c && COLS.some(([k]) => k === e.target.value)) { c.col = e.target.value; save(list); redraw(); document.getElementById('mv-' + id)?.focus(); }
    });
    main.addEventListener('click', e => {
      if (!here()) return;
      const del = e.target.closest('[data-mo-del]');
      if (del) { if (!confirm('Delete this feature card?')) return; save(cards().filter(c => c.id !== del.dataset.moDel)); redraw(); return; }
      if (e.target.closest('[data-mo-import]')) {
        const p = store.get('profile:' + currentApp, {}), list = cards(), have = new Set(list.map(c => c.name.toLowerCase()));
        let n = 0;
        const add = (txt, col) => String(txt || '').split('\n').map(l => Fill.clean(l.replace(/^[-*\d.)\s]+/, ''), 80)).filter(Boolean).forEach(name => { if (!have.has(name.toLowerCase()) && list.length < MAX) { list.push({ id: uid(), name, note: '', col }); have.add(name.toLowerCase()); n++; } });
        add(p.must, 'M'); add(p.notnow, 'W');
        save(list); redraw();
        const s = document.getElementById('mo-status'); if (s) s.textContent = n ? `Added ${n} from your App info sheet.` : 'Nothing new to add. Fill in the MUST and NOT lists on the App info sheet first.';
      }
    });
    // dragging is a bonus for mouse users
    let dragId = null;
    main.addEventListener('dragstart', e => { const c = e.target.closest?.('.mo-card'); if (here() && c) { dragId = c.dataset.id; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dragId); } });
    main.addEventListener('dragover', e => { if (here() && dragId && e.target.closest('.mo-col')) e.preventDefault(); });
    main.addEventListener('drop', e => {
      const col = e.target.closest?.('.mo-col');
      if (!here() || !dragId || !col) return;
      e.preventDefault();
      const list = cards(), c = list.find(x => x.id === dragId);
      dragId = null;
      if (c && c.col !== col.dataset.col) { c.col = col.dataset.col; save(list); redraw(); }
    });
    main.addEventListener('dragend', () => { dragId = null; });
  }
  return { page, init, asText };
})();
