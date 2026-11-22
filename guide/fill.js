// fill.js: "My app details". You type your idea, users, company name and lists once (per app);
// every prompt that has a [BLANK] for them is filled in for you, and shows what was filled in.
// Only blanks that are meant for YOU are touched. Format examples inside prompts (like
// "As a [type of user], I want to [action]") are left alone, because the AI must fill those, not you.
const Fill = (() => {
  const LIMITS = { idea: 300, users: 200, company: 40, features: 1000, notnow: 1000 };
  const FIELDS = [
    { id: 'idea', label: 'Your app idea in one sentence', hint: 'For example: An app that lets neighbours order fresh vegetables straight from local farmers.', rows: 2 },
    { id: 'users', label: 'Who is it for?', hint: 'For example: Busy families in my city who want fresh food delivered.', rows: 2 },
    { id: 'company', label: 'Your name or business name', hint: 'Used to build your app’s permanent ID (see Level 5). Letters and numbers only will be kept.', rows: 1 },
    { id: 'features', label: 'Feature ideas, one per line', hint: 'Everything you can think of. Level 2 will help you cut it down to a small first version.', rows: 5 },
    { id: 'notnow', label: 'NOT in version 1, one per line', hint: 'Things you want later or never. Fill this after Level 2, so the AI will not build them early.', rows: 4 },
  ];
  // blanks written for the user, by the book. Anything else in [brackets] is a format example and is never touched.
  const USER_BLANKS = new Set(['IDEA', 'LIST', 'DESCRIBE YOUR APP AND USERS', 'WHAT YOU NOTICED', 'SCREEN', 'WHAT', 'mycompany', 'myapp', 'NUMBER + NAME', 'NUMBER and NAME']);
  const FROM_PROFILE = new Set(['IDEA', 'LIST', 'DESCRIBE YOUR APP AND USERS', 'mycompany']); // blanks you can fill in My app details
  const get = () => store.get('profile:' + currentApp, {});
  const clean = (s, max) => String(s ?? '').replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, max);
  const slug = s => { const t = String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ''); return t && /^\d/.test(t) ? 'a' + t : t; };
  const appId = () => { const c = slug(get().company), a = slug(currentApp); return c && a ? `com.${c}.${a}` : ''; };

  // the value for one blank, or '' when we do not know it yet
  function value(sid, key, opts = {}) {
    const p = get();
    if (key === 'IDEA') return p.idea || '';
    if (key === 'LIST') return sid === '3.2' ? p.features || '' : sid === '3.4' ? p.notnow || '' : '';
    if (key === 'DESCRIBE YOUR APP AND USERS') return [p.idea, p.users && `It is for: ${p.users}`].filter(Boolean).join(' ');
    if (key === 'mycompany') return slug(p.company);
    if (key === 'myapp') return slug(currentApp);
    if (key === 'NUMBER + NAME' || key === 'NUMBER and NAME') {
      const n = opts.stage ?? (typeof Game !== 'undefined' && Game.summary()?.cur?.n);
      const st = n && J.stages[n - 1];
      return st ? `${st.n} (${st.name})` : '';
    }
    return '';
  }

  // escaped html for a prompt, with filled values and open blanks marked
  function html(text, sid, opts) {
    let out = '', last = 0;
    for (const m of text.matchAll(/\[([^\]\n]{1,80})\]/g)) {
      out += esc(text.slice(last, m.index)); last = m.index + m[0].length;
      const key = m[1];
      if (!USER_BLANKS.has(key)) { out += esc(m[0]); continue; }
      const v = value(sid, key, opts);
      out += v ? `<mark class="ph on" title="Filled in from your app details">${esc(v)}</mark>` : `<mark class="ph off" title="Replace this before you send it">${esc(m[0])}</mark>`;
      if (v && /[.!?]$/.test(v) && text[last] === '.') last++; // "[IDEA]." with an idea that already ends in a full stop
    }
    return out + esc(text.slice(last));
  }

  // a short note under a prompt when blanks are still open
  function hint(text, sid, opts) {
    const open = [...new Set([...text.matchAll(/\[([^\]\n]{1,80})\]/g)].map(m => m[1]).filter(k => USER_BLANKS.has(k) && !value(sid, k, opts)))];
    if (!open.length) return '';
    const fillable = open.some(k => FROM_PROFILE.has(k));
    return `<p class="phhint">${icon('arrow')}<span>Blank to fill: ${open.map(k => `<b>[${esc(k)}]</b>`).join(', ')}. ${fillable ? '<a href="#/details">Fill in my app details</a> and it will be done for you.' : 'Replace it with the real details before you send it.'}</span></p>`;
  }

  // how many prompts in the book use each field (shown on the form, so it is clear why it matters)
  let uses = null;
  function usage() {
    if (uses) return uses;
    uses = { idea: 0, users: 0, company: 0, features: 0, notnow: 0 };
    const seen = [];
    H.chapters.forEach(c => c.sections.forEach(s => s.blocks.forEach(b => b.t === 'prompt' && seen.push([s.id, b.text]))));
    Object.entries(window.GAME?.extras || {}).forEach(([id, e]) => e.prompt && seen.push([id, e.prompt]));
    for (const [sid, t] of seen) for (const k of new Set([...t.matchAll(/\[([^\]\n]{1,80})\]/g)].map(m => m[1]))) {
      if (k === 'IDEA') uses.idea++;
      else if (k === 'DESCRIBE YOUR APP AND USERS') { uses.idea++; uses.users++; }
      else if (k === 'mycompany') uses.company++;
      else if (k === 'LIST' && sid === '3.2') uses.features++;
      else if (k === 'LIST' && sid === '3.4') uses.notnow++;
    }
    return uses;
  }

  function page() {
    document.title = 'My app details';
    if (!currentApp || !store.get('game:' + currentApp)) return `<div class="wide"><h1>My app details</h1><p class="lede">Start your quest first, then you can fill in your app details here.</p><a class="btn" href="#/new">Start the game</a></div>`;
    const p = get(), u = usage(), id = appId();
    return `<div class="wide details">
      <p class="crumb"><a href="#/">Home</a> › <a href="#/play">Quest</a> › My app details</p>
      <h1>My app details</h1>
      <p class="lede">Type these once for <b>${esc(currentApp)}</b>. Every prompt in the book that has a blank for them (like <b>[IDEA]</b>) is filled in for you, and you can see exactly what was filled. Nothing is sent anywhere: it stays in this browser.</p>
      <form class="gform" data-details-form novalidate>
        ${FIELDS.map(f => `<div><label class="flabel" for="d-${f.id}">${esc(f.label)} <small>${u[f.id] ? `(used in ${u[f.id]} prompt${u[f.id] > 1 ? 's' : ''})` : ''}</small></label>
          ${f.rows === 1 ? `<input id="d-${f.id}" name="${f.id}" type="text" maxlength="${LIMITS[f.id]}" value="${esc(p[f.id] || '')}" aria-describedby="h-${f.id}" autocomplete="off">`
            : `<textarea id="d-${f.id}" name="${f.id}" rows="${f.rows}" maxlength="${LIMITS[f.id]}" aria-describedby="h-${f.id}">${esc(p[f.id] || '')}</textarea>`}
          <p class="fnote" id="h-${f.id}">${esc(f.hint)}</p></div>`).join('')}
        <p class="appid" aria-live="polite"><b>Your app ID would be:</b> <code id="appid-preview">${id ? esc(id) : 'type your business name above'}</code><br><small>This is only a suggestion. Level 5 explains why the real ID is permanent after your first Google Play upload.</small></p>
        <div class="formbtns"><button type="submit" class="btn big">Save my details</button><a class="btn ghost" href="#/play">Back to the quest</a></div>
      </form></div>`;
  }

  function init() {
    main.addEventListener('submit', e => {
      const f = e.target.closest('[data-details-form]');
      if (!f) return;
      e.preventDefault();
      const next = {};
      for (const fld of FIELDS) { const v = clean(f.elements[fld.id].value, LIMITS[fld.id]); if (v) next[fld.id] = v; }
      const merged = { ...get() }; for (const fld of FIELDS) delete merged[fld.id]; // only this form's own fields are replaced
      if (store.set('profile:' + currentApp, { ...merged, ...next })) toast('Saved. Your prompts are filled in.');
      else alert('Could not save: your browser is blocking saved data for this page.');
    });
    main.addEventListener('input', e => { // live app-ID preview
      if (e.target.id !== 'd-company') return;
      const c = slug(e.target.value), a = slug(currentApp);
      document.getElementById('appid-preview').textContent = c && a ? `com.${c}.${a}` : 'type your business name above';
    });
  }

  return { page, init, html, hint, value, get, FIELDS, LIMITS, clean };
})();
