import assert from 'node:assert/strict';
import test from 'node:test';
import { createProjectStore, projectLimits } from '../src/projects/store.ts';

function memoryStorage() {
  let data = null;
  return { read: () => data, write: value => { data = value; } };
}

test('creates separate local projects and reopens them after restart', () => {
  const storage = memoryStorage();
  const store = createProjectStore(storage);
  assert.deepEqual(store.load(), []);
  const [budget] = store.save({ name: ' Pocket Budget ', audience: ' Students ', goal: ' Log spending ' });
  const [, habits] = store.save({ name: 'Habit Lab', audience: '', goal: '' });
  assert.notEqual(budget.id, habits.id);
  assert.deepEqual(createProjectStore(storage).load(), [
    { id: budget.id, name: 'Pocket Budget', audience: 'Students', goal: 'Log spending' },
    { id: habits.id, name: 'Habit Lab', audience: '', goal: '' },
  ]);
});

test('editing a project keeps its ID and leaves other projects alone', () => {
  const store = createProjectStore(memoryStorage());
  const [first] = store.save({ name: 'First', audience: '', goal: '' });
  const [, second] = store.save({ name: 'Second', audience: '', goal: '' });
  const updated = { ...first, name: 'Renamed', goal: 'Save a note' };
  assert.deepEqual(store.save(updated, first.id), [updated, second]);
  assert.throws(() => store.save(updated, second.id + 1), /could not be found/i);
  assert.deepEqual(store.load(), [updated, second]);
});

test('rejects blank or over-limit fields without writing', () => {
  const storage = memoryStorage();
  const store = createProjectStore(storage);
  const fields = { name: 'App', audience: '', goal: '' };
  assert.throws(() => store.save({ ...fields, name: '  ' }), /app name/i);
  for (const field of Object.keys(projectLimits)) {
    assert.throws(() => store.save({ ...fields, [field]: 'a'.repeat(projectLimits[field] + 1) }), /characters/i);
  }
  assert.equal(storage.read(), null);
});

test('keeps existing projects when stored data is invalid or a write fails', () => {
  const fields = { name: 'App', audience: '', goal: '' };
  const storage = memoryStorage();
  storage.write('{broken');
  assert.throws(() => createProjectStore(storage).save(fields), /could not be read/i);
  assert.equal(storage.read(), '{broken');
  storage.write(null);
  const [existing] = createProjectStore(storage).save(fields);
  const failing = createProjectStore({ ...storage, write: () => { throw new Error('disk full'); } });
  assert.throws(() => failing.save({ ...fields, name: 'New' }, existing.id), /disk full/);
  assert.deepEqual(createProjectStore(storage).load(), [existing]);
});
