import assert from 'node:assert/strict';
import test from 'node:test';
import { createProjectStore, projectSummary } from '../src/projects/store.ts';

const card = { id: 's1-step1', title: 'Define your audience', proof: ['Write a problem statement'] };

function fixture() {
  let raw = null;
  const storage = { read: () => raw, write: value => { raw = value; } };
  const store = createProjectStore(storage);
  const [first] = store.save({ name: 'First', audience: 'Students', goal: 'Track spending' });
  const [, second] = store.save({ name: 'Second', audience: '', goal: '' });
  return { store, storage, first, second };
}

test('saves, reopens, and clears milestone notes independently for each project', () => {
  const { store, storage, first, second } = fixture();
  store.savePlan(first.id, { target: 'android' });
  store.setBuildProof(first.id, card, card.proof[0], true);
  store.saveMilestone(first.id, 1, '  Interviewed two students.  ');
  store.saveMilestone(second.id, 1, 'Different audience');
  const reopened = createProjectStore(storage);
  const [recorded, other] = reopened.load();
  assert.deepEqual(recorded.milestones, { 1: 'Interviewed two students.' });
  assert.deepEqual(recorded.plan, { target: 'android' });
  assert.deepEqual(recorded.build[card.id].checked, card.proof);
  assert.deepEqual(other.milestones, { 1: 'Different audience' });
  assert.deepEqual(reopened.saveMilestone(first.id, 1, '').milestones, {});
});

test('rejects unknown milestones or oversized notes without losing saved evidence', () => {
  const { store, first } = fixture();
  store.saveMilestone(first.id, 8, 'The signed-out screen worked.');
  assert.throws(() => store.saveMilestone(first.id, 99, 'Unknown'), /milestone/i);
  assert.throws(() => store.saveMilestone(first.id, 8, 'x'.repeat(1201)), /1200/);
  assert.equal(store.load()[0].milestones[8], 'The signed-out screen worked.');
});

test('exports the selected project with honest milestone and build proof coverage', () => {
  const { store, first, second } = fixture();
  const optional = { id: 's7-step2', title: 'Test purchases', proof: ['Restore a purchase'] };
  store.setBuildProof(first.id, card, card.proof[0], true);
  store.setBuildSkip(first.id, optional, 'No purchases in this app');
  store.saveMilestone(second.id, 1, 'Other project only');
  const project = store.saveMilestone(first.id, 1, 'Interviewed students.');
  const summary = projectSummary(project, [card, optional], [{ label: 'Platform', value: 'Android' }]);
  assert.match(summary, /First/);
  assert.match(summary, /Students/);
  assert.match(summary, /1 of 4 milestones recorded/);
  assert.match(summary, /Test evidence\nNot recorded/);
  assert.match(summary, /Platform: Android/);
  assert.match(summary, /1 of 2 build cards.*1 not applicable/);
  assert.match(summary, /Write a problem statement/);
  assert.match(summary, /No purchases in this app/);
  assert.doesNotMatch(summary, /Other project only|Second/);
});
