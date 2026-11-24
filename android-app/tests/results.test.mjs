import assert from 'node:assert/strict';
import test from 'node:test';
import { createLearningResults } from '../src/progress/results.ts';

const quiz = [
  { id: 'q1', kind: 'question' },
  { id: 'q2', kind: 'question' },
  { id: 'boss', kind: 'boss' },
];

test('only correct answers earn XP and mastery requires the full knowledge check', () => {
  const results = createLearningResults([{ quiz }], [
    { id: 'q1', firstCorrectAt: 0, missed: true },
    { id: 'q2', firstCorrectAt: null, missed: true },
    { id: 'boss', firstCorrectAt: 1, missed: false },
  ]);
  assert.deepEqual(results.forMission(quiz), {
    xp: 20, knowledgeCorrect: 1, knowledgeTotal: 2, bossCleared: true, mastered: false,
  });
  assert.equal(results.totalXp, 20);
});

test('mastery counts repeat answers once and ignores XP from retired questions', () => {
  const results = createLearningResults([{ quiz }], [...quiz, quiz[0], { id: 'retired' }]
    .map(({ id }, index) => ({ id, firstCorrectAt: index, missed: false })));
  assert.deepEqual(results.forMission(quiz), {
    xp: 30, knowledgeCorrect: 2, knowledgeTotal: 2, bossCleared: true, mastered: true,
  });
  assert.equal(results.totalXp, 30);
});
