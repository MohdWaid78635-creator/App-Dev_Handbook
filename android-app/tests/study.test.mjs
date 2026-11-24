import assert from 'node:assert/strict';
import test from 'node:test';
import { createStudyStore, dailyQuestion, dayKey, dueCards, studyStreak } from '../src/study/store.ts';

function fixture() {
  let data = null;
  const storage = { read: () => data, write: value => { data = value; } };
  return { storage, store: createStudyStore(storage) };
}

test('daily practice uses device dates and keeps the first answer for each day', () => {
  const { store, storage } = fixture();
  const today = dayKey(new Date(2026, 10, 24, 23, 50));
  const tomorrow = dayKey(new Date(2026, 10, 25, 0, 10));
  const questions = [{ id: 'first' }, { id: 'second' }];
  assert.equal(today, '2026-11-24');
  assert.notDeepEqual(dailyQuestion(questions, today), dailyQuestion(questions, tomorrow));
  store.saveDaily(today, 'second', 0);
  store.saveDaily(today, 'first', 1);
  const { daily } = createStudyStore(storage).load();
  assert.deepEqual(daily, [{ day: today, id: 'second', pick: 0 }]);
  assert.deepEqual(dailyQuestion(questions, today, daily[0]), questions[1]);
  assert.equal(dailyQuestion([questions[0]], today, daily[0]), undefined);
});

test('daily streaks cross month boundaries and break after a missed day', () => {
  const { store } = fixture();
  store.saveDaily('2026-11-30', 'first', 0);
  const { daily } = store.saveDaily('2026-12-01', 'second', 1);
  assert.equal(studyStreak(daily, '2026-12-02'), 2);
  assert.equal(studyStreak(daily, '2026-12-03'), 0);
});

test('flashcard grades persist, postpone known terms, and make misses immediately due', () => {
  const { store, storage } = fixture();
  const cards = [{ id: 'Cache' }, { id: 'API' }];
  store.gradeCard('Cache', true, '2026-11-24');
  const reopened = createStudyStore(storage);
  reopened.gradeCard('Cache', true, '2026-11-24');
  assert.deepEqual(reopened.load().cards, [{ id: 'Cache', level: 1, due: '2026-11-25' }]);
  assert.deepEqual(dueCards(cards, reopened.load().cards, '2026-11-24'), [cards[1]]);
  reopened.gradeCard('Cache', true, '2026-11-25');
  assert.equal(reopened.load().cards[0].due, '2026-11-28');
  const state = reopened.gradeCard('Cache', false, '2026-11-28');
  assert.equal(state.cards[0].level, 0);
  assert.deepEqual(dueCards(cards, state.cards, '2026-11-28', ['Cache']), [cards[1], cards[0]]);
});

test('unreadable practice and failed writes preserve existing data', () => {
  const { store, storage } = fixture();
  store.saveDaily('2026-11-24', 'first', 0);
  const saved = storage.read();
  const failing = createStudyStore({ ...storage, write: () => { throw new Error('disk full'); } });
  assert.throws(() => failing.gradeCard('API', true, '2026-11-24'), /disk full/);
  assert.equal(storage.read(), saved);
  storage.write('{broken');
  assert.throws(() => store.saveDaily('2026-11-25', 'second', 1));
  assert.equal(storage.read(), '{broken');
});
