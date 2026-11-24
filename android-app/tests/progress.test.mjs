import assert from 'node:assert/strict';
import test from 'node:test';
import { createProgressStore } from '../src/progress/store.ts';

function memoryStorage() {
  let value = null;
  return {
    read: () => value,
    write: next => { value = next; },
  };
}

test('a fresh app starts without completed checkpoints or opened missions', () => {
  assert.deepEqual(createProgressStore(memoryStorage()).load(), {
    checkpoints: [],
    openedMissions: [],
    quizResults: [],
  });
});

test('reopening the store restores setup checks and the latest opened mission', () => {
  const storage = memoryStorage();
  const first = createProgressStore(storage);
  first.toggleCheckpoint('first-edit');
  first.openMission(0);
  first.openMission(6);
  first.openMission(0);
  const reopened = createProgressStore(storage);
  assert.deepEqual(reopened.load(), { checkpoints: ['first-edit'], openedMissions: [6, 0], quizResults: [] });
  assert.deepEqual(reopened.toggleCheckpoint('first-edit').checkpoints, []);
});

test('unreadable or unsupported progress is preserved for recovery', () => {
  let writes = 0;
  const storage = { read: () => '{broken', write: () => writes++ };
  const store = createProgressStore(storage);
  assert.throws(store.load, /progress/i);
  assert.throws(() => store.openMission(0), /progress/i);
  assert.equal(writes, 0);
});

test('a failed save surfaces the failure and leaves the previous record unchanged', () => {
  const backend = memoryStorage();
  createProgressStore(backend).openMission(2);
  const failing = createProgressStore({ ...backend, write: () => { throw new Error('disk full'); } });
  assert.throws(() => failing.openMission(6), /disk full/);
  assert.deepEqual(failing.load().openedMissions, [2]);
});

test('old progress loads and quiz results preserve first success and earlier misses on replay', () => {
  const storage = memoryStorage();
  storage.write(JSON.stringify({ version: 1, checkpoints: ['tools'], openedMissions: [3] }));
  const store = createProgressStore(storage);
  assert.deepEqual(store.load(), { checkpoints: ['tools'], openedMissions: [3], quizResults: [] });
  store.recordQuizAnswer('m3-backend-q1', false, 10);
  store.recordQuizAnswer('m3-backend-q1', true, 20);
  store.recordQuizAnswer('m3-backend-q1', true, 40);
  store.recordQuizAnswer('m3-boss', true, 50);
  assert.deepEqual(createProgressStore(storage).load().quizResults, [
    { id: 'm3-backend-q1', firstCorrectAt: 20, missed: true },
    { id: 'm3-boss', firstCorrectAt: 50, missed: false },
  ]);
});
