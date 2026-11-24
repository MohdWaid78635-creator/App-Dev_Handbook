import assert from 'node:assert/strict';
import test from 'node:test';
import { submitMatch, appendChoice, evaluateOrder, shuffledIndices } from '../src/practice/game.ts';

test('wrong matches retain the pair and correct ones advance only once', () => {
  const answers = ['UI', 'Backend', 'UI'];
  assert.deepEqual(submitMatch(answers, 0, 'Backend'), { next: 0, correct: false });
  assert.deepEqual(submitMatch(answers, 0, 'UI'), { next: 1, correct: true });
  assert.deepEqual(submitMatch(answers, 2, 'UI'), { next: 3, correct: true });
  assert.deepEqual(submitMatch(answers, 3, 'UI'), { next: 3, correct: false });
});

test('ordering ignores duplicate taps and distinguishes incomplete and incorrect attempts', () => {
  assert.deepEqual(appendChoice([2, 0], 2, 3), [2, 0]);
  assert.deepEqual(appendChoice([2, 0], 9, 3), [2, 0]);
  assert.equal(evaluateOrder([0, 1], 3), 'incomplete');
  assert.equal(evaluateOrder(appendChoice([1, 0], 2, 3), 3), 'incorrect');
  assert.equal(evaluateOrder([0, 1, 2], 3), 'correct');
});

test('ordering choices include every item without exposing the solution order', () => {
  const order = shuffledIndices(4, () => 0.99);
  assert.deepEqual([...order].sort((a, b) => a - b), [0, 1, 2, 3]);
  assert.notDeepEqual(order, [0, 1, 2, 3]);
});
