// scorecard.js: the scores of every app on this device (each app is its own quest) and a shareable progress card (PNG).
// Nothing is stored here: scores are worked out from each app's saved ticks and quiz answers, the same way the quest does it.
const Scorecard = (() => {
  // Game works on "the current app", so look at each app in turn and put things back exactly as they were.
  function rows() {
    const keepApp = currentApp, keepTicks = tickSet, out = [];
    try {
      for (const app of apps) {
        currentApp = app; tickSet = new Set(store.get('ticks:' + app, []));
        if (!Game.hasGame()) continue;
        const o = Game.overall(), sk = Game.streakInfo();
        out.push({ app, rank: o.rank, xp: o.xp, done: o.doneLevels, total: o.levels.length, streak: sk.n });
      }
    } finally { currentApp = keepApp; tickSet = keepTicks; }
    return out.sort((a, b) => b.xp - a.xp);
  }

  function page() {
    document.title = 'Scores and sharing';
    const list = rows();
    if (!list.length) return '<div class="empty"><h1>Scores and sharing</h1><p>Start a quest first. Each app you start gets its own score here.</p><a class="btn" href="#/new">Start the game</a></div>';
    return `<article class="tool"><p class="crumb"><a href="#/play">Quest</a> › Scores and sharing</p><h1>Scores and sharing</h1>
      <p class="tool-sub">Every app on this device is its own quest. Use the left menu to switch apps.</p>
      <div class="heat-wrap"><table class="tbl sc-tbl"><caption class="sr">Scores for each app</caption><thead><tr><th scope="col">Name</th><th scope="col">Rank</th><th scope="col">XP</th><th scope="col">Levels</th><th scope="col">Streak</th></tr></thead>
        <tbody>${list.map(r => `<tr${r.app === currentApp ? ' class="me"' : ''}><th scope="row">${esc(r.app)}${r.app === currentApp ? ' (open now)' : ''}</th><td>${esc(r.rank)}</td><td>${r.xp}</td><td>${r.done}/${r.total}</td><td>${r.streak} day${r.streak === 1 ? '' : 's'}</td></tr>`).join('')}</tbody></table></div>
      <h2 class="sec-title">Share my progress</h2>
      <p class="tool-sub">Makes a picture of ${esc(currentApp)}: rank, XP, levels and streak. On a phone, press and hold the picture to save it.</p>
      <div class="sc-actions"><button type="button" class="btn" data-sc="make">Make my card</button></div>
      <div id="sc-out" aria-live="polite"></div></article>`;
  }

  const tok = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  function draw(r) {
    const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    const wrap = (txt, x, y, max, lh) => { // simple word wrap for long app names
      let line = '', yy = y;
      for (const w of String(txt).split(' ')) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > max && line) { g.fillText(line, x, yy); line = w; yy += lh; } else line = t; }
      g.fillText(line, x, yy); return yy;
    };
    g.fillStyle = tok('--bg'); g.fillRect(0, 0, W, H);
    g.fillStyle = tok('--accent'); g.fillRect(0, 0, W, 24);
    g.textAlign = 'center'; g.fillStyle = tok('--ink');
    g.font = '700 54px system-ui, sans-serif'; g.fillStyle = tok('--muted'); g.fillText('My app quest', W / 2, 150);
    g.font = '800 92px system-ui, sans-serif'; g.fillStyle = tok('--ink');
    const yEnd = wrap(r.app, W / 2, 270, W - 160, 104);
    // rank badge: a star inside a ring
    const cy = yEnd + 230;
    g.beginPath(); g.arc(W / 2, cy, 130, 0, Math.PI * 2); g.fillStyle = tok('--accent'); g.fill();
    g.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? 40 : 90; g.lineTo(W / 2 + Math.cos(a) * rad, cy + Math.sin(a) * rad); }
    g.closePath(); g.fillStyle = tok('--on-accent'); g.fill();
    g.fillStyle = tok('--ink'); g.font = '800 84px system-ui, sans-serif'; g.fillText(r.rank, W / 2, cy + 260);
    const stats = [[String(r.xp), 'XP'], [`${r.done}/${r.total}`, 'levels done'], [String(r.streak), r.streak === 1 ? 'day streak' : 'day streak']];
    stats.forEach(([big, small], i) => {
      const x = 190 + i * 350;
      g.fillStyle = tok('--surface'); g.fillRect(x - 150, cy + 340, 300, 200);
      g.strokeStyle = tok('--line'); g.lineWidth = 3; g.strokeRect(x - 150, cy + 340, 300, 200);
      g.fillStyle = tok('--ink'); g.font = '800 80px system-ui, sans-serif'; g.fillText(big, x, cy + 440);
      g.fillStyle = tok('--muted'); g.font = '600 36px system-ui, sans-serif'; g.fillText(small, x, cy + 500);
    });
    g.fillStyle = tok('--muted'); g.font = '600 36px system-ui, sans-serif';
    g.fillText(new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }), W / 2, H - 120);
    g.fillText("Built with the App Builder's Handbook", W / 2, H - 70);
    return c;
  }

  function init() {
    main.addEventListener('click', e => {
      if (location.hash.split('/')[1] !== 'scores' || !e.target.closest('[data-sc=make]')) return;
      const me = rows().find(r => r.app === currentApp), out = document.getElementById('sc-out');
      if (!me) { out.textContent = 'Start a quest first.'; return; }
      draw(me).toBlob(blob => {
        if (!blob) { out.textContent = 'Could not make the picture in this browser.'; return; }
        const url = URL.createObjectURL(blob), name = `${currentApp.replace(/[^\w-]+/g, '-').slice(0, 30) || 'app'}-progress.png`;
        out.innerHTML = `<img class="sc-img" src="${url}" alt="Progress card for ${esc(currentApp)}: ${esc(me.rank)}, ${me.xp} XP, ${me.done} of ${me.total} levels, ${me.streak} day streak"><p><a class="btn" href="${url}" download="${esc(name)}">Download the picture</a></p>`;
      }, 'image/png');
    });
  }
  return { page, init };
})();
