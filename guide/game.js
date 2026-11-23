// game.js: the quest. Reads window.GAME (levels, extras) and window.HANDBOOK (your PDFs, via data.js).
// Nothing about progress is stored twice: XP, level status and badges are worked out from the tick boxes
// (the same ones the chapter reader uses) plus the quiz answers, so un-ticking a box lowers the score.
// Saved per app in this browser: game:<app> (name of types, start date), ticks:<app>, quiz:<app>, copies:<app>.
// Loaded after app.js and uses its globals (byId, tickSet, store, esc, icon, ...) only when a page is drawn.
const Game = (() => {
  const G = window.GAME;
  const XP = { mission: 20, extra: 15, boss: 50, quiz: 10 };
  const RANKS = [['Newcomer', 0], ['Idea Spark', 0.06], ['Planner', 0.18], ['Builder', 0.38], ['Guardian', 0.58], ['Launch Captain', 0.78], ['App Founder', 0.97]];
  const cleanTitle = t => t.replace(/\s*\((?:MASVS|OWASP)[^)]*\)/g, '').replace(/\s{2,}/g, ' ').trim();
  const fmt = n => n.toLocaleString();

  // ---------- build the model from the book ----------
  let M = null;
  function sectionToMission(entry) {
    const spec = typeof entry === 'string' ? { id: entry } : entry;
    const x = byId[spec.id];
    if (!x) throw new Error('game-data.js: unknown section ' + spec.id);
    const what = [], prompts = [], proofs = [];
    // PDF tables (screen-state grid, print-pack headers, Yes/No cells) show up as fake tick boxes: leave them out
    const junk = i => /^[☐\s]*$/.test(i) || /\s{3,}/.test(i) || /^(Stage: done when|Check \(with proof seen by me\)|Yes|No|Done|Yes ☐ No)$/.test(i);
    let wrong = '', lab = '', stop = false;
    for (const b of x.s.blocks) {
      if (b.t === 'label') { lab = b.text; if (/^HONEST LIMIT/.test(lab)) stop = true; continue; }
      if (b.t === 'p' && /^(➤|DRIVER CARD)/.test(b.text)) stop = true;
      if (/^WHAT IT IS/.test(lab) && b.t === 'p' && what.length < 2) what.push(b.text);
      if (/^WHAT GOES WRONG/.test(lab) && b.t === 'p' && !wrong) wrong = b.text;
      if (b.t === 'prompt') prompts.push(b);
      if (b.t === 'check' && !stop) for (const i of b.items) if (!junk(i) && !proofs.includes(i)) proofs.push(i);
    }
    const isMission = !spec.read && (prompts.length || proofs.length || spec.manual);
    const title = spec.title || cleanTitle(x.s.title);
    const label = spec.title ? '' : secLabel(x.s);
    const base = { sid: spec.id, title, label, chapter: x.c, page: x.s.page, section: x.s };
    if (!isMission) return { ...base, mission: false };
    const proofLabels = proofs.length ? proofs : ['I did this step and I can show the proof.'];
    const keys = proofs.length ? proofs.map(p => tickKey(spec.id, p)) : [tickKey('M' + spec.id, 'I did this')];
    return { ...base, mission: true, what, wrong, prompts, proofLabels, keys };
  }

  function build() {
    if (M) return M;
    const levels = G.levels.map(l => {
      const parts = l.sections.map(sectionToMission);
      const missions = parts.filter(p => p.mission);
      const readFirst = parts.filter(p => !p.mission);
      const stage = l.n ? J.stages[l.n - 1] : null;
      const bossLabels = stage ? stage.done : l.boss;
      const bossKeys = bossLabels.map(t => tickKey(stage ? 'J' + l.n : 'B0', t));
      const extras = l.extras.map(id => ({ id, ...G.extras[id], keys: G.extras[id].proofs.map(p => tickKey(id, p)) }));
      const chapters = [...new Set([...parts.map(p => p.chapter.id), ...l.intro?.map(i => i) || []])];
      return { ...l, missions, readFirst, bossLabels, bossKeys, gate: stage && (stage.gate || stage.gateBefore), extras, chapters };
    });
    // quiz: "which part of the book would have prevented this?" built from each section's own "what goes wrong" story
    const pool = levels.flatMap(l => l.missions.filter(m => m.wrong).map(m => ({ lvl: l.n, world: l.world, m })));
    for (const l of levels) {
      const mine = l.missions.filter(m => m.wrong);
      const picks = mine.length <= 3 ? mine : [0, Math.floor((mine.length - 1) / 2), mine.length - 1].map(i => mine[i]);
      l.quiz = picks.map(m => {
        const others = [...mine, ...pool.filter(p => p.world === l.world).map(p => p.m), ...pool.map(p => p.m)]
          .filter((o, i, a) => o.sid !== m.sid && a.findIndex(z => z.sid === o.sid) === i);
        const wrongOnes = others.slice(0, 2);
        const opts = [m, ...wrongOnes].map(o => ({ sid: o.sid, text: (o.label + o.title).trim() }));
        const r = [...m.sid].reduce((a, c) => a + c.charCodeAt(0), 0) % opts.length; // same order every time, but the right answer moves around
        opts.push(...opts.splice(0, r));
        return { qid: m.sid, story: m.wrong, answer: m.sid, opts, mission: m };
      });
    }
    return (M = { levels });
  }

  // ---------- derived state ----------
  const gameRec = () => store.get('game:' + currentApp, null);
  const hasGame = () => !!currentApp && !!gameRec();
  const quizDone = () => store.get('quiz:' + currentApp, {});
  const all_ = keys => keys.every(k => tickSet.has(k));
  const fightOk = n => !!store.get('fight:' + currentApp, {})[n]?.ok; // passed the boss fight for level n
  // Boss fights were added after some people had already finished levels. Mark those levels as passed once, for every
  // app on this device, so nobody is locked out of work they already did. Runs only for apps with no fight record yet.
  function grandfather() {
    let levels; try { levels = build().levels; } catch { return; }
    for (const app of store.get('apps', [])) {
      const k = 'fight:' + app;
      if (store.get(k, null)) continue;
      const tk = new Set(store.get('ticks:' + app, [])), rec = { v: 1 };
      for (const l of levels) if (l.missions.every(m => m.keys.every(x => tk.has(x))) && l.bossKeys.every(x => tk.has(x))) rec[l.n] = { best: 0, tries: 0, ok: true, gf: true };
      store.set(k, rec);
    }
  }
  const missionDone = m => all_(m.keys);
  function status(l) {
    const mDone = l.missions.filter(missionDone).length;
    const boss = all_(l.bossKeys);
    const exDone = l.extras.filter(e => all_(e.keys)).length;
    const qd = quizDone(), qOk = l.quiz.filter(q => qd[q.qid]).length;
    const fight = fightOk(l.n);
    return { mDone, mTotal: l.missions.length, boss, fight, exDone, qOk, done: mDone === l.missions.length && boss && fight };
  }
  function overall() {
    const { levels } = build(), qd = quizDone();
    let xp = 0, max = 0, doneLevels = 0, quizOk = 0;
    const sts = levels.map(l => {
      const s = status(l);
      xp += s.mDone * XP.mission + s.exDone * XP.extra + (s.boss ? XP.boss : 0) + s.qOk * XP.quiz;
      max += l.missions.length * XP.mission + l.extras.length * XP.extra + XP.boss + l.quiz.length * XP.quiz;
      if (s.done) doneLevels++;
      quizOk += s.qOk;
      return s;
    });
    // a level is open only when every level before it is done (the book: looping back is fine, skipping ahead is not)
    const unlocked = levels.map((l, i) => sts.slice(0, i).every(s => s.done));
    const cur = levels.findIndex((l, i) => !sts[i].done);
    const rankIdx = RANKS.reduce((r, [, f], i) => (xp >= Math.round(f * max) ? i : r), 0);
    const next = RANKS[rankIdx + 1];
    return { levels, sts, unlocked, cur, xp, max, doneLevels, quizOk, rank: RANKS[rankIdx][0], nextRank: next ? { name: next[0], at: Math.round(next[1] * max) } : null };
  }
  // ---------- daily streak: a day counts when you ticked a box, copied a prompt or answered a quiz question ----------
  const pad = n => String(n).padStart(2, '0');
  const dayKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; // local date, so midnight is your midnight
  const dayBack = k => { const d = new Date(); d.setDate(d.getDate() - k); return d; };
  const daysSet = () => new Set(store.get('days:' + currentApp, []));
  let justStarted = false;
  function noteActivity() {
    if (!hasGame()) return;
    const d = daysSet(), t = dayKey(new Date());
    if (d.has(t)) return;
    d.add(t);
    store.set('days:' + currentApp, [...d].sort().slice(-400));
    justStarted = true; setTimeout(() => (justStarted = false), 1500);
  }
  function streakInfo() {
    const d = daysSet(), today = d.has(dayKey(new Date()));
    let n = 0, k = today ? 0 : 1; // not done today yet: the streak still stands if yesterday was done
    while (d.has(dayKey(dayBack(k)))) { n++; k++; }
    let best = 0, run = 0, prev = null;
    for (const key of [...d].sort()) { // longest run of consecutive days
      const dt = new Date(key + 'T12:00:00'); const gap = prev ? Math.round((dt - prev) / 864e5) : 0;
      run = prev && gap === 1 ? run + 1 : 1; best = Math.max(best, run); prev = dt;
    }
    const week = [6, 5, 4, 3, 2, 1, 0].map(b => { const dt = dayBack(b); return { on: d.has(dayKey(dt)), letter: dt.toLocaleDateString(undefined, { weekday: 'narrow' }), name: dt.toLocaleDateString(undefined, { weekday: 'long' }), today: b === 0 }; });
    return { n, today, best, week };
  }

  // the one small thing to do next
  function nextStep(o) {
    const l = o.cur >= 0 ? o.levels[o.cur] : null;
    if (!l) return { title: 'You finished the quest', text: 'Keep the weekly 15-minute check from Chapter 17 in your calendar.', href: '#/s/17.1', cta: 'Open the weekly check' };
    const m = l.missions.find(x => !missionDone(x));
    if (m) {
      const proof = m.proofLabels.find((_, i) => !tickSet.has(m.keys[i]));
      return { title: `${m.label}${m.title}`.trim(), where: `Level ${l.n}: ${l.name}`, cta: 'Open this mission', href: `#/level/${l.n}`,
        text: `${m.prompts.length ? 'Copy the prompt and give it to your AI. ' : 'Do the step. '}Then tick this only when you have seen the proof: “${proof}”` };
    }
    if (!all_(l.bossKeys)) {
      const proof = l.bossLabels.find((_, i) => !tickSet.has(l.bossKeys[i]));
      return { title: 'Pass the boss gate', where: `Level ${l.n}: ${l.name}`, cta: 'Open the gate', href: `#/level/${l.n}`, text: `One proof left to see for yourself: “${proof}”` };
    }
    return { title: `Start Level ${l.n}`, where: l.name, cta: 'Open the level', href: `#/level/${l.n}`, text: l.story };
  }

  function todayCard(o) {
    const st = nextStep(o), s = streakInfo();
    const msg = s.today ? 'You did something today. That is how apps get built.' : s.n ? 'Do one small step today to keep your streak going.' : 'Do one small step today to start a streak.';
    return `<section class="todaycard" aria-label="Today">
      <div class="tnext"><p class="kicker">Your next small step</p><h2>${esc(st.title)}</h2>${st.where ? `<p class="twhere">${esc(st.where)}</p>` : ''}<p>${esc(st.text)}</p><a class="btn" href="${st.href}">${esc(st.cta)} ${icon('arrow')}</a></div>
      <div class="tstreak"><p class="sbig">${icon('flame')}<b>${s.n}</b><span>day${s.n === 1 ? '' : 's'} in a row</span></p>
        <ul class="week" aria-label="Last 7 days">${s.week.map(w => `<li class="${w.on ? 'on' : ''} ${w.today ? 'today' : ''}" title="${esc(w.name)}${w.on ? ': you did something' : ''}"><span class="sr">${esc(w.name)}${w.on ? ', done' : ''}</span><i aria-hidden="true">${w.on ? icon('check') : ''}</i><small aria-hidden="true">${esc(w.letter)}</small></li>`).join('')}</ul>
        <p class="smsg">${msg}</p>${s.best > s.n ? `<small>Best so far: ${s.best} days</small>` : ''}</div>
    </section>`;
  }

  function badges(o) {
    const d = n => o.sts[n]?.done;
    return [
      { id: 'first', name: 'First prompt', desc: 'Copy your first prompt.', ok: store.get('copies:' + currentApp, 0) > 0, ic: 'terminal' },
      { id: 'quiz', name: 'Quiz whiz', desc: 'Answer 10 brain-boost questions right.', ok: o.quizOk >= 10, ic: 'star' },
      { id: 'gates', name: 'Gate keeper', desc: 'Beat the three money-saving gates (levels 2, 6 and 13).', ok: d(2) && d(6) && d(13), ic: 'shield' },
      { id: 'half', name: 'Halfway there', desc: 'Finish level 7.', ok: [...Array(8).keys()].every(d), ic: 'flag' },
      { id: 'launch', name: 'Launch day', desc: 'Finish level 13, Release.', ok: [...Array(14).keys()].every(d), ic: 'rocket' },
      { id: 'proof', name: 'Proof collector', desc: 'Save a note or picture for 5 proofs.', ok: Evidence.count() >= 5, ic: 'clip' },
      { id: 'roll', name: 'On a roll', desc: 'Do something 3 days in a row.', ok: streakInfo().best >= 3, ic: 'flame' },
      { id: 'week', name: 'Full week', desc: 'Do something 7 days in a row.', ok: streakInfo().best >= 7, ic: 'trophy' },
      { id: 'month', name: '30-day streak', desc: 'Do something 30 days in a row.', ok: streakInfo().best >= 30, ic: 'trophy' },
      { id: 'gloss', name: 'Glossary master', desc: 'Master every flashcard word.', ok: typeof Flashcards !== 'undefined' && glossary.length > 0 && Flashcards.mastered() === glossary.length, ic: 'star' },
      { id: 'founder', name: 'App founder', desc: 'Finish every level.', ok: o.doneLevels === o.levels.length, ic: 'trophy' },
    ];
  }
  const types = () => (gameRec()?.types || []).map(id => G.appTypes.find(t => t.id === id)).filter(Boolean);

  // ---------- small html helpers ----------
  const ring = (done, total, cls = '') => `<div class="ring ${cls}" style="--p:${total ? Math.round(done / total * 100) : 0}" role="img" aria-label="${done} of ${total}"><span>${done}/${total}</span></div>`;
  const checkList = (keys, labels, locked) => `<ul class="check">${labels.map((t, i) => `<li><label><input type="checkbox" data-key="${esc(keys[i])}"${tickSet.has(keys[i]) ? ' checked' : ''}${locked ? ' disabled' : ''}> <span>${esc(t)}</span></label>${Evidence.row(keys[i], t, locked)}</li>`).join('')}</ul>`;
  const worldOf = l => G.worlds.find(w => w.id === l.world);

  // ---------- pages ----------
  function newGame() {
    document.title = 'Start your quest';
    return `<div class="wide newgame">
      <p class="kicker">New game</p>
      <h1>Name your app. The quest starts here.</h1>
      <p class="lede">You will play through ${G.levels.length} levels, from first idea to a live app on Google Play. Each level tells you what to do, gives you the exact words to tell your AI, and asks for proof before you move on. It is built from your handbook, so nothing is made up.</p>
      <form class="gform" data-game-form novalidate>
        <label for="g-name" class="flabel">What is your app called? <small>(a working name is fine)</small></label>
        <input id="g-name" name="name" type="text" maxlength="40" autocomplete="off" placeholder="e.g. Fresh Basket" aria-describedby="g-err" required>
        <p id="g-err" class="ferr" role="alert" hidden></p>
        <div><label for="g-idea" class="flabel">Your idea in one sentence <small>(optional. It will be filled into your prompts.)</small></label>
        <textarea id="g-idea" name="idea" rows="2" maxlength="300" placeholder="e.g. An app that lets neighbours order fresh vegetables from local farmers."></textarea></div>
        <fieldset>
          <legend class="flabel">What kind of app is it? <small>(tick all that fit. This adds extra care in the levels that matter for you.)</small></legend>
          <div class="types">${G.appTypes.map(t => `<label class="type"><input type="checkbox" name="types" value="${t.id}"><span><b>${esc(t.name)}</b><small>Risks: ${esc(t.risks)}</small></span></label>`).join('')}</div>
        </fieldset>
        <button type="submit" class="btn big">Start the game ${icon('arrow')}</button>
        <p class="fnote">This handbook builds <b>Android</b> apps (as the book says). Your progress is saved in this browser on this computer, one save per app.</p>
      </form>
    </div>`;
  }

  // ---------- journey map: a winding trail through every level, drawn from the same derived state ----------
  const stateOf = (o, i) => (o.sts[i].done ? 'done' : i === o.cur ? 'current' : !o.unlocked[i] ? 'locked' : 'open');
  function journeyMap(o) {
    const ROW = 108, BANNER = 66, XS = [18, 78, 26, 72]; // x in % of the width: left, right, left, right makes the trail wind
    let y = 8; const pts = [], banners = [];
    o.levels.forEach((l, i) => {
      if (!o.levels[i - 1] || o.levels[i - 1].world !== l.world) { banners.push({ w: worldOf(l), y }); y += BANNER; }
      pts.push({ l, i, x: XS[i % XS.length], y: y + ROW / 2 }); y += ROW;
    });
    const fin = { x: 50, y: y + ROW / 2 - 10 }; y += ROW - 10;
    const H = Math.round(y);
    const all = [...pts, fin];
    const allDone = o.doneLevels === o.levels.length;
    const seg = all.slice(0, -1).map((p, k) => {
      const q = all[k + 1], mid = (p.y + q.y) / 2;
      const cls = o.sts[k].done ? 'done' : k === o.cur ? 'cur' : 'todo';
      return `<path class="${cls}" d="M${p.x} ${p.y} C${p.x} ${mid} ${q.x} ${mid} ${q.x} ${q.y}" vector-effect="non-scaling-stroke"/>`;
    }).join('');
    const node = p => {
      const st = stateOf(o, p.i), s = o.sts[p.i], side = p.x > 50 ? 'left' : 'right';
      const sign = st === 'done' ? icon('check') : st === 'locked' ? icon('lock') : p.l.n;
      const fs = Boss.state(p.l.n), prog = (s.done ? 'Done' : st === 'locked' ? 'Locked' : `${s.mDone} of ${s.mTotal} missions`) + (fs?.tries ? ` · fight ${fs.best}/${Boss.N}` : '');
      return `<li class="mnode ${st}" style="left:${p.x}%;top:${p.y}px">
        <a class="mdot" href="#/level/${p.l.n}" aria-label="Level ${p.l.n}: ${esc(p.l.name)}, ${prog}"${st === 'current' ? ' aria-current="step"' : ''}>${sign}</a>
        ${st === 'current' ? `<span class="here ${side}" aria-hidden="true">${icon('rocket')} You are here</span>` : ''}
        <span class="mlab ${side}"><b>${p.l.n}. ${esc(p.l.name)}</b><small>${esc(p.l.stage)} · ${prog}</small></span></li>`;
    };
    return `<div class="jmapwrap"><ul class="legend" aria-hidden="true"><li class="l-done">Done</li><li class="l-cur">You are here</li><li class="l-open">Open</li><li class="l-locked">Locked</li></ul>
      <ol class="jmap" style="height:${H}px" aria-label="Journey map: ${o.doneLevels} of ${o.levels.length} levels done">
        <svg class="jline" viewBox="0 0 100 ${H}" preserveAspectRatio="none" aria-hidden="true">${seg}</svg>
        ${banners.map(b => `<li class="mworld" style="top:${b.y}px"><span><b>World ${b.w.id}: ${esc(b.w.name)}</b><small>${esc(b.w.blurb)}</small></span></li>`).join('')}
        ${pts.map(node).join('')}
        <li class="mnode finish ${allDone ? 'done' : 'locked'}" style="left:${fin.x}%;top:${fin.y}px"><span class="mdot" aria-hidden="true">${icon('trophy')}</span><span class="mlab center"><b>${allDone ? 'Your app is live and healthy' : 'The finish line'}</b><small>${allDone ? 'Quest complete' : 'Live on Google Play, kept healthy'}</small></span></li>
      </ol></div>`;
  }

  // small tracker shown in the left sidebar on every page
  function mini() {
    if (!hasGame()) return '';
    const o = overall(), pct = Math.round(o.xp / o.max * 100);
    const sk = streakInfo();
    return `<p class="side-title">Your quest</p>
      <a class="mini-card" href="#/play"><span class="mini-top"><b>${esc(o.rank)}</b><small>${o.doneLevels}/${o.levels.length} levels</small></span>
        <span class="mini-streak">${icon('flame')} ${sk.n} day${sk.n === 1 ? '' : 's'} in a row${sk.today ? ' · done today' : ''}</span>
        <span class="xpbar sm" aria-hidden="true"><span style="width:${pct}%"></span></span></a>
      <a class="mini-link" href="#/details">My app details</a>
      <a class="mini-link" href="#/check">Check my project</a>
      <a class="mini-link" href="#/proof">My proof</a>
      <a class="mini-link" href="#/myapp">My app sheets</a>
      <a class="mini-link" href="#/index">A to Z index</a>
      <a class="mini-link" href="#/learn">Learn Lab</a>
      <a class="mini-link" href="#/help">Something broke?</a>
      <a class="mini-link" href="#/facts">Facts that change${Facts.dueCount() ? ` <span class="dueb" aria-label="${Facts.dueCount()} due">${Facts.dueCount()}</span>` : ''}</a>
      <div class="mini-dots" role="group" aria-label="Levels">${o.levels.map((l, i) => { const st = stateOf(o, i); return `<a class="md ${st}" href="#/level/${l.n}" title="Level ${l.n}: ${esc(l.name)}${st === 'locked' ? ' (locked)' : ''}" aria-label="Level ${l.n}: ${esc(l.name)}, ${st}"${st === 'current' ? ' aria-current="step"' : ''}>${l.n}</a>`; }).join('')}</div>`;
  }
  function renderMini() { const el = document.getElementById('mini'); if (el) el.innerHTML = mini(); }


  function play() {
    if (!hasGame()) return newGame();
    document.title = `Quest: ${currentApp}`;
    const o = overall(), pct = Math.round(o.xp / o.max * 100);
    const cur = o.cur >= 0 ? o.levels[o.cur] : null;
    const myTypes = types(), expert = myTypes.filter(t => !/^Usually not/.test(t.expert));
    const bs = badges(o);
    return `<div class="wide play">
      <section class="hud" aria-label="Your progress">
        <div class="hud-main">
          <p class="kicker">Quest for</p>
          <h1>${esc(currentApp)}</h1>
          <p class="rank"><span class="rank-name">${icon('star')} ${esc(o.rank)}</span> · ${o.doneLevels} of ${o.levels.length} levels done</p>
          <div class="xpbar" role="progressbar" aria-label="Experience points" aria-valuemin="0" aria-valuemax="${o.max}" aria-valuenow="${o.xp}"><span style="width:${pct}%"></span></div>
          <p class="xptext">${fmt(o.xp)} / ${fmt(o.max)} XP${o.nextRank ? ` · next rank, ${esc(o.nextRank.name)}, at ${fmt(o.nextRank.at)} XP` : ' · top rank'}</p>
          ${cur ? `<a class="btn big" href="#/level/${cur.n}">${o.sts[o.cur].mDone || o.sts[o.cur].boss ? 'Continue' : 'Start'} Level ${cur.n}: ${esc(cur.name)} ${icon('arrow')}</a>` : '<p class="win">Every level is done. Your app is live and healthy.</p>'}
          <p class="hudlinks"><a href="#/details">${icon('arrow')} My app details (fills in your prompts)</a> <a href="#/check">${icon('arrow')} Check my project folder</a> <a href="#/proof">${icon('arrow')} My proof</a> <a href="#/myapp">${icon('arrow')} My app sheets</a> <a href="#/facts">${icon('arrow')} Facts that change</a> <a href="#/help">${icon('arrow')} Something broke?</a> <a href="#/learn">${icon('arrow')} Learn Lab</a></p>
        </div>
        <ul class="badges" aria-label="Badges">${bs.map(b => `<li class="badge-i ${b.ok ? 'on' : ''}" title="${esc(b.desc)}"><span class="bi">${icon(b.ic)}</span><span>${esc(b.name)}<small>${b.ok ? 'Earned' : 'Locked'}</small></span></li>`).join('')}</ul>
      </section>
      ${todayCard(o)}
      ${Facts.banner()}
      ${typeof Backup !== 'undefined' ? Backup.nudge() : ''}
      ${myTypes.length ? `<section class="typebox"><b>Your app type${myTypes.length > 1 ? 's' : ''}:</b> ${myTypes.map(t => `<span class="tchip">${esc(t.name)}</span>`).join(' ')}
        ${expert.length ? `<p class="expert"><b>Human expert advice:</b> ${expert.map(t => `${esc(t.name)}: ${esc(t.expert)}`).join(' ')}</p>` : ''}</section>` : ''}
      <h2 class="sec-title mapt">Your journey map <small>tap a stop to open it</small></h2>
      ${journeyMap(o)}
      <section class="world side-q"><header><h2>Side quests</h2><p>Open any time. They do not change your score.</p></header>
        <div class="nodes">
          <a class="node open" href="#/prompts"><span class="nn" aria-hidden="true">${icon('terminal')}</span><span class="nt"><b>Toolbox: all prompts</b><small>Copy-ready words for your AI</small></span></a>
          <a class="node open" href="#/c/20"><span class="nn" aria-hidden="true">${icon('shield')}</span><span class="nt"><b>Rescue</b><small>“I already built it and it is insecure or slow”</small></span></a>
          <a class="node open" href="#/c/21"><span class="nn" aria-hidden="true">${icon('book')}</span><span class="nt"><b>Glossary</b><small>Every technical word in plain language</small></span></a>
        </div></section>
      <details class="howscore"><summary>How points work</summary>
        <p>Each mission is worth ${XP.mission} XP, each bonus quest ${XP.extra} XP, each correct brain-boost answer ${XP.quiz} XP and each boss gate ${XP.boss} XP. A level is done when all its missions are done and its boss gate is passed. The next level opens then. You can always look back at an earlier level, and un-ticking a box takes its points away, because points always follow the real proof.</p></details>
    </div>`;
  }

  // book sheets you can now fill in inside the app (My app sheets)
  const FORM_LINKS = {
    'P.1': ['#/myapp', 'Fill in the App info sheet here, in the app'],
    'P.2': ['#/myapp/decisions', 'Write your decisions in the log here, in the app'],
    '3.5': ['#/myapp/costs', 'Build your cost table here, in the app'],
    '5.7': ['#/myapp/costs', 'Your services and their costs are in the cost table here'],
  };
  const openM = {};            // level -> { missionSid: true|false } chosen by the user
  const wrongPicks = new Set(); // "qid:optionSid" answered wrong on this page
  let curLevel = 0;

  function missionCard(l, m, idx, locked, firstOpenSid) {
    const done = missionDone(m), choice = openM[l.n]?.[m.sid];
    const open = !locked && (choice ?? (m.sid === firstOpenSid));
    const head = `<span class="mnum" aria-hidden="true">${done ? icon('check') : idx}</span><span class="mt">${esc(m.label + m.title)}</span><span class="mxp">${locked ? icon('lock') : done ? 'Done' : XP.mission + ' XP'}</span>`;
    if (locked) return `<li class="mission locked"><div class="msum">${head}</div></li>`;
    return `<li><details class="mission ${done ? 'done' : ''}" data-sid="${m.sid}"${open ? ' open' : ''}>
      <summary class="msum">${head}</summary>
      <div class="mbody">
        ${FORM_LINKS[m.sid] ? `<p class="formlink">${icon('arrow')} <a href="${FORM_LINKS[m.sid][0]}">${esc(FORM_LINKS[m.sid][1])}</a></p>` : ''}
        ${m.what.length ? `<h4>What it is</h4>${m.what.map(t => `<p>${esc(t)}</p>`).join('')}` : ''}
        ${m.prompts.length ? `<h4>Do this: tell your AI</h4>${m.prompts.map(p => renderBlock(p, m.sid)).join('')}` : '<h4>Do this</h4><p>Read the section, do the step, and keep the proof.</p>'}
        <h4>Prove it <small>(tick only when you have seen the proof yourself)</small></h4>
        ${checkList(m.keys, m.proofLabels, false)}
        <details class="full"><summary>Read the full section${m.page ? ` (PDF page ${m.page})` : ''}</summary>${renderBlocks(m.section.blocks.filter(b => b.t !== 'prompt' && b.t !== 'check'), m.sid)}
          <p><a class="pdf" href="../${encodeURI(m.chapter.pdf)}#page=${m.page}" target="_blank" rel="noopener">Open page ${m.page} in the PDF ↗</a> · <a href="#/s/${m.sid}">Open in the reader</a></p></details>
      </div></details></li>`;
  }

  function quizCard(l, q, i, locked) {
    const ok = quizDone()[q.qid];
    const m = q.mission;
    return `<li class="quiz ${ok ? 'ok' : ''}">
      <p class="qs"><span class="qn">Q${i + 1}</span> A real story from the book:</p>
      <blockquote>${esc(q.story)}</blockquote>
      <p class="qa">Which part of the handbook would have prevented this?</p>
      <div class="opts" role="group" aria-label="Answers">${q.opts.map(o => {
        const bad = wrongPicks.has(q.qid + ':' + o.sid), good = ok && o.sid === q.answer;
        return `<button type="button" class="opt ${good ? 'good' : ''} ${bad ? 'bad' : ''}" data-q="${q.qid}" data-o="${o.sid}"${ok || bad || locked ? ' disabled' : ''}>${esc(o.text)}</button>`;
      }).join('')}</div>
      ${ok ? `<div class="explain" role="status"><b>Right. +${XP.quiz} XP.</b> ${m.what[0] ? esc(m.what[0]) : ''} <a href="#/s/${m.sid}">Read the section</a></div>` : wrongPicks.size && q.opts.some(o => wrongPicks.has(q.qid + ':' + o.sid)) ? '<p class="hint" role="status">Not that one. Think about what the story went wrong with, then try another.</p>' : ''}
    </li>`;
  }

  function level(n) {
    if (!hasGame()) return newGame();
    const o = overall(), l = o.levels[n];
    if (!l) return notFound();
    curLevel = n;
    document.title = `Level ${n}: ${l.name}`;
    const i = n, s = o.sts[i], locked = !o.unlocked[i], w = worldOf(l);
    const firstOpen = l.missions.find(m => !missionDone(m))?.sid;
    const careTypes = types().filter(t => t.read.some(c => l.chapters.includes(c)));
    const byChapter = [];
    l.missions.forEach((m, idx) => {
      let g = byChapter.at(-1);
      if (!g || g.ch.id !== m.chapter.id) byChapter.push(g = { ch: m.chapter, items: [] });
      g.items.push({ m, idx: idx + 1 });
    });
    const prev = o.levels[n - 1], next = o.levels[n + 1];
    const introBlocks = (l.intro || []).flatMap(id => byId[id]?.s.blocks || []).filter(b => b.t !== 'check' && b.t !== 'prompt');
    const gateText = l.gate;
    return `<article class="level" data-level="${n}">
      <p class="crumb"><a href="#/">Home</a> › <a href="#/play">Quest</a> › World ${w.id}: ${esc(w.name)}</p>
      <header class="lhero">
        <div><p class="kicker">Level ${n} of ${o.levels.length - 1} · ${esc(l.stage)}</p><h1>${esc(l.name)}</h1><p class="story">${esc(l.story)}</p></div>
        ${ring(s.mDone + (s.boss ? 1 : 0), l.missions.length + 1, 'lring')}
      </header>
      ${locked ? `<div class="lockbar" role="note">${icon('lock')}<span><b>This level is locked.</b> Finish Level ${o.cur} first, then it opens. You can look at what is coming.</span><a class="btn" href="#/level/${o.cur}">Go to Level ${o.cur}</a></div>` : ''}
      ${careTypes.length && !locked ? `<div class="care" role="note">${icon('shield')}<span><b>Extra care for your app type:</b> ${careTypes.map(t => `${esc(t.name)}: read Chapter ${t.read.filter(c => l.chapters.includes(c)).join(', ')} carefully. ${esc(t.expert)}`).join(' ')}</span></div>` : ''}
      ${locked ? '' : Facts.levelNote(n)}
      ${locked ? '' : Learn.forLevel(n)}
      ${introBlocks.length ? `<details class="intro"><summary>What the book says first</summary>${renderBlocks(introBlocks, 'intro' + n)}</details>` : ''}
      ${l.readFirst.length ? `<details class="intro"><summary>Read first (${l.readFirst.length} short page${l.readFirst.length > 1 ? 's' : ''}, no points)</summary><ul class="readlist">${l.readFirst.map(r => `<li><a href="#/s/${r.sid}">${esc(r.label + r.title)}</a></li>`).join('')}</ul></details>` : ''}

      ${startPrompt(n) && !locked ? `<h2 class="sec-title">Start this level <small>paste this first, so your AI knows where you are</small></h2>${startPrompt(n)}` : ''}
      <h2 class="sec-title">Missions <small>${s.mDone} of ${s.mTotal} done</small></h2>
      ${byChapter.map(g => `${byChapter.length > 1 ? `<h3 class="chhead">${g.ch.id === 'P' ? esc(g.ch.title) : `${esc(chLabel(g.ch))}: ${esc(g.ch.title)}`}</h3>` : ''}<ol class="missions">${g.items.map(({ m, idx }) => missionCard(l, m, idx, locked, firstOpen)).join('')}</ol>`).join('')}

      ${l.quiz.length ? `<h2 class="sec-title">Brain boost <small>${s.qOk} of ${l.quiz.length} right · ${XP.quiz} XP each · optional</small></h2><ol class="quizzes">${l.quiz.map((q, k) => quizCard(l, q, k, locked)).join('')}</ol>` : ''}

      <h2 class="sec-title">Boss gate <small>${XP.boss} XP</small></h2>
      <section class="boss ${s.boss ? 'beaten' : ''}">
        <p class="bosshead">${icon('shield')} <b>${s.boss ? 'Gate passed' : 'Pass the gate to finish this level'}</b></p>
        ${gateText ? `<p class="gatetext">${esc(gateText)}</p>` : ''}
        <p>Tick each proof only when you have seen it yourself: a test result, a setting, a screenshot, or the app on your own phone.</p>
        ${G.projectFiles.some(f => f.level === n) ? `<p><a href="#/check">${icon('arrow')} Check my project folder for the files this level needs</a></p>` : ''}
        ${checkList(l.bossKeys, l.bossLabels, locked)}
        ${fightBox(n, locked)}
      </section>

      ${l.extras.length ? `<h2 class="sec-title">Bonus quests <small>${XP.extra} XP each · optional</small></h2>${l.extras.map(e => extraCard(e, locked)).join('')}` : ''}

      <nav class="pager" aria-label="Levels">${prev ? `<a href="#/level/${prev.n}"><small>← Back</small>Level ${prev.n}: ${esc(prev.name)}</a>` : '<span></span>'}${next ? `<a href="#/level/${next.n}"><small>${s.done ? 'Next level →' : 'Coming up →'}</small>Level ${next.n}: ${esc(next.name)}</a>` : '<a href="#/play"><small>Finish line</small>Back to the map</a>'}</nav>
    </article>`;
  }

  // boss fight line: passed or not, best score, and the button that opens the fight
  function fightBox(n, locked) {
    const st = Boss.state(n);
    return `<div class="fightbox ${st?.ok ? 'passed' : ''}"><p><b>${st?.ok ? icon('check') + ' Boss fight passed' : 'Boss fight: pass it to finish this level'}</b>
      <small>${st?.tries ? `Best ${st.best} of ${Boss.N} · ${st.tries} attempt${st.tries === 1 ? '' : 's'}` : `${Boss.N} questions, ${Boss.PASS} right to pass`}${st?.gf ? ' · counted because you finished this level earlier' : ''}</small></p>
      <button type="button" class="btn${st?.ok ? ' ghost' : ''}" data-boss="${n}"${locked ? ' disabled' : ''}>${st?.tries ? 'Fight again' : 'Start boss fight'}</button></div>`;
  }

  // the book's "start a stage" prompt (19.2), with this level's stage filled in
  function startPrompt(n) {
    const p = n > 0 && byId['19.2']?.s.blocks.find(b => b.t === 'prompt');
    return p ? renderBlock({ ...p, title: 'START THIS LEVEL', stage: n }, '19.2') : '';
  }

  function extraCard(e, locked) {
    const done = all_(e.keys);
    const tag = e.kind === 'docs' ? `Added from your own documents (${e.from}), not in your Handbook PDF · not checked against official sources` : e.kind === 'verified' ? `Added by this guide, not in your PDF · facts checked ${esc(G.checked)}` : e.kind === 'guidance' ? 'Added by this guide, not in your PDF · guidance, not a rule' : 'From your book, moved earlier so you do not forget';
    return `<section class="extra ${done ? 'done' : ''} ${e.kind}">
      <p class="etag">${esc(tag)}</p>
      <h3>${done ? icon('check') : ''}${esc(e.title)}</h3>
      <p>${esc(e.why)}</p>
      ${e.read?.length ? `<p class="reads">Read: ${e.read.map(id => { const x = byId[id]; return x ? `<a href="#/s/${id}">${esc((secLabel(x.s) + cleanTitle(x.s.title)).trim())}</a>` : ''; }).join(' · ')}</p>` : ''}
      ${e.prompt ? renderBlock({ t: 'prompt', title: 'COPY THIS FOR YOUR AI', text: e.prompt }, e.id) : ''}
      ${checkList(e.keys, e.proofs, locked)}
      ${e.source ? `<p class="esrc">Source: <a href="${esc(e.source.url)}" target="_blank" rel="noopener">${esc(e.source.label)} ↗</a></p>` : ''}
    </section>`;
  }

  // ---------- change detection, toasts and celebration ----------
  let snap = null;
  // XP total at the end of each day, so the stats page can show XP per day. Only written when it changes.
  function logXp(xp) {
    if (!hasGame()) return;
    try {
      const k = 'xplog:' + currentApp, log = store.get(k, {}), t = dayKey(new Date());
      if (log[t] === xp) return;
      log[t] = xp;
      store.set(k, Object.fromEntries(Object.entries(log).sort().slice(-400)));
    } catch { /* storage full: the chart just stops growing */ }
  }
  function snapshot() {
    const o = overall();
    logXp(o.xp);
    return { xp: o.xp, rank: o.rank, levels: o.sts.map(s => s.done), boss: o.sts.map(s => s.boss) };
  }
  function compare() {
    if (!hasGame()) { snap = null; return; }
    const now = snapshot();
    if (snap) {
      const dx = now.xp - snap.xp;
      const newLevel = now.levels.findIndex((d, i) => d && !snap.levels[i]);
      const newBoss = now.boss.findIndex((d, i) => d && !snap.boss[i]);
      if (newLevel >= 0) celebrate(newLevel, now.xp > 0 ? now.rank : '', now.rank !== snap.rank);
      else if (newBoss >= 0) toast(`Gate passed! +${XP.boss} XP`);
      else if (dx > 0) toast(`+${dx} XP${justStarted ? ` · ${streakInfo().n} day${streakInfo().n === 1 ? '' : 's'} in a row` : ''}`);
    }
    snap = now;
  }
  function celebrate(n, rank, rankUp) {
    document.getElementById('cele')?.remove();
    const o = overall(), l = o.levels[n], nxt = o.levels[n + 1];
    const el = document.createElement('div');
    el.id = 'cele'; el.setAttribute('role', 'status');
    el.innerHTML = `<div class="confetti" aria-hidden="true">${Array.from({ length: 28 }, (_, i) => `<i style="--x:${(i * 37) % 100}%;--d:${(i % 7) * 0.12}s;--c:${i % 4}"></i>`).join('')}</div>
      <div class="cele-card"><p class="kicker">Level ${n} complete</p><h2>${esc(l.name)} cleared!</h2>
      <p>${rankUp ? `New rank: <b>${esc(rank)}</b>. ` : ''}${fmt(o.xp)} XP so far.${nxt ? ` Next: Level ${nxt.n}, ${esc(nxt.name)}.` : ' You finished the whole quest.'}</p>
      <div class="cele-btns">${nxt ? `<a class="btn" href="#/level/${nxt.n}" data-cele-close>Next level ${icon('arrow')}</a>` : '<a class="btn" href="#/play" data-cele-close>See the map</a>'}<button type="button" class="btn ghost" data-cele-close>Stay here</button></div></div>`;
    document.body.appendChild(el);
    el.querySelector('.btn').focus({ preventScroll: true });
  }

  // redraw the level or map after a tick, keeping scroll position and focus
  function refresh() {
    const y = scrollY, ae = document.activeElement, key = ae?.dataset?.key, inM = ae?.closest?.('details.mission')?.dataset.sid;
    if (inM) (openM[curLevel] ??= {})[inM] = true; // keep the mission you are working in open
    main.innerHTML = page === 'level' ? level(curLevel) : play();
    renderMini();
    scrollTo({ top: y, behavior: 'instant' });
    if (key) main.querySelector(`[data-key="${CSS.escape(key)}"]`)?.focus({ preventScroll: true });
    compare();
  }

  function init() {
    grandfather();
    // starting a game
    main.addEventListener('submit', e => {
      const f = e.target.closest('[data-game-form]');
      if (!f) return;
      e.preventDefault();
      const input = f.querySelector('#g-name');
      const name = input.value.replace(/\s+/g, ' ').trim(), err = document.getElementById('g-err');
      const fail = msg => { err.textContent = msg; err.hidden = false; input.setAttribute('aria-invalid', 'true'); input.focus(); };
      if (name.length < 2) return fail('Please type a name for your app (at least 2 letters).');
      if (apps.some(a => a.toLowerCase() === name.toLowerCase())) return fail(`You already have an app called “${name}”. Pick a different name, or switch to it in the list on the left.`);
      const chosen = [...f.querySelectorAll('[name=types]:checked')].map(c => c.value);
      if (!apps.length) { // ticks made before the first game started carry over
        const guest = store.get('ticks:', null);
        if (guest) { store.set('ticks:' + name, guest); localStorage.removeItem('guide.ticks:'); }
      }
      apps.push(name); currentApp = name;
      store.set('game:' + name, { types: chosen, started: new Date().toISOString() });
      const idea = Fill.clean(f.querySelector('#g-idea').value, Fill.LIMITS.idea);
      if (idea) store.set('profile:' + name, { idea });
      snap = null;
      loadTicks(); renderAppPicker();
      location.hash = '#/level/0';
      setTimeout(() => toast(`Quest started for ${name}. Welcome to Basecamp!`), 100);
    });
    // brain-boost answers
    main.addEventListener('click', e => {
      const b = e.target.closest('.opt[data-q]');
      if (!b) return;
      const q = build().levels[curLevel].quiz.find(z => z.qid === b.dataset.q);
      if (!q) return;
      if (b.dataset.o === q.answer) { const d = quizDone(); d[q.qid] = true; store.set('quiz:' + currentApp, d); noteActivity(); }
      else wrongPicks.add(q.qid + ':' + b.dataset.o);
      const idx = [...main.querySelectorAll('.opt[data-q]')].indexOf(b);
      refresh();
      main.querySelectorAll('.opt[data-q]')[idx]?.focus({ preventScroll: true });
    });
    // remember which missions you opened or closed
    main.addEventListener('toggle', e => {
      const d = e.target;
      if (d.matches?.('details.mission')) (openM[curLevel] ??= {})[d.dataset.sid] = d.open;
    }, true);
    // celebration card
    document.addEventListener('click', e => { if (e.target.closest('[data-cele-close]')) document.getElementById('cele')?.remove(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') document.getElementById('cele')?.remove(); });
  }

  // one book section as plain parts (used by the help desk): what it is, prompts, real proof boxes
  function sectionInfo(id) {
    const m = sectionToMission({ id, manual: true }), real = !m.keys[0].startsWith('M' + id + '|');
    const first = m.section.blocks.find(b => b.t === 'p');
    return { ...m, intro: m.what[0] || first?.text || '', proofs: real ? m.proofLabels : [] };
  }
  return {
    sectionInfo, noteActivity, streakInfo, nextStep, dayKey,
    newGame, play, level, refresh, init, fightOk, compare, overall, hasGame, status, build, XP, renderMini,
    onCopy() { if (hasGame()) { const k = 'copies:' + currentApp; const had = store.get(k, 0); store.set(k, had + 1); if (!had) toast('Badge earned: First prompt'); } },
    summary() { if (!hasGame()) return null; const o = overall(); return { o, cur: o.cur >= 0 ? o.levels[o.cur] : null }; },
    resetWrong() { wrongPicks.clear(); },
    setSnap() { snap = hasGame() ? snapshot() : null; },
  };
})();
