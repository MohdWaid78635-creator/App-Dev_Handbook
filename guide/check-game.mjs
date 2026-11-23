// Checks that the game covers the whole book. Run: node guide/check-game.mjs
// Fails loudly if a section of the book is left out of every level, or if game-data.js points at a section that does not exist.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const ctx = { window: {} };
vm.createContext(ctx);
for (const f of ['data.js', 'journey.js', 'game-data.js', 'learn-data.js']) vm.runInContext(readFileSync(join(here, f), 'utf8'), ctx);
const { HANDBOOK: H, JOURNEY: J, GAME: G } = ctx.window;

const bad = [];
const byId = new Map(H.chapters.flatMap(c => c.sections.map(s => [s.id, { c, s }])));
const used = new Set();
const sid = e => (typeof e === 'string' ? e : e.id);

for (const l of G.levels) {
  for (const e of l.sections) { if (!byId.has(sid(e))) bad.push(`level ${l.n}: unknown section ${sid(e)}`); used.add(sid(e)); }
  for (const i of l.intro || []) { if (!byId.has(i)) bad.push(`level ${l.n}: unknown intro ${i}`); used.add(i); }
  for (const x of l.extras) if (!G.extras[x]) bad.push(`level ${l.n}: unknown extra ${x}`);
  if (l.n > 0 && !J.stages[l.n - 1]?.done?.length) bad.push(`level ${l.n}: no boss proofs in journey.js`);
  if (l.n === 0 && !l.boss?.length) bad.push('level 0: no boss proofs');
}
for (const [id, x] of Object.entries(G.extras)) {
  if (!['moved', 'verified', 'guidance', 'docs'].includes(x.kind)) bad.push(`extra ${id}: bad kind`);
  if (x.kind === 'docs' && !x.from) bad.push(`extra ${id}: docs quest needs a from`);
  if (!x.proofs?.length) bad.push(`extra ${id}: no proofs`);
  if (x.kind === 'verified' && !/^https:\/\//.test(x.source?.url || '')) bad.push(`extra ${id}: verified but no source link`);
  for (const r of x.read || []) if (!byId.has(r)) bad.push(`extra ${id}: unknown read link ${r}`);
}
// project files: each name must really appear in the section that explains it
for (const f of G.projectFiles) {
  const x = byId.get(f.sec);
  if (!x) { bad.push(`projectFile ${f.name}: unknown section ${f.sec}`); continue; }
  const text = x.s.blocks.map(b => b.text || (b.items || []).flat().join(' ')).join(' ');
  if (!text.includes(f.name)) bad.push(`projectFile ${f.name}: not mentioned in section ${f.sec}`);
  if (!G.levels.some(l => l.n === f.level)) bad.push(`projectFile ${f.name}: unknown level ${f.level}`);
}
if (new Set(G.projectFiles.map(f => f.name)).size !== G.projectFiles.length) bad.push('projectFiles: duplicate name');
// cost table rows must come from the book's 3.5 table or its prompt
{
  const x = byId.get('3.5'), text = x ? x.s.blocks.map(b => b.text || (b.items || []).flat().join(' ')).join(' ').toLowerCase() : '';
  for (const c of G.costItems) if (!text.includes(c.find.toLowerCase())) bad.push(`costItem ${c.item}: "${c.find}" not found in section 3.5`);
}
// "CHECK THE DATE" boxes: every box in the book needs a short title, and the notes must point at real boxes
{
  const found = new Set();
  for (const c of H.chapters) for (const s of c.sections) {
    let k = 0;
    for (const b of s.blocks) if (b.t === 'p' && /^⏰\s*CHECK THE DATE\s*$/.test(b.text)) found.add(`${s.id}#${k++}`);
  }
  for (const key of found) if (!G.factInfo[key]) bad.push(`fact ${key}: the book has a CHECK THE DATE box with no title in factInfo`);
  for (const key of Object.keys(G.factInfo)) if (!found.has(key)) bad.push(`fact ${key}: in factInfo but not in the book`);
  for (const [key, list] of Object.entries(G.verifiedFacts)) {
    if (!found.has(key)) bad.push(`verifiedFacts ${key}: not a box in the book`);
    for (const v of list) if (!/^https:\/\//.test(v.url) || !v.note) bad.push(`verifiedFacts ${key}: needs an https url and a note`);
  }
}
// help desk: every step must point at a real section whose title still matches
{
  const ids = new Set();
  for (const t of G.helpTopics) {
    if (ids.has(t.id)) bad.push(`helpTopic ${t.id}: duplicate id`); ids.add(t.id);
    if (t.steps.length < 2) bad.push(`helpTopic ${t.id}: needs at least 2 steps`);
    for (const st of t.steps) {
      const x = byId.get(st.sec);
      if (!x) bad.push(`helpTopic ${t.id}: unknown section ${st.sec}`);
      else if (!x.s.title.toLowerCase().includes(st.expect.toLowerCase())) bad.push(`helpTopic ${t.id}: section ${st.sec} is now "${x.s.title}", expected it to contain "${st.expect}"`);
      if (!['stop', 'check', 'fix', 'prevent'].includes(st.phase)) bad.push(`helpTopic ${t.id}: bad phase ${st.phase}`);
    }
  }
}
// Learn Lab: ids, level numbers, section links and question answers must all be valid
{
  const ids = new Set();
  for (const m of ctx.window.LEARN.modules) {
    if (ids.has(m.id)) bad.push(`learn ${m.id}: duplicate id`); ids.add(m.id);
    for (const n of m.levels) if (!G.levels.some(l => l.n === n)) bad.push(`learn ${m.id}: unknown level ${n}`);
    for (const s of m.sections) if (!byId.has(s)) bad.push(`learn ${m.id}: unknown section ${s}`);
    if (m.cards.length < 3 || m.quiz.length < 3 || !m.try.length || !m.ai.length || !m.explain) bad.push(`learn ${m.id}: needs 3+ cards, 3+ quiz, 1+ try, ai tips and an explain prompt`);
    m.quiz.forEach((q, i) => { if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length || q.options.length < 2) bad.push(`learn ${m.id} quiz ${i}: bad answer index`); });
    m.try.forEach((q, i) => {
      if (q.type === 'order' && (!q.items || q.items.length < 3)) bad.push(`learn ${m.id} try ${i}: order needs 3+ items`);
      if (q.type === 'match' && (!q.pairs || q.pairs.length < 2 || new Set(q.pairs.map(p => p[1])).size < 2)) bad.push(`learn ${m.id} try ${i}: match needs 2+ pairs and 2+ different answers`);
      if (!['order', 'match'].includes(q.type)) bad.push(`learn ${m.id} try ${i}: bad type ${q.type}`);
    });
  }
}
// every section of the book must be somewhere: in a level, in the "elsewhere" list, or in a side-quest chapter
for (const c of H.chapters) {
  if (G.sideChapters.includes(c.id)) continue;
  for (const s of c.sections) {
    if (!used.has(s.id) && !G.elsewhere[s.id]) bad.push(`not covered by any level: ${s.id} ${s.title}`);
  }
}
for (const id of Object.keys(G.elsewhere)) if (!byId.has(id)) bad.push(`elsewhere: unknown section ${id}`);
const dup = [...used].filter(id => G.levels.filter(l => l.sections.some(e => sid(e) === id)).length > 1);
if (dup.length) bad.push('section used in two levels: ' + dup.join(', '));

// stack picker: every combination of answers gives a full recommendation whose section links exist
{
  const code = readFileSync(join(here, 'stackpicker.js'), 'utf8') + '\n;StackPicker';
  const SP = vm.runInContext(code, ctx);
  const qs = SP.questions; let n = 0;
  const walk = (i, a) => {
    if (i === qs.length) { n++; const r = SP.recommend(a); if (r.length < 6) bad.push('stack picker: short answer for ' + JSON.stringify(a)); for (const x of r) for (const l of x.links) if (!byId.has(l.id)) bad.push(`stack picker: unknown section ${l.id}`); return; }
    for (const [v] of qs[i].o) walk(i + 1, { ...a, [qs[i].id]: v });
  };
  walk(0, {});
  if (n !== 243) bad.push('stack picker: expected 243 combinations, got ' + n);
}

// the offline cache must list every script the page loads
{
  const html = readFileSync(join(here, 'index.html'), 'utf8'), sw = readFileSync(join(here, 'sw.js'), 'utf8');
  for (const m of html.matchAll(/<script src="([^"]+)"/g)) if (!sw.includes(`'${m[1]}'`)) bad.push(`sw.js ASSETS is missing ${m[1]}`);
}

let pbStepCount = 0;
// ── Build Quest playbook validation ────────────────────────────────
{
  const pbCode = readFileSync(join(here, 'playbook-data.js'), 'utf8');
  const pbSandbox = { window: {} };
  vm.createContext(pbSandbox);
  vm.runInContext(pbCode, pbSandbox);
  const data = pbSandbox.window.PLAYBOOK_DATA;
  if (!data || !Array.isArray(data.stages)) {
    bad.push('playbook-data.js: missing window.PLAYBOOK_DATA.stages');
  } else {
    const releaseSteps = data.stages.find(stage => stage.id === 10)?.steps || [];
    const upload = releaseSteps.findIndex(step => step.id === 's10-step4');
    const closedTest = releaseSteps.findIndex(step => step.id === 's10-step3');
    if (upload < 0 || closedTest <= upload) bad.push('playbook: upload and verify the Play candidate before closed testing');
    const REQUIRED_KEYS = ['id', 'stage', 'title', 'why', 'do', 'prompt', 'proof', 'ifStuck', 'risk', 'rollback', 'cost', 'source'];
    const stepIds = new Set();
    const stageIds = data.stages.map(s => s.id);
    if (stageIds.length !== 13 || new Set(stageIds).size !== 13) bad.push('playbook: expected 13 unique stages');
    for (let i = 0; i <= 12; i++) {
      if (!stageIds.includes(i)) bad.push(`playbook: missing stage ID ${i}`);
    }
    for (const stage of data.stages) {
      if (stage.stub) bad.push(`playbook stage ${stage.id}: unfinished stub`);
      if (!stage.title?.trim() || !stage.desc?.trim()) bad.push(`playbook stage ${stage.id}: missing title or description`);
      const boss = stage.boss;
      if (!boss?.question?.trim() || !Array.isArray(boss.options) || boss.options.length < 2 ||
          boss.options.some(o => typeof o !== 'string' || !o.trim()) ||
          !Number.isInteger(boss.answer) || boss.answer < 0 || boss.answer >= boss.options.length) {
        bad.push(`playbook stage ${stage.id}: invalid boss fight`);
      }
      if (!stage.steps || !stage.steps.length) {
        bad.push(`playbook stage ${stage.id}: active stage has no steps`);
        continue;
      }
      for (const step of stage.steps) {
        for (const k of REQUIRED_KEYS) {
          if (step[k] === undefined || step[k] === null || step[k] === '') bad.push(`playbook step ${step.id}: missing "${k}"`);
        }
        if (step.stage !== stage.id) bad.push(`playbook step ${step.id}: wrong stage`);
        for (const k of ['do', 'proof']) {
          if (!Array.isArray(step[k]) || step[k].some(s => typeof s !== 'string' || !s.trim())) bad.push(`playbook step ${step.id}: invalid ${k}[]`);
        }
        const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
          !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
        if (!validDate(step.source?.checked)) bad.push(`playbook step ${step.id}: invalid checked date`);
        if (!Array.isArray(step.source?.versions) || !step.source.versions.length ||
            step.source.versions.some(v => typeof v !== 'string' || !v.trim())) bad.push(`playbook step ${step.id}: missing tool versions`);
        if (!step.factCheck?.key || !/^https:\/\//.test(step.factCheck?.url || '') ||
            !validDate(step.factCheck?.checkedOn)) bad.push(`playbook step ${step.id}: invalid fact check`);
        if (!step.do || step.do.length < 1) bad.push(`playbook step ${step.id}: empty do[]`);
        if (!step.proof || step.proof.length < 1) bad.push(`playbook step ${step.id}: empty proof[]`);
        if (!step.source || !step.source.url || !step.source.url.startsWith('https://')) {
          bad.push(`playbook step ${step.id}: invalid source URL`);
        }
        if (stepIds.has(step.id)) bad.push(`playbook step ${step.id}: duplicate ID`);
        stepIds.add(step.id);
      }
    }
    pbStepCount = stepIds.size;
  }
}

if (bad.length) { console.error('GAME CHECK FAILED:\n  ' + bad.join('\n  ')); process.exit(1); }
console.log(`OK: ${G.levels.length} levels cover ${used.size} sections; ${Object.keys(G.extras).length} bonus quests; Playbook stages 0-12 present (${pbStepCount} steps validated).`);
