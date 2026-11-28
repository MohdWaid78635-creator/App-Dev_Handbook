import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { assertContentCompatibility, createContentIdentityManifest, parseContentRelease, contentLimits } from '../src/content/schema.ts';

const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const documents = { missions: read('../src/generated/missions.json'), articles: read('../src/generated/articles.json'),
  glossary: read('../src/generated/glossary.json'), readiness: read('../src/generated/readiness.json') };
const frozen = read('./fixtures/content-identities.json');
const release = () => ({ schemaVersion: 1, releaseId: '66666666-6666-4666-8666-666666666666',
  minimumReaderVersion: 1, createdAt: '2026-11-27T03:30:00.000Z', documents: structuredClone(documents) });

test('expanded handbook validates while retaining the frozen learning and article identities', () => {
  const input = release();
  assert.deepEqual(parseContentRelease(JSON.stringify(input)), input);
  const current = createContentIdentityManifest(input.documents);
  assert.deepEqual({ ...current, articles: frozen.articles }, frozen);
  assert.equal(current.articles.length, 191);
  assert.doesNotThrow(() => assertContentCompatibility(frozen, input.documents));
  assert.equal(input.documents.missions.length, 13);
  assert.equal(input.documents.readiness.flatMap(group => group.checks).length, 133);
});

test('reordering explicit identities and editing explanatory text preserve saved references', () => {
  const input = release();
  input.documents.missions.reverse(); input.documents.readiness.reverse(); input.documents.glossary.reverse();
  input.documents.missions[0].quiz.reverse(); input.documents.missions[0].steps.reverse();
  input.documents.readiness[0].checks.reverse();
  input.documents.missions[0].quiz[0].explanation = 'A clearer explanation.';
  input.documents.glossary[0].meaning = 'A clearer definition.';
  const snapshot = structuredClone(input);
  assert.doesNotThrow(() => assertContentCompatibility(frozen, parseContentRelease(JSON.stringify(input)).documents));
  assert.deepEqual(input, snapshot, 'validation never rewrites the candidate');
});

test('new explicit identities can be appended without renumbering existing questions', () => {
  const input = release();
  input.documents.missions[0].quiz.push({ ...input.documents.missions[0].quiz[0], id: 'm0-extra-q1' });
  assert.doesNotThrow(() => assertContentCompatibility(frozen, parseContentRelease(JSON.stringify(input)).documents));
});

const incompatible = [
  ['removed mission', d => { d.missions.pop(); }],
  ['removed lesson', d => { d.missions[0].lessons.pop(); }],
  ['removed practice', d => { d.missions[0].practice.pop(); }],
  ['removed question', d => { d.missions[0].quiz.pop(); }],
  ['changed question meaning', d => { d.missions[0].quiz[0].prompt = 'Different assessment'; }],
  ['reordered answer choices', d => { d.missions[0].quiz[0].options.reverse(); }],
  ['changed answer index', d => { d.missions[0].quiz[0].answer = 0; }],
  ['changed question scoring kind', d => { d.missions[0].quiz[0].kind = 'boss'; }],
  ['removed build card', d => { d.missions[0].steps.pop(); }],
  ['changed stored proof text', d => { d.missions[0].steps[0].proof[0] = 'Different proof'; }],
  ['removed readiness group', d => { d.readiness.pop(); }],
  ['reassigned readiness mission', d => { d.readiness[0].missionId = 1; }],
  ['reassigned readiness check meaning', d => { d.readiness[0].checks[0].title = 'Different check'; }],
  ['removed readiness check', d => { d.readiness[0].checks.pop(); }],
  ['renamed glossary identity', d => { d.glossary[0].term = 'Another term'; }],
  ['removed glossary term', d => { d.glossary.pop(); }],
  ['removed library article', d => { d.articles = d.articles.filter(article => article.id !== frozen.articles[0]); }],
];
for (const [name, change] of incompatible) test(`content compatibility rejects ${name}`, () => {
  const input = structuredClone(documents); change(input);
  assert.throws(() => assertContentCompatibility(frozen, input));
});

const malformed = [
  ['unsupported format', r => { r.schemaVersion = 2; }],
  ['unsupported reader', r => { r.minimumReaderVersion = 2; }],
  ['invalid release identity', r => { r.releaseId = 'latest'; }],
  ['invalid date', r => { r.createdAt = 'tomorrow'; }],
  ['missing document', r => { delete r.documents.articles; }],
  ['empty missions', r => { r.documents.missions = []; }],
  ['duplicate mission', r => { r.documents.missions.push(r.documents.missions[0]); }],
  ['duplicate quiz ID', r => { r.documents.missions[0].quiz.push(r.documents.missions[0].quiz[0]); }],
  ['invalid answer index', r => { r.documents.missions[0].quiz[0].answer = 99; }],
  ['invalid question kind', r => { r.documents.missions[0].quiz[0].kind = 'unknown'; }],
  ['empty answer choice', r => { r.documents.missions[0].quiz[0].options[0] = ' '; }],
  ['missing lesson text', r => { r.documents.missions[0].lessons[0].cards[0].body = ''; }],
  ['duplicate lesson in mission', r => { r.documents.missions[0].lessons.push(r.documents.missions[0].lessons[0]); }],
  ['unsafe source link', r => { r.documents.missions[0].lessons[0].cards[0].sourceUrl = 'javascript:alert(1)'; }],
  ['non-https source', r => { r.documents.missions[0].steps[0].source.url = 'http://example.com'; }],
  ['empty proof', r => { r.documents.missions[0].steps[0].proof = []; }],
  ['duplicate proof', r => { r.documents.missions[0].steps[0].proof.push(r.documents.missions[0].steps[0].proof[0]); }],
  ['misassigned build card', r => { r.documents.missions[0].steps[0].stage = 1; }],
  ['unknown practice kind', r => { r.documents.missions[0].practice[0].type = 'unknown'; }],
  ['invalid match pair', r => { r.documents.missions[0].practice[0].pairs = [['a']]; }],
  ['invalid ordering exercise', r => { const p = r.documents.missions.flatMap(m => m.practice).find(p => p.type === 'order'); p.items = ['same', 'same', 'same']; }],
  ['orphan readiness mission', r => { r.documents.readiness[0].missionId = 99; }],
  ['duplicate readiness check', r => { r.documents.readiness[0].checks.push(r.documents.readiness[0].checks[0]); }],
  ['wrong readiness check prefix', r => { r.documents.readiness[0].checks[0].id = 'other:0'; }],
  ['unsafe readiness source', r => { r.documents.readiness[0].sources = [['Docs', 'data:text/html,bad']]; }],
  ['duplicate glossary ID', r => { r.documents.glossary.push(r.documents.glossary[0]); }],
  ['empty glossary meaning', r => { r.documents.glossary[0].meaning = ''; }],
  ['duplicate article', r => { r.documents.articles.push(r.documents.articles[0]); }],
  ['invalid article body', r => { r.documents.articles[0].body = [42]; }],
  ['missing prompts', r => { delete r.documents.articles[0].prompts; }],
  ['oversized text field', r => { r.documents.glossary[0].meaning = 'x'.repeat(contentLimits.textCharacters + 1); }],
];
for (const [name, change] of malformed) test(`release validation rejects ${name}`, () => {
  const input = release(); change(input);
  assert.throws(() => parseContentRelease(JSON.stringify(input)));
});

test('release boundary rejects malformed, unexpected and byte-oversized input', () => {
  for (const text of ['null', '[]', '{broken', JSON.stringify({ ...release(), secret: 'no' })]) {
    assert.throws(() => parseContentRelease(text));
  }
  assert.throws(() => parseContentRelease(' '.repeat(contentLimits.releaseBytes + 1)), /size|large|limit/i);
  assert.throws(() => createContentIdentityManifest({}), /content|document|mission/i);
  assert.throws(() => assertContentCompatibility({ schemaVersion: 2 }, documents));
});
