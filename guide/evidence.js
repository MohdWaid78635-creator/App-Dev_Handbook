// evidence.js: a note and a picture next to each proof box ("demand proof", kept with the tick).
// Notes and pictures are saved in this browser, per app, and travel inside the backup file.
//   guide.proof:<app>        { tickKey: { note, img (id), at } }
//   guide.img:<app>:<id>     a small JPEG as a data URL (shrunk to about 100 KB, so about 12 fit comfortably)
// The browser keeps about 5 MB per site, so pictures are limited on purpose, and a full store is reported, never ignored.
const Evidence = (() => {
  const MAX_NOTE = 500, MAX_URL = 137000, MAX_IMAGES = 12, MAX_RAW = 25 * 1024 * 1024;
  const open = new Set(); // proof boxes whose editor is open (kept across redraws)

  const on = () => !!currentApp && !!store.get('game:' + currentApp);
  const index = () => store.get('proof:' + currentApp, {});
  const saveIndex = o => store.set('proof:' + currentApp, o);
  const imgKey = id => 'img:' + currentApp + ':' + id;
  const imgOf = e => (e?.img ? store.get(imgKey(e.img), null) : null);
  const imageCount = () => Object.values(index()).filter(e => e.img).length;
  const count = () => (on() ? Object.keys(index()).length : 0);
  const urlify = t => esc(t).replace(/(https?:\/\/[^\s<]+)/g, m => `<a href="${m}" target="_blank" rel="noopener noreferrer">${m}</a>`);

  function summary(key) {
    const e = index()[key];
    if (!e) return '';
    return `${e.note ? `<span class="evi-note">${urlify(e.note)}</span>` : ''}${e.img ? `<img class="evi-thumb" src="${esc(imgOf(e) || '')}" alt="Picture saved with this proof. Press to make it bigger or smaller." data-evi-zoom>` : ''}`;
  }
  function editor(key, label) {
    const e = index()[key] || {};
    const full = imageCount() >= MAX_IMAGES && !e.img;
    return `<div class="evi-edit">
      <label class="evi-l" for="n-${esc(key)}">Where is the proof? <small>A note, a file name, or a link. Up to ${MAX_NOTE} letters.</small></label>
      <textarea id="n-${esc(key)}" rows="2" maxlength="${MAX_NOTE}" data-evi-note placeholder="e.g. Screenshot saved as login-test.png, or a link to the test result">${esc(e.note || '')}</textarea>
      ${e.img ? `<img class="evi-thumb" src="${esc(imgOf(e) || '')}" alt="Picture saved with this proof. Press to make it bigger or smaller." data-evi-zoom>` : ''}
      <div class="evi-btns">
        <button type="button" class="mini-btn" data-evi-pick${full ? ' disabled' : ''}>${e.img ? 'Replace picture' : 'Add a picture'}</button>
        ${e.img ? '<button type="button" class="mini-btn" data-evi-rmimg>Remove picture</button>' : ''}
        ${e.note || e.img ? '<button type="button" class="mini-btn" data-evi-clear>Clear all</button>' : ''}
        <button type="button" class="mini-btn done" data-evi-close>Done</button>
        <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden data-evi-file aria-label="Choose a picture for this proof">
      </div>
      <p class="evi-help" role="status">${full ? `You already have ${MAX_IMAGES} pictures. The browser can only keep so many, so remove one first.` : 'Pictures are shrunk and kept in this browser only. They are included in your backup file.'}</p>
    </div>`;
  }
  // the html placed under one proof box
  function row(key, label, locked) {
    if (!on() || locked) return '';
    const e = index()[key], isOpen = open.has(key);
    return `<div class="evi" data-evi="${esc(key)}" data-evi-label="${esc(label)}">
      <button type="button" class="evi-btn" aria-expanded="${isOpen}" data-evi-toggle>${icon('clip')} ${e ? 'Proof saved' : 'Add proof'}</button>
      ${isOpen ? editor(key, label) : `<div class="evi-sum">${summary(key)}</div>`}</div>`;
  }
  function redraw(box) {
    const key = box.dataset.evi;
    box.outerHTML = row(key, box.dataset.eviLabel, false);
  }

  // shrink a picture until it is small enough to keep
  async function shrink(file) {
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) throw new Error('That is not a picture the app can use. Use a PNG, JPG, WEBP or GIF.');
    if (file.size > MAX_RAW) throw new Error('That picture is too big. Use one under 25 MB.');
    const bmp = await createImageBitmap(file);
    for (const [dim, q] of [[900, 0.7], [900, 0.5], [700, 0.5], [560, 0.45], [420, 0.4]]) {
      const sc = Math.min(1, dim / Math.max(bmp.width, bmp.height)), c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(bmp.width * sc)); c.height = Math.max(1, Math.round(bmp.height * sc));
      const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(bmp, 0, 0, c.width, c.height);
      const url = c.toDataURL('image/jpeg', q);
      if (url.length <= MAX_URL) return url;
    }
    throw new Error('That picture is too detailed to shrink enough. Try a smaller screenshot.');
  }

  function setEntry(key, patch) {
    const all = index(), e = { ...(all[key] || {}), ...patch, at: new Date().toISOString() };
    if (!e.note) delete e.note;
    if (!e.note && !e.img) delete all[key]; else all[key] = e;
    return saveIndex(all);
  }
  function dropImage(key) {
    const e = index()[key];
    if (e?.img) localStorage.removeItem('guide.' + imgKey(e.img));
  }
  const fail = m => toast(m);

  function init() {
    main.addEventListener('click', async e => {
      const box = e.target.closest('.evi');
      if (!box) return;
      const key = box.dataset.evi;
      if (e.target.closest('[data-evi-toggle]')) { open.has(key) ? open.delete(key) : open.add(key); redraw(box); if (open.has(key)) document.getElementById('n-' + key)?.focus(); return; }
      if (e.target.closest('[data-evi-close]')) { open.delete(key); redraw(box); return; }
      if (e.target.closest('[data-evi-pick]')) { box.querySelector('[data-evi-file]').click(); return; }
      if (e.target.closest('[data-evi-zoom]')) { e.target.closest('[data-evi-zoom]').classList.toggle('big'); return; }
      if (e.target.closest('[data-evi-rmimg]')) { dropImage(key); setEntry(key, { img: undefined }); redraw(box); return; }
      if (e.target.closest('[data-evi-clear]')) { if (!confirm('Remove the note and picture for this proof?')) return; dropImage(key); const a = index(); delete a[key]; saveIndex(a); redraw(box); return; }
    });
    main.addEventListener('change', async e => {
      const box = e.target.closest('.evi');
      if (!box) return;
      const key = box.dataset.evi;
      if (e.target.matches('[data-evi-note]')) {
        if (!setEntry(key, { note: Fill.clean(e.target.value, MAX_NOTE) })) fail('Could not save: the browser has no room left. Remove a picture.');
        box.querySelector('.evi-btn').lastChild.textContent = ' ' + (index()[key] ? 'Proof saved' : 'Add proof');
      } else if (e.target.matches('[data-evi-file]')) {
        const file = e.target.files[0]; e.target.value = '';
        if (!file) return;
        try {
          const url = await shrink(file);
          const old = index()[key], id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
          if (!store.set(imgKey(id), url)) throw new Error('The browser has no room left for pictures. Remove an old one first.');
          if (!setEntry(key, { img: id })) { localStorage.removeItem('guide.' + imgKey(id)); throw new Error('The browser has no room left to save this.'); }
          if (old?.img) localStorage.removeItem('guide.' + imgKey(old.img));
          open.add(key); redraw(box); toast('Picture saved with this proof.');
        } catch (err) { fail(err.message || 'Could not use that picture.'); }
      }
    });
  }

  // ---------- "My proof" page: everything you saved, in one place, ready to show an expert ----------
  function whereOf(key) {
    const sid = key.split('|')[0];
    const lv = typeof Game !== 'undefined' ? Game.build().levels : [];
    for (const l of lv) {
      for (const m of l.missions) if (m.keys.includes(key)) return { lvl: l.n, where: `Level ${l.n}: ${l.name} › ${(m.label + m.title).trim()}` };
      if (l.bossKeys.includes(key)) return { lvl: l.n, where: `Level ${l.n}: ${l.name} › Boss gate` };
      for (const x of l.extras) if (x.keys.includes(key)) return { lvl: l.n, where: `Level ${l.n}: ${l.name} › ${x.title}` };
    }
    const x = byId[sid]; return { lvl: 99, where: x ? `Chapter reader › ${(secLabel(x.s) + x.s.title).trim()}` : 'Other' };
  }
  function page() {
    document.title = 'My proof';
    if (!on()) return '<div class="wide"><h1>My proof</h1><p class="lede">Start your quest first. Then you can save a note or picture next to any proof box.</p><a class="btn" href="#/new">Start the game</a></div>';
    const idx = index();
    const items = Object.entries(idx).map(([key, e]) => ({ key, e, label: key.slice(key.indexOf('|') + 1), ...whereOf(key), done: tickSet.has(key) })).sort((a, b) => a.lvl - b.lvl || String(a.e.at).localeCompare(String(b.e.at)));
    return `<div class="wide proofpage">
      <p class="crumb"><a href="#/">Home</a> › <a href="#/play">Quest</a> › My proof</p>
      <h1>My proof</h1>
      <p class="lede">Every note and picture you saved for <b>${esc(currentApp)}</b>, in one list. Show it to a human expert, or print it. ${items.length ? `<button type="button" class="mini-btn" onclick="window.print()">Print or save as PDF</button>` : ''}</p>
      ${items.length ? `<ul class="prooflist">${items.map(i => `<li class="pf ${i.done ? 'done' : ''}"><p class="pf-where">${esc(i.where)}</p><p class="pf-label">${i.done ? icon('check') : ''}<b>${esc(i.label)}</b>${i.done ? '' : ' <small>(not ticked yet)</small>'}</p>
        ${i.e.note ? `<p class="pf-note">${urlify(i.e.note)}</p>` : ''}${i.e.img && imgOf(i.e) ? `<img class="evi-thumb" src="${esc(imgOf(i.e))}" alt="Picture saved with this proof" data-evi-zoom>` : ''}
        <small>Saved ${new Date(i.e.at).toLocaleDateString()}</small></li>`).join('')}</ul>`
        : `<div class="empty"><p>Nothing saved yet. In any mission, press <b>Add proof</b> under a tick box to save a note, a link or a picture.</p><a class="btn" href="#/play">Back to the quest</a></div>`}
      <p class="fnote">${imageCount()} of ${MAX_IMAGES} pictures used. Pictures stay in this browser and in your backup file.</p></div>`;
  }
  main.addEventListener('click', e => { const z = e.target.closest('.proofpage [data-evi-zoom]'); if (z) z.classList.toggle('big'); });

  return { init, row, page, count, MAX_IMAGES };
})();
