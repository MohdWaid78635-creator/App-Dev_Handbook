import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createProjectStore } from '../src/projects/store.ts';
import { buildLibrary } from '../src/library/search.ts';

const assessment = () => ({ version: 1, mode: 'existing', stage: 'live', goal: 'release', accounts: 'private',
  checks: { running: 'yes', journey: 'yes', data: 'yes', access: 'unsure', test: 'yes', recovery: 'yes' } });
function fixture() {
  let raw = null;
  const storage = { read: () => raw, write: value => { raw = value; } };
  const store = createProjectStore(storage);
  const [project] = store.save({ name: 'Existing app', audience: 'Learners', goal: 'Keep records' });
  return { store, storage, project };
}
async function guidance(change = {}, plan = { stack: 'expo-ts', target: 'android', data: 'supabase' }) {
  const f = fixture();
  const saved = f.store.saveAssessment(f.project.id, { ...assessment(), ...change }, plan);
  const { recommendProject } = await import('../src/projects/assessment.ts');
  return recommendProject(saved);
}

test('assessment survives reopen and editing without changing other project evidence', () => {
  const f = fixture();
  const [, second] = f.store.save({ name: 'Other app', audience: '', goal: '' });
  f.store.saveMilestone(f.project.id, 1, 'Keep this note');
  f.store.savePlan(f.project.id, { goal: 'Keep existing choices', stack: 'flutter' });
  f.store.saveAssessment(f.project.id, assessment(), { stack: 'expo-ts' });
  const [saved, untouched] = createProjectStore(f.storage).load();
  assert.deepEqual(saved.assessment, assessment());
  assert.deepEqual(saved.milestones, { 1: 'Keep this note' });
  assert.equal(saved.plan.goal, 'Keep existing choices');
  assert.equal(saved.plan.stack, 'expo-ts');
  assert.deepEqual(untouched, second);
  f.store.save({ name: 'Renamed', audience: '', goal: '' }, saved.id);
  assert.deepEqual(f.store.load()[0].assessment, assessment());
});

test('invalid assessment or plan never overwrites existing saved data', () => {
  const f = fixture();
  f.store.saveAssessment(f.project.id, assessment());
  const before = f.storage.read();
  for (const invalid of [null, [], { ...assessment(), version: 2 }, { ...assessment(), secret: 'no' },
    { ...assessment(), checks: { ...assessment().checks, access: 'na' } },
    { ...assessment(), checks: { running: 'yes' } }, { ...assessment(), goal: 'invented' }]) {
    assert.throws(() => f.store.saveAssessment(f.project.id, invalid), /assessment/i);
    assert.equal(f.storage.read(), before);
  }
  assert.throws(() => f.store.saveAssessment(f.project.id, assessment(), { stack: 42 }), /plan/i);
  assert.throws(() => f.store.saveAssessment(999, assessment()), /not be found/i);
  assert.equal(f.storage.read(), before);
  const malformed = JSON.parse(before); malformed.projects[0].assessment.version = 99;
  f.storage.write(JSON.stringify(malformed));
  assert.throws(() => f.store.load(), /could not be read/i);
});

test('live apps with uncertain private data checks get verification before release', async () => {
  const result = await guidance();
  assert.equal(result.focus, 'access');
  assert.match(result.reason, /not yet verified/i);
  assert.equal(result.stage, 'Live app');
  assert.equal(result.missionId, 5);
});

test('repair, exposure, performance and costs override the normal learning sequence', async () => {
  for (const [goal, focus] of [['repair', 'repair'], ['security', 'security'], ['performance', 'performance'], ['costs', 'costs']]) {
    assert.equal((await guidance({ goal, checks: { ...assessment().checks, running: 'no' } })).focus, focus);
  }
});

test('local apps skip account checks while unknown applicability requires a scope check', async () => {
  assert.equal((await guidance({ accounts: 'local' })).focus, 'release');
  assert.equal((await guidance({ accounts: 'unknown', checks: { ...assessment().checks, access: 'yes' } })).focus, 'access');
});

test('new, inherited, missing-core and maintenance paths stay distinct', async () => {
  assert.equal((await guidance({ mode: 'new' })).focus, 'start');
  assert.equal((await guidance({ stage: 'unknown' })).focus, 'inventory');
  for (const [key, focus] of [['running', 'start'], ['journey', 'journey'], ['data', 'data'], ['test', 'test']]) {
    assert.equal((await guidance({ accounts: 'local', checks: { ...assessment().checks, [key]: 'unsure' } })).focus, focus);
  }
  assert.equal((await guidance({ goal: 'live', checks: { ...assessment().checks, access: 'yes' } })).focus, 'recovery');
  assert.equal((await guidance({ goal: 'feature', accounts: 'local' })).focus, 'journey');
});

test('unknown or unsupported tools show only general resources, with no fake course completion', async () => {
  for (const plan of [{ stack: 'flutter' }, { stack: 'undecided' }, { stack: 'expo-ts', target: 'web' }]) {
    const result = await guidance({}, plan);
    assert.equal(result.generalOnly, true);
  }
  const f = fixture();
  f.store.saveAssessment(f.project.id, assessment());
  assert.equal(f.store.load()[0].build, undefined);
  assert.equal(f.store.load()[0].milestones, undefined);
});

test('resource matching returns existing IDs in stable order and explains empty matches', async () => {
  const result = await guidance();
  const read = file => JSON.parse(readFileSync(new URL(`../src/generated/${file}.json`, import.meta.url)));
  const library = buildLibrary(read('missions'), read('articles'));
  const { matchProjectResources } = await import('../src/projects/assessment.ts');
  const matches = matchProjectResources(library, result);
  assert.ok(matches.length > 0);
  assert.ok(matches.every(item => library.some(resource => resource.id === item.id)));
  assert.equal(matches[0].missionId, 5);
  assert.deepEqual(matchProjectResources(library, result), matches);
  assert.deepEqual(matchProjectResources([], result), []);
  const general = matchProjectResources(library, await guidance({}, { stack: 'flutter' }));
  assert.ok(general.every(item => item.missionId === undefined && item.kind !== 'glossary'));
});

test('local storage and other backends never lead directly into a Supabase-specific lab', async () => {
  const checks = { ...assessment().checks, data: 'unsure' };
  const local = await guidance({ accounts: 'local', checks }, { stack: 'expo-ts', data: 'sqlite', target: 'android' });
  assert.equal(local.focus, 'data');
  assert.equal(local.startHere, true);
  assert.notEqual(local.missionId, 3);
  const firebase = await guidance({}, { stack: 'expo-ts', data: 'firebase', target: 'android' });
  assert.equal(firebase.generalOnly, true);
});

test('a fresh assessment starts with uncertainty and a legacy project has no invented result', async () => {
  const { isAssessment, newAssessment, recommendProject } = await import('../src/projects/assessment.ts');
  const fresh = newAssessment();
  assert.equal(isAssessment(fresh), true);
  assert.ok(Object.values(fresh.checks).every(value => value === 'unsure'));
  assert.equal(recommendProject({}), null);
  assert.equal(recommendProject({ assessment: fresh }).focus, 'inventory');
});
