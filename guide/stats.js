// stats.js: your progress in numbers. Bars and the activity grid are plain HTML/CSS, so they follow dark mode
// and screen readers can use them. Data: xplog:<app> (XP total by day), days:<app> (active days), guide.readtime (seconds per chapter).
const Stats = (() => {
  const back = n => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
  const key = d => Game.dayKey(d);

  // the log holds the XP total at the end of each day; XP earned that day is the step up from the day before
  function xpPerDay(log) {
    const days = Object.keys(log).sort(), out = {};
    days.forEach((k, i) => { out[k] = Math.max(0, log[k] - (i ? log[days[i - 1]] : 0)); });
    return out;
  }
  function page() {
    document.title = 'My progress';
    const has = Game.hasGame();
    const log = store.get('xplog:' + currentApp, {}), per = xpPerDay(log), sk = Game.streakInfo();
    const act = new Set(store.get('days:' + currentApp, []));
    const bars = [...Array(30).keys()].reverse().map(n => { const d = back(n), k = key(d); return { k, label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), xp: per[k] || 0 }; });
    const maxXp = Math.max(1, ...bars.map(b => b.xp));
    const best = Math.max(0, ...Object.values(per));
    const pct = Math.round(seen.size / H.chapters.length * 100);
    const top = Object.entries(store.get('readtime', {})).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const cells = [...Array(364).keys()].reverse().map(n => { const k = key(back(n)); return { k, on: act.has(k), hi: (per[k] || 0) > 20 }; }); // last 52 weeks, oldest first
    const empty = !has || (!Object.keys(log).length && !act.size);
    return `<article class="tool"><p class="crumb"><a href="#/">Home</a> › My progress</p>
      <h1>My progress</h1>
      ${has ? '' : '<p class="tool-sub"><a href="#/new">Start a quest</a> to track XP and streaks. Reading time is tracked either way.</p>'}
      <div class="stat-tiles">
        <div class="stat"><b>${sk.n}</b><span>day streak</span></div>
        <div class="stat"><b>${sk.best}</b><span>longest streak</span></div>
        <div class="stat"><b>${best}</b><span>most XP in a day</span></div>
        <div class="stat"><b>${pct}%</b><span>of chapters read</span></div>
      </div>
      <h2 class="sec-title">XP in the last 30 days</h2>
      ${empty ? '<p class="empty">Earn your first XP to see this chart.</p>' : `
      <div class="bars" role="img" aria-label="Bar chart of XP earned each day for 30 days. Most in one day: ${best}.">
        ${bars.map(b => `<span class="bar" title="${esc(b.label)}: ${b.xp} XP"><i style="height:${Math.round(b.xp / maxXp * 100)}%"></i></span>`).join('')}
      </div>
      <details class="tool-sub"><summary>Show as a table</summary><table class="tbl"><tr><th>Day</th><th>XP</th></tr>${bars.filter(b => b.xp).map(b => `<tr><td>${esc(b.label)}</td><td>${b.xp}</td></tr>`).join('') || '<tr><td colspan="2">No XP yet</td></tr>'}</table></details>
      <p class="tool-sub">The chart starts the day this feature was added, so older days show no XP.</p>`}
      <h2 class="sec-title">Active days, last year</h2>
      <div class="heat-wrap"><div class="heat" role="img" aria-label="${act.size} active days in the last year.">${cells.map(c => `<i class="${c.on ? 'on' : ''}${c.hi ? ' hi' : ''}" title="${c.k}${c.on ? ' (active)' : ''}"></i>`).join('')}</div></div>
      <h2 class="sec-title">Time spent reading</h2>
      ${top.length ? `<ul class="tbl-list">${top.map(([id, s]) => `<li><a href="#/c/${esc(id)}">${esc(chapterById(id)?.title || id)}</a><span>${Math.max(1, Math.round(s / 60))} min</span></li>`).join('')}</ul>` : '<p class="empty">Read a chapter and it shows up here.</p>'}
    </article>`;
  }
  return { page, init() {} };
})();
