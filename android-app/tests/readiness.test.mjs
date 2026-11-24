import assert from 'node:assert/strict';
import test from 'node:test';
import { auditPrompt, checkPrompt, createReadinessStore, readinessCounts } from '../src/projects/readiness.ts';

const group = { title: 'Database security', id: 'database', checks: [
  { id: 'database:0', title: 'Access rules are enabled' },
  { id: 'database:1', title: 'Backups are rehearsed' },
] };

function memory() {
  let value = null;
  return { read: () => value, write: next => { value = next; } };
}

test('reviews reopen by build and leave other builds and project stores alone', () => {
  const storage = memory();
  const store = createReadinessStore(storage);
  const otherProject = createReadinessStore(memory());
  store.open(' Build 12 ');
  store.saveCheck('Build 12', group.checks[0].id, 'passed', ' Checked source and test report ');
  store.open('Build 13');
  const [first, second] = createReadinessStore(storage).load();
  assert.equal(first.build, 'Build 12');
  assert.deepEqual(first.items['database:0'], { status: 'passed', evidence: 'Checked source and test report' });
  assert.deepEqual(second.items, {});
  assert.deepEqual(otherProject.load(), []);
  assert.equal(store.open('Build 12').items['database:0'].status, 'passed');
  assert.equal(store.load().length, 2);
});

test('requires evidence for decisions and preserves the previous record on error', () => {
  const storage = memory();
  const store = createReadinessStore(storage);
  store.open('Build 12');
  assert.throws(() => store.saveCheck('Build 12', 'database:0', 'passed', ' '), /evidence/i);
  const blocked = store.saveCheck('Build 12', 'database:0', 'blocked', 'No test result');
  const failing = createReadinessStore({ ...storage, write: () => { throw new Error('disk full'); } });
  assert.throws(() => failing.saveCheck('Build 12', 'database:0', 'na', 'No database'), /disk full/);
  assert.deepEqual(store.load()[0], blocked);
  assert.deepEqual(readinessCounts([group], blocked.items), { pending: 1, passed: 0, blocked: 1, na: 0 });
  assert.deepEqual(store.saveCheck('Build 12', 'database:0', 'pending', '').items, {});
});

test('copyable prompts identify the chosen build and direct a defensive evidence review', () => {
  const project = 'My app';
  const build = 'Build 12';
  const prompt = checkPrompt(project, build, group, group.checks[0]);
  assert.match(prompt, /My app.*Build 12/);
  assert.match(prompt, /Access rules are enabled/);
  assert.match(prompt, /migrations.*access policies/i);
  assert.match(prompt, /read-only/i);
  assert.doesNotMatch(prompt, /Backups are rehearsed/);
  const audit = auditPrompt(project, build, [group]);
  assert.match(audit, /Access rules are enabled/);
  assert.match(audit, /Backups are rehearsed/);
});

test('the Android report prompt requests a redacted finding, fix, and verification tied to the build', () => {
  const check = { id: 'artifact:5', title: 'A static security report for the Android release was reviewed' };
  const prompt = checkPrompt('Habit Lab', 'Build 12', { id: 'artifact', title: 'Android release artifact checks', checks: [check] }, check);
  assert.match(prompt, /static report.*MobSF/i);
  assert.match(prompt, /build ID, finding, fix.*verification result/i);
  assert.match(prompt, /read-only/i);
});
