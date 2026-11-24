import assert from 'node:assert/strict';
import test from 'node:test';
import { createProgressStore, getReviewQueue, REVIEW_INTERVAL_MS } from '../src/progress/store.ts';

const missions = [
  { id: 0, lessonTitle: 'First mission', quiz: [{ id: 'q1' }, { id: 'q2' }] },
  { id: 1, lessonTitle: 'Second mission', quiz: [{ id: 'boss' }, { id: 'unseen' }] },
];

function fixture() {
  let data = null;
  const storage = { read: () => data, write: value => { data = value; } };
  return { storage, store: createProgressStore(storage) };
}

test('misses lead review immediately and correct answers become due after one day', () => {
  const { store } = fixture();
  store.recordQuizAnswer('q1', true, 1);
  store.recordQuizAnswer('q2', false, 2);
  store.recordQuizAnswer('q2', true, 3);
  store.recordQuizAnswer('boss', false, 4);
  store.recordQuizAnswer('retired', false, 5);
  const queueIds = now => getReviewQueue(missions, store.load().quizResults, now).map(item => item.question.id);
  assert.deepEqual(queueIds(REVIEW_INTERVAL_MS), ['q2', 'boss']);
  assert.deepEqual(queueIds(REVIEW_INTERVAL_MS + 1), ['q2', 'boss', 'q1']);
});

test('review writes survive restart, preserve first XP, and a new miss becomes immediately due', () => {
  const { storage, store } = fixture();
  store.recordQuizAnswer('q1', false, 9);
  store.recordQuizAnswer('q1', true, 10);
  store.recordReviewSuccess('q1', 20);
  const reopened = createProgressStore(storage);
  const [result] = reopened.load().quizResults;
  assert.equal(result.firstCorrectAt, 10);
  assert.equal(result.missed, true);
  assert.equal(result.reviewDueAt, 20 + REVIEW_INTERVAL_MS);
  assert.equal(getReviewQueue(missions, [result], result.reviewDueAt - 1).length, 0);
  assert.equal(getReviewQueue(missions, [result], result.reviewDueAt).length, 1);
  reopened.recordQuizAnswer('q1', false, 21);
  assert.equal(getReviewQueue(missions, reopened.load().quizResults, 22).length, 1);
});

test('a correct review of a missed unanswered question records its first correct answer', () => {
  const { store } = fixture();
  store.recordQuizAnswer('boss', false, 5);
  const [result] = store.recordReviewSuccess('boss', 10).quizResults;
  assert.equal(result.firstCorrectAt, 10);
  assert.equal(result.reviewDueAt, 10 + REVIEW_INTERVAL_MS);
});
