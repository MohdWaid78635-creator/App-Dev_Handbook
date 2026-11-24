import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCardStatus, createProjectStore } from '../src/projects/store.ts';

const step = { id: 's0-step1', proof: ['Node works', 'Git works'] };
const optional = { id: 's7-step2', proof: ['Purchase can be restored'] };

function fixture() {
  let data = null;
  const storage = { read: () => data, write: value => { data = value; } };
  const store = createProjectStore(storage);
  const [first] = store.save({ name: 'First', audience: '', goal: '' });
  const [, second] = store.save({ name: 'Second', audience: '', goal: '' });
  return { store, storage, first, second };
}

test('proof survives restart, is isolated to a project, and may be unchecked', () => {
  const { store, storage, first, second } = fixture();
  store.savePlan(first.id, { target: 'android' });
  store.setBuildProof(first.id, step, step.proof[0], true);
  store.setBuildProof(first.id, step, step.proof[0], true);
  const reopened = createProjectStore(storage);
  let [project, other] = reopened.load();
  assert.deepEqual(project.build[step.id].checked, ['Node works']);
  assert.equal(buildCardStatus(step, project.build[step.id]), 'in-progress');
  assert.equal(other.id, second.id);
  assert.equal(other.build, undefined);
  project = reopened.setBuildProof(first.id, step, step.proof[1], true);
  assert.equal(buildCardStatus(step, project.build[step.id]), 'verified');
  assert.equal(buildCardStatus({ ...step, proof: [...step.proof, 'New check'] }, project.build[step.id]), 'in-progress');
  project = reopened.setBuildProof(first.id, step, step.proof[0], false);
  assert.equal(buildCardStatus(step, project.build[step.id]), 'in-progress');
  assert.deepEqual(project.plan, { target: 'android' });
});

test('only optional cards can be marked not applicable, with a reason, and resume keeps proof', () => {
  const { store, first } = fixture();
  assert.throws(() => store.setBuildSkip(first.id, step, 'No accounts'), /optional/i);
  assert.throws(() => store.setBuildSkip(first.id, optional, '  '), /reason/i);
  assert.throws(() => store.setBuildProof(first.id, step, 'Unknown proof', true), /proof/i);
  store.setBuildProof(first.id, optional, optional.proof[0], true);
  let project = store.setBuildSkip(first.id, optional, ' No purchases ');
  assert.equal(project.build[optional.id].skipReason, 'No purchases');
  assert.equal(buildCardStatus(optional, project.build[optional.id]), 'not-applicable');
  assert.throws(() => store.setBuildProof(first.id, optional, optional.proof[0], false), /resume/i);
  project = store.setBuildSkip(first.id, optional, null);
  assert.equal(buildCardStatus(optional, project.build[optional.id]), 'verified');
});

test('a failed save preserves the last proof and a project rename keeps its evidence', () => {
  const { store, storage, first } = fixture();
  store.setBuildProof(first.id, step, step.proof[0], true);
  const failing = createProjectStore({ ...storage, write: () => { throw new Error('disk full'); } });
  assert.throws(() => failing.setBuildProof(first.id, step, step.proof[1], true), /disk full/);
  const [renamed] = store.save({ ...first, name: 'Renamed' }, first.id);
  assert.deepEqual(renamed.build[step.id].checked, [step.proof[0]]);
});
