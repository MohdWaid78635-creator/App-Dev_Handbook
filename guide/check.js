// check.js: "Check my project". You pick your project folder; this page looks at FILE NAMES (and the words in
// .gitignore only) and tells you which of the book's files are there, which are missing, and which are due by now.
// Nothing leaves your computer. File contents are never read, except the small .gitignore file.
const Check = (() => {
  const G = window.GAME;
  const SKIP = /(^|\/)(node_modules|\.git|build|\.gradle|\.idea|dist|\.next|Pods|\.dart_tool)(\/|$)/i; // big folders that are never your own notes
  const TINY = 40;          // a file smaller than this (bytes) is basically empty
  const MAX_IGNORE = 200 * 1024;
  let last = null;           // result of the latest check (kept until you leave the page)

  const dueLevel = () => (typeof Game !== 'undefined' && Game.hasGame() ? (Game.summary()?.cur?.n ?? 15) : 15);

  // pure: list of {path, size, file?} -> findings (also used by the self-test)
  function analyse(entries, gitignoreText) {
    const root = entries[0]?.path.split('/')[0] || '';
    const skipped = entries.filter(e => SKIP.test(e.path)).length;
    const mine = entries.filter(e => !SKIP.test(e.path));
    const byName = new Map(); // lowercase file name -> shallowest match
    for (const e of mine) {
      const base = e.path.split('/').pop().toLowerCase(), depth = e.path.split('/').length;
      const had = byName.get(base);
      if (!had || depth < had.depth) byName.set(base, { ...e, depth });
    }
    const files = G.projectFiles.map(f => {
      const hit = byName.get(f.name.toLowerCase());
      const status = !hit ? 'missing' : hit.size < TINY ? 'empty' : 'found';
      return { ...f, status, path: hit ? hit.path.split('/').slice(1).join('/') || hit.path : '' };
    });
    // the book (7.4): "A .gitignore file blocks .env and key files"
    const secretFiles = mine.filter(e => /(^|\/)(\.env(?!\.(example|sample|template)$)[^/]*|[^/]+\.(jks|keystore))$/i.test(e.path)).map(e => e.path.split('/').slice(1).join('/'));
    const gi = byName.get('.gitignore');
    let secrets;
    if (!secretFiles.length) secrets = { level: 'ok', text: 'No .env or key files found in this folder.' };
    else if (!gi || gitignoreText === undefined) secrets = { level: 'bad', text: `${secretFiles.join(', ')} found, but there is no .gitignore file. Secrets could end up on GitHub.` };
    else {
      const has = re => gitignoreText.split(/\r?\n/).some(l => re.test(l.trim()) && !l.trim().startsWith('#'));
      const miss = [];
      if (secretFiles.some(f => /\.env/i.test(f)) && !has(/\.env/i)) miss.push('.env');
      if (secretFiles.some(f => /\.(jks|keystore)$/i.test(f)) && !has(/(\.jks|\.keystore|keystore|\*\.key)/i)) miss.push('key files (.jks, .keystore)');
      secrets = miss.length ? { level: 'bad', text: `${secretFiles.join(', ')} found, but your .gitignore does not mention ${miss.join(' or ')}. They could end up on GitHub.` }
        : { level: 'ok', text: `${secretFiles.join(', ')} found, and your .gitignore blocks them.` };
    }
    return { root, total: entries.length, skipped, files, secrets, hasGitignore: !!gi };
  }

  async function run(list) {
    const entries = [...list].map(f => ({ path: f.webkitRelativePath || f.name, size: f.size, file: f }));
    if (entries.length) main.querySelector('.check')?.insertAdjacentHTML('beforeend', '<div class="sk" role="status" aria-live="polite"><span class="sr">Reading your folder…</span><i class="sk-card" style="height:96px"></i><i class="sk-card" style="height:70px"></i><i class="sk-card" style="height:70px"></i></div>');
    if (!entries.length) return toast('That folder has no files in it. Pick your project folder.');
    const gi = entries.find(e => !SKIP.test(e.path) && e.path.split('/').pop().toLowerCase() === '.gitignore');
    let text;
    if (gi && gi.size <= MAX_IGNORE) { try { text = await gi.file.text(); } catch { text = undefined; } }
    last = { app: currentApp, at: Date.now(), ...analyse(entries.map(({ path, size }) => ({ path, size })), text) };
    main.innerHTML = page();
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.getElementById('chk-result')?.focus();
  }

  const row = f => `<li class="chk ${f.status}">
    <span class="ci" aria-hidden="true">${f.status === 'found' ? icon('check') : f.status === 'empty' ? '!' : '✕'}</span>
    <span class="cn"><b>${esc(f.name)}</b><small>${esc(f.what)}</small>
      ${f.status === 'found' ? `<small class="where">Found: ${esc(f.path)}</small>` : f.status === 'empty' ? `<small class="warn">Found but almost empty (${esc(f.path)}). Ask your AI to fill it in.</small>`
        : `<small class="warn">Missing. Level ${f.level} asks your AI to create it: <a href="#/s/${f.sec}">see the prompt (${f.sec})</a></small>`}</span></li>`;

  function results() {
    const r = last, due = dueLevel();
    const nowF = r.files.filter(f => f.level <= due), later = r.files.filter(f => f.level > due);
    const ok = nowF.filter(f => f.status === 'found').length;
    const todo = nowF.filter(f => f.status !== 'found');
    return `<section id="chk-result" class="chk-result" tabindex="-1" aria-label="Results">
      <div class="chk-sum ${todo.length ? 'todo' : 'good'}">
        <div class="ring" style="--p:${nowF.length ? Math.round(ok / nowF.length * 100) : 100}" role="img" aria-label="${ok} of ${nowF.length}"><span>${ok}/${nowF.length}</span></div>
        <div><b>${todo.length ? `${todo.length} file${todo.length > 1 ? 's' : ''} to sort out` : 'Everything due so far is there'}</b>
          <p>${ok} of ${nowF.length} files expected by ${due >= 15 && !Game.summary()?.cur ? 'the end of the quest' : `Level ${due}`} are in <b>${esc(r.root)}</b>.
          I looked at ${r.total - r.skipped} file names${r.skipped ? ` and skipped ${r.skipped} inside build and tool folders` : ''}.</p></div></div>
      ${todo.length ? `<h2 class="sec-title">To do now</h2><ul class="chklist">${todo.map(row).join('')}</ul>` : ''}
      ${ok ? `<h2 class="sec-title">Found</h2><ul class="chklist">${nowF.filter(f => f.status === 'found').map(row).join('')}</ul>` : ''}
      <h2 class="sec-title">Secrets safety <small>from section 7.4</small></h2>
      <p class="secnote ${r.secrets.level}" role="note">${icon(r.secrets.level === 'ok' ? 'shield' : 'flag')}<span>${esc(r.secrets.text)} <small>This only looks at file names and the words in .gitignore, not your whole GitHub history. Section 7.4 shows how to make the AI prove it.</small></span></p>
      ${later.length ? `<details class="chk-later"><summary>${later.length} more files come in later levels</summary><ul class="chklist">${later.map(f => `<li class="chk later"><span class="ci" aria-hidden="true">${f.status === 'found' ? icon('check') : '·'}</span><span class="cn"><b>${esc(f.name)}</b><small>${esc(f.what)} Created in Level ${f.level}${f.status === 'found' ? ' (already here)' : ''}.</small></span></li>`).join('')}</ul></details>` : ''}
      <p class="fnote">Checked ${new Date(r.at).toLocaleTimeString()}. Pick the folder again after your AI makes changes. This page never ticks boxes for you: you tick them when you have seen the proof.</p>
    </section>`;
  }

  function page() {
    document.title = 'Check my project';
    return `<div class="wide check">
      <p class="crumb"><a href="#/">Home</a> › <a href="#/play">Quest</a> › Check my project</p>
      <h1>Check my project</h1>
      <p class="lede">The book keeps asking your AI to create small notes files in your project (like <b>CLAUDE.md</b> and <b>DATA_MAP.md</b>). Pick your project folder and I will tell you which ones are there, which are missing, and which are due by now. <b>“The AI said it wrote it” is not proof. This is.</b></p>
      <div class="chk-pick">
        <button type="button" id="chk-pick" class="btn big">${icon('book')} Choose my project folder</button>
        <input type="file" id="chk-dir" webkitdirectory multiple hidden>
        <p class="fnote">Your browser may say it will “upload” the files. It does not. Nothing is sent anywhere: this page only reads the file names, and the words in your .gitignore file. It never opens your code. Works on a computer, best in Chrome or Edge. Phones cannot pick folders.</p>
      </div>
      ${last && last.app === currentApp ? results() : ''}
    </div>`;
  }

  function init() {
    main.addEventListener('click', e => { if (e.target.closest('#chk-pick')) document.getElementById('chk-dir').click(); });
    main.addEventListener('change', e => { if (e.target.id === 'chk-dir') { run(e.target.files); e.target.value = ''; } });
  }

  return { page, init, analyse, run };
})();
