// Pulls the handbook PDFs into data.js for the guide app.
// Run: node guide/build.mjs   (needs pdftotext, which ships with Git for Windows)
import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const BOOK1 = 'App_Builders_Handbook_Book1.pdf';
const BOOK2 = 'App_Builders_Handbook_Book2_Print_Pack.pdf';

function pdftotextPath() {
  const gitCopy = 'C:/Program Files/Git/mingw64/bin/pdftotext.exe';
  try { execFileSync('pdftotext', ['-v'], { stdio: 'ignore' }); return 'pdftotext'; } catch {}
  if (existsSync(gitCopy)) return gitCopy;
  throw new Error('pdftotext not found. Install Git for Windows or poppler, then run again.');
}
const PDFTOTEXT = pdftotextPath();

// Returns pages: [{ page: physical page number (1-based), lines: [...] }]
function readPdf(file) {
  const raw = execFileSync(PDFTOTEXT, ['-layout', '-enc', 'UTF-8', join(root, file), '-'], { encoding: 'utf8', maxBuffer: 64 << 20 });
  return raw.split('\f').map((text, i) => ({
    page: i + 1,
    lines: text.split(/\r?\n/)
      .filter(l => !/The App Builder.s Handbook · page \d+/.test(l)) // footer
      .filter(l => !/^\s*\d{1,3}\s*$/.test(l)),                      // lone page numbers
  }));
}

const isLabel = t => t.length > 3 && /^[A-Z0-9 ,.:;()'"“”‘’!?&\/-]+$/.test(t) && /[A-Z]{3}/.test(t);
// "TELL THE AI (COPY THIS EXACTLY)", "COPY THIS", or a named box like "START OF EVERY STAGE (COPY THIS)"
const isPromptLabel = t => /^(TELL THE AI \(COPY THIS|COPY THIS$)/.test(t) || /^[A-Z0-9 -]+ \(COPY[ ,]/.test(t);
const promptTitle = t => /^(TELL THE AI|COPY THIS)/.test(t) ? undefined : t.replace(/\s*\(COPY.*$/, '');
const isTableRow = l => /\S {3,}\S/.test(l.trim());
const keepBreak = t => /^(\d+[).]|[-*•]|[A-Z][A-Z ]+:)/.test(t);

// Turns one section's lines into display blocks.
function toBlocks(lines) {
  const blocks = [];
  let para = null, pre = null;
  const flush = () => { para = null; pre = null; };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i], t = line.trim();
    const gk = /^(Group [A-Z]: .+?)\s{2,}(What can go wrong.*)$/.exec(t);
    if (gk) { flush(); blocks.push({ t: 'p', text: gk[1], n: 1 }); lines[i] = gk[2]; i--; continue; }
    if (!t) { flush(); continue; }
    if (t.startsWith('☐')) {
      flush();
      let last = blocks.at(-1);
      if (last?.t !== 'check') blocks.push(last = { t: 'check', items: [] });
      last.items.push(t.replace(/^☐\s*/, ''));
      // continuation lines are indented further and are not new boxes
      // (a lowercase line after a blank gap is still the same box, wrapped by the PDF)
      for (;;) {
        let k = i + 1;
        while (k < lines.length && !lines[k].trim()) k++;
        const nx = lines[k];
        const cur = last.items.at(-1), openParen = (cur.match(/\(/g) || []).length > (cur.match(/\)/g) || []).length; // "(Chapter" ... "9)."
        if (!nx || !/^\s{3,}\S/.test(nx) || nx.trim().startsWith('☐') || (k > i + 1 && !/^\s+[a-z]/.test(nx) && !openParen)) break;
        last.items[last.items.length - 1] += ' ' + nx.trim(); i = k;
      }
      continue;
    }
    if (isPromptLabel(t)) {
      flush();
      const out = [];
      let j = i + 1;
      while (j < lines.length && !lines[j].trim()) j++;
      // one box in the PDF is not indented: then the box is the next paragraph
      if (j < lines.length && /^\S/.test(lines[j])) {
        while (j < lines.length && lines[j].trim()) out.push(lines[j++].trim());
      }
      // prompt box = indented lines; it may continue across a blank line or page break
      else while (j < lines.length) {
        const l = lines[j];
        if (!l.trim()) { const next = lines.slice(j).find(x => x.trim()); if (next && /^\s{2,}\S/.test(next) && !isLabel(next.trim()) && !next.trim().startsWith('☐')) { j++; continue; } break; }
        if (!/^\s{2,}\S/.test(l) || isLabel(l.trim()) || l.trim().startsWith('☐')) break;
        out.push(l.trim()); j++;
      }
      const text = out.reduce((acc, x) => !acc ? x : acc + (keepBreak(x) ? '\n' : ' ') + x, '');
      blocks.push({ t: 'prompt', text, title: promptTitle(t) });
      i = j - 1;
      continue;
    }
    if (isLabel(t)) { flush(); blocks.push({ t: 'label', text: t }); continue; }
    if (isTableRow(line)) {
      if (!pre) { para = null; blocks.push(pre = { t: 'pre', text: line.replace(/\s+$/, '') }); }
      else pre.text += '\n' + line.replace(/\s+$/, '');
      continue;
    }
    if (pre) { pre.text += '\n' + line.replace(/\s+$/, ''); continue; }
    if (!para || keepBreak(t)) blocks.push(para = { t: 'p', text: t, n: 1 });
    else { para.text += ' ' + t; para.n++; }
  }
  // a short one-line paragraph with no end punctuation is a sub-heading
  for (const b of blocks) {
    if (b.t === 'p' && b.n === 1 && b.text.length < 70 && /^[A-Z“"]/.test(b.text) && (!/[.,;:!?)]$/.test(b.text) || /^(Step \d+|Group [A-Z]|Failure \d+): .+\)$/.test(b.text)) && !/_{3}/.test(b.text)) b.t = 'h';
    delete b.n;
  }
  // table rows separated by blank lines become one table
  for (let k = blocks.length - 1; k > 0; k--) {
    if (blocks[k].t === 'pre' && blocks[k - 1].t === 'pre') { blocks[k - 1].text += '\n' + blocks[k].text; blocks.splice(k, 1); }
  }
  // de-indent table blocks so they don't drift right
  for (const b of blocks) if (b.t === 'pre') {
    const pad = Math.min(...b.text.split('\n').filter(x => x.trim()).map(x => x.match(/^ */)[0].length));
    b.text = b.text.split('\n').map(x => x.slice(pad)).join('\n');
  }
  return blocks;
}

function parseBook1() {
  const chapters = [];
  let ch = null, sec = null;
  for (const { page, lines } of readPdf(BOOK1)) {
    for (let i = 0; i < lines.length; i++) {
      const t = lines[i].trim();
      const chm = /^CHAPTER (\d+)$/.exec(lines[i]);
      if (chm) {
        const titleLines = [];
        let j = i + 1;
        while (j < lines.length && !lines[j].trim()) j++;
        while (j < lines.length && lines[j].trim()) titleLines.push(lines[j++].trim());
        ch = { id: chm[1], title: titleLines.join(' '), page, sections: [] };
        chapters.push(ch);
        sec = { id: ch.id, title: 'Introduction', page, lines: [] };
        ch.sections.push(sec);
        i = j - 1;
        continue;
      }
      if (!ch) continue; // cover, contents, toolkit pages
      const sm = /^(\d+)\.(\d+) (\S.*)$/.exec(lines[i]);
      if (sm && sm[1] === ch.id) {
        sec = { id: `${sm[1]}.${sm[2]}`, title: sm[3].trim(), page, lines: [] };
        ch.sections.push(sec);
        continue;
      }
      sec.lines.push(lines[i]);
    }
  }
  return chapters;
}

function parsePrintPack() {
  const sections = [];
  for (const { page, lines } of readPdf(BOOK2)) {
    const first = lines.findIndex(l => l.trim());
    if (first < 0) continue;
    if (/^CHAPTER 19/.test(lines[first])) break; // the prompt library repeats Book 1 Chapter 19
    if (lines[first].trim() !== 'PRINT PACK') continue;
    const k = lines.findIndex((l, n) => n > first && l.trim());
    sections.push({ id: `P.${sections.length + 1}`, title: lines[k].trim(), page, lines: lines.slice(k + 1) });
  }
  return { id: 'P', title: 'Print Pack: sheets to fill in for every app', page: 1, pdf: BOOK2, sections };
}

// Glossary (Chapter 21): -table mode keeps the two columns apart, unlike -layout
function parseGlossary(firstPage, lastPage) {
  const raw = execFileSync(PDFTOTEXT, ['-table', '-enc', 'UTF-8', '-f', firstPage, '-l', lastPage, join(root, BOOK1), '-'], { encoding: 'utf8' });
  const entries = [];
  let started = false;
  const unclosed = s => (s.match(/\(/g) || []).length > (s.match(/\)/g) || []).length;
  for (const raw0 of raw.split(/\r?\n/)) {
    const line = raw0.replace(/^\f/, '');
    if (/Plain meaning/.test(line)) { started = true; continue; }
    if (!started || !line.trim() || /The App Builder.s Handbook · page/.test(line) || /^\s*\d+\s*$/.test(line)) continue;
    if (/^Add your own project words/.test(line.trim())) break;
    const last = entries.at(-1);
    // the column position moves from page to page, so split on the gap instead
    if (/^\s/.test(line)) { if (last) last.def += (last.def ? ' ' : '') + line.trim(); continue; } // wrapped meaning
    let [term, ...rest] = line.trim().split(/\s{2,}/);
    // odd spacing like "Unit / integration  /  UI  test  Tests of…": short bits still belong to the term
    while (rest.length > 1 && (rest[0].startsWith('/') || rest[0].length <= 4)) term += ' ' + rest.shift();
    const def = rest.join(' ');
    if (last && unclosed(last.term)) { last.term += ' ' + term; last.def += (last.def ? ' ' : '') + def; } // wrapped term
    else entries.push({ term, def });
  }
  return entries;
}

// Long parts with no numbered sections (chapters 0, 1, 2, 20, 22, and 11.1) are one big block.
// Split them at their sub-headings so search can land on the exact part.
const MIN_HEADINGS_TO_SPLIT = 3; // fewer than this: the headings are small labels, keep the section whole
function splitByHeadings(c, pages) {
  c.sections = c.sections.flatMap(sec => {
    if (sec.blocks.filter(b => b.t === 'h').length < MIN_HEADINGS_TO_SPLIT) return [sec];
    const parts = [{ ...sec, blocks: [] }];
    for (const b of sec.blocks) {
      if (b.t === 'h') {
        const p = pages.find(p => p.page >= sec.page && p.lines.some(l => l.trim() === b.text));
        parts.push({ id: `${sec.id}-${parts.length}`, title: b.text, page: p ? p.page : sec.page, blocks: [] });
      } else parts.at(-1).blocks.push(b);
    }
    return parts.filter(s => s.blocks.length);
  });
}


// Chapter 11's edge-case tables (Groups A to K): -table mode keeps the three columns apart, so they can become real tables.
// Self-check: the number of rows we find must equal the number of tick boxes the PDF shows for the group, or the build stops.
function parseEdgeTables(firstPage, lastPage) {
  const raw = execFileSync(PDFTOTEXT, ['-table', '-enc', 'UTF-8', '-f', firstPage, '-l', lastPage, join(root, BOOK1), '-'], { encoding: 'utf8' });
  const groups = {};
  let cur = null, st = null;
  for (const raw0 of raw.split(/\r?\n/)) {
    const line = raw0.replace(/^\f/, '');
    if (!line.trim() || /The App Builder.s Handbook · page/.test(line)) continue;
    if (/^(HONEST LIMIT|EDGE-CASE SWEEP)/.test(line.trim())) { cur = null; continue; }
    const gh = /^Group ([A-Z]): /.exec(line);
    if (gh) { cur = groups[gh[1]] = { rows: [], ticks: 0 }; st = null; }
    const hd = /What can go wrong/.exec(line);
    if (hd && /How YOU test it/.test(line) && (gh || /^Edge case/.test(line))) { // a header line, also the one that starts Group K
      st = { c1: line.indexOf('What can go wrong'), c2: line.indexOf('How YOU test it'), tick: line.indexOf('☐') }; if (cur) cur.done = false;
      continue;
    }
    if (gh || !cur || !st) continue;
    if (/^[A-Z][A-Z0-9 :,'’-]{3,}$/.test(line.trim())) { cur.done = true; continue; } // an all-capitals label (like RULE FOR TIME) ends the table
    if (cur.done) continue;
    const cut = st.tick > st.c2 ? st.tick : undefined;
    const cells = [line.slice(0, st.c1), line.slice(st.c1, st.c2), line.slice(st.c2, cut)].map(c => c.replace(/☐/g, '').trim().replace(/\s{2,}/g, ' '));
    const hasTick = line.includes('☐'); // every real row starts on the line that carries its tick box; wrapped lines have none
    if (hasTick) cur.ticks++;
    const last = cur.rows.at(-1);
    if (!last || hasTick) cur.rows.push(cells);
    else cells.forEach((c, i) => { if (c) last[i] = last[i] ? last[i] + ' ' + c : c; });
  }
  return groups;
}

function applyEdgeTables(chapters, groups) {
  const ch = chapters.find(c => c.id === '11'), HEAD = ['Edge case', 'What can go wrong', 'How YOU test it'];
  const keepPre = /(^|\n)\s*(Goal|I decide|The AI does|Proof I demand|Questions I ask|Red flags|Done when)\b/; // the driver-card tear-out is not an edge table
  let n = 0;
  for (const s of ch.sections) {
    const m = /^Group ([A-Z]):/.exec(s.title);
    if (!m) continue;
    const g = groups[m[1]];
    if (!g || !g.rows.length) { console.error(`BUILD CHECK FAILED: no edge-case table found for ${s.title}`); process.exit(1); }
    if (g.rows.some(r => r.some(c => !c))) { console.error(`BUILD CHECK FAILED: ${s.title}: a row has an empty cell, so a wrapped line was probably misread`); process.exit(1); }
    if (g.rows.length !== g.ticks) { console.error(`BUILD CHECK FAILED: ${s.title}: found ${g.rows.length} rows but the PDF shows ${g.ticks} tick boxes`); process.exit(1); }
    s.blocks = [{ t: 'table', head: HEAD, tick: true, rows: g.rows, text: g.rows.map(r => r.join(' ')).join(' ') }, ...s.blocks.filter(b => b.t !== 'pre' || keepPre.test(b.text))];
    n += g.rows.length;
  }
  return n;
}

const book1Pages = readPdf(BOOK1);
const chapters = parseBook1();
chapters.forEach(c => (c.pdf = BOOK1));
chapters.push(parsePrintPack());
for (const c of chapters) for (const s of c.sections) { s.blocks = toBlocks(s.lines); delete s.lines; }
// drop empty intros (chapters that start straight into 0.1 etc. still keep their lead text)
for (const c of chapters) c.sections = c.sections.filter(s => s.blocks.length);

const glossaryCh = chapters.find(c => c.id === '21');
const glossary = parseGlossary(glossaryCh.page, chapters.find(c => c.id === '22').page - 1);
glossaryCh.sections = [{ id: '21', title: 'Glossary', page: glossaryCh.page, blocks: [
  { t: 'p', text: 'Every technical word in this book, in plain language.' },
  { t: 'dl', items: glossary.map(g => [g.term, g.def]) },
] }];
for (const c of chapters) if (c.id !== '21' && c.id !== 'P') splitByHeadings(c, book1Pages);
const edgeRows = applyEdgeTables(chapters, parseEdgeTables(chapters.find(c => c.id === '11').page, chapters.find(c => c.id === '12').page - 1));

// ---- self-check: fail loudly if the PDF layout changed and parsing broke ----
const assert = (ok, msg) => { if (!ok) { console.error('BUILD CHECK FAILED:', msg); process.exit(1); } };
const book1Text = book1Pages.flatMap(p => p.lines);
const ids = chapters.flatMap(c => c.sections.map(s => s.id));
assert(new Set(ids).size === ids.length, 'two sections share an id');
assert(glossary.length > 50 && glossary.every(g => g.term && g.def && g.term.length < 60), 'glossary parse broke: ' + JSON.stringify(glossary.filter(g => !g.def || g.term.length >= 60)));
const expectedPrompts = book1Text.filter(l => isPromptLabel(l.trim())).length;
const book1 = chapters.filter(c => c.id !== 'P');
const prompts = book1.flatMap(c => c.sections.flatMap(s => s.blocks.filter(b => b.t === 'prompt')));
assert(book1.map(c => c.id).join() === Array.from({ length: 23 }, (_, i) => i).join(), 'chapters 0-22 not all found: ' + book1.map(c => c.id));
assert(book1.every(c => c.sections.length), 'a chapter is empty');
assert(prompts.length === expectedPrompts, `prompts ${prompts.length} != labels ${expectedPrompts}`);
const tiny = prompts.filter(p => p.text.length <= 20); assert(!tiny.length, 'tiny prompts: ' + JSON.stringify(tiny));
assert(chapters.at(-1).sections.length >= 5, 'print pack sheets missing');
const suspect = prompts.filter(p => !/[.:)?!"”\]]$/.test(p.text));
if (suspect.length) console.warn(`Note: ${suspect.length} prompt(s) do not end in punctuation; check them:\n` + suspect.map(p => '  … ' + p.text.slice(-60)).join('\n'));

const data = { builtAt: new Date().toISOString(), chapters };
writeFileSync(join(here, 'data.js'), '// Generated by build.mjs. Do not edit by hand.\nwindow.HANDBOOK = ' + JSON.stringify(data) + ';\n');
const nSec = chapters.reduce((n, c) => n + c.sections.length, 0);
console.log(`OK: ${chapters.length} chapters, ${nSec} sections, ${prompts.length} prompts, ${glossary.length} glossary words, ${edgeRows} edge-case table rows -> guide/data.js`);
