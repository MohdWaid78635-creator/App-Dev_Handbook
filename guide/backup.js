// backup.js: save all progress to a file, and load it back.
// Progress lives only in this browser (localStorage). This is the safety net for clearing browser data,
// switching computer or browser. A backup is one small .json file with every "guide.*" saved value.
// Loading a file REPLACES what is saved here, so it asks first and checks the file before touching anything.
const Backup = (() => {
  const PREFIX = 'guide.', STAMP = 'guide.backupAt', MAX_BYTES = 5 * 1024 * 1024, DUE_DAYS = 7;
  const mine = () => Object.keys(localStorage).filter(k => k.startsWith(PREFIX) && k !== STAMP);
  const parse = s => { try { return JSON.parse(s); } catch { return undefined; } };

  function build() {
    const data = {};
    for (const k of mine()) data[k] = localStorage.getItem(k);
    return { app: 'app-guide', version: 1, exportedAt: new Date().toISOString(), data };
  }

  function save() {
    const apps = parse(localStorage.getItem('guide.apps')) || [];
    if (!apps.length) { say('Nothing to save yet. Start your quest first, then come back.'); return false; }
    const blob = new Blob([JSON.stringify(build(), null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `app-guide-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    localStorage.setItem(STAMP, String(Date.now()));
    say('Backup saved. Keep the file somewhere safe, like your Documents folder or cloud drive.');
    refreshNudge();
    return true;
  }

  // returns { ok, error, apps, exportedAt, data }: checks everything before anything is changed
  function check(text) {
    if (text.length > MAX_BYTES) return { error: 'That file is too big to be a backup from this app.' };
    const obj = parse(text);
    if (!obj || obj.app !== 'app-guide' || typeof obj.data !== 'object' || obj.data === null || Array.isArray(obj.data)) return { error: 'That file is not a backup from this app.' };
    if (obj.version !== 1) return { error: 'That backup is from a newer version of this app, so it cannot be loaded here.' };
    const data = obj.data;
    for (const [k, v] of Object.entries(data)) {
      if (!k.startsWith(PREFIX) || k === STAMP) return { error: 'That backup has data this app does not recognise, so it was not loaded.' };
      if (typeof v !== 'string' || v.length > 1_000_000 || parse(v) === undefined) return { error: 'That backup file is damaged, so it was not loaded.' };
    }
    const apps = parse(data['guide.apps']);
    if (!Array.isArray(apps) || !apps.every(a => typeof a === 'string')) return { error: 'That backup has no saved apps in it.' };
    return { ok: true, apps, exportedAt: obj.exportedAt, data };
  }

  function apply(c) {
    const old = {};
    for (const k of mine()) old[k] = localStorage.getItem(k);
    try {
      for (const k of mine()) localStorage.removeItem(k);
      for (const [k, v] of Object.entries(c.data)) localStorage.setItem(k, v);
      localStorage.setItem(STAMP, String(Date.now()));
      return true;
    } catch {
      for (const k of mine()) localStorage.removeItem(k); // put back exactly what was here before
      for (const [k, v] of Object.entries(old)) localStorage.setItem(k, v);
      return false;
    }
  }

  function loadText(text) {
    const c = check(text);
    if (!c.ok) { say(c.error, true); return false; }
    const here = parse(localStorage.getItem('guide.apps')) || [];
    const when = c.exportedAt ? new Date(c.exportedAt).toLocaleDateString() : 'an unknown date';
    const ok = confirm(`Replace the progress saved in this browser with this backup?\n\nBackup from ${when}: ${c.apps.length ? c.apps.join(', ') : 'no apps'}.\nSaved here now: ${here.length ? here.join(', ') : 'no apps'}.\n\nThis cannot be undone. If you want to keep what is here, press Cancel and save a backup first.`);
    if (!ok) { say('Nothing was changed.'); return false; }
    if (!apply(c)) { say('Could not load the backup, so nothing was changed.', true); return false; }
    say('Backup loaded. Reloading…');
    setTimeout(() => location.reload(), 600); // rebuild every screen from the restored data
    return true;
  }

  async function loadFile(file) {
    if (!file) return;
    if (file.size > MAX_BYTES) return say('That file is too big to be a backup from this app.', true);
    loadText(await file.text());
  }

  // ---- reminder: progress exists but no backup in the last week ----
  const ageDays = () => { const t = +localStorage.getItem(STAMP); return t ? (Date.now() - t) / 864e5 : Infinity; };
  const due = () => {
    if (!(parse(localStorage.getItem('guide.apps')) || []).length) return false;
    return Object.keys(localStorage).some(k => k.startsWith('guide.ticks:') && k.length > 'guide.ticks:'.length && (parse(localStorage.getItem(k)) || []).length) && ageDays() > DUE_DAYS;
  };
  function nudge() {
    if (!due()) return '';
    const t = +localStorage.getItem(STAMP);
    return `<section class="backupnudge" role="note"><span><b>Save a backup of your progress.</b> It lives only in this browser, and ${t ? `your last backup was ${Math.floor(ageDays())} days ago` : 'you have not saved one yet'}. One click saves it to a file.</span><button type="button" class="btn" data-backup="save">Save backup</button></section>`;
  }
  function refreshNudge() { document.querySelectorAll('.backupnudge').forEach(n => n.remove()); }

  function say(msg, bad) {
    const el = document.getElementById('bk-status');
    if (el) { el.textContent = msg; el.classList.toggle('bad', !!bad); }
    toast(msg);
  }

  function init() {
    document.addEventListener('click', e => {
      if (e.target.closest('#bk-save, [data-backup="save"]')) save();
      else if (e.target.closest('#bk-load')) document.getElementById('bk-file').click();
    });
    document.getElementById('bk-file')?.addEventListener('change', e => { loadFile(e.target.files[0]); e.target.value = ''; });
  }

  return { init, save, build, check, loadText, nudge, due };
})();
