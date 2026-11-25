import assert from 'node:assert/strict';
import test from 'node:test';
import { createHomeSummary } from '../src/progress/home.ts';

const missions = [0, 1, 2].map(id => ({ id, quiz: [{ id: `q${id}`, kind: 'question' }, { id: `b${id}`, kind: 'boss' }] }));
const masteredAnswers = id => missions[id].quiz.map(({ id }) => ({ id, firstCorrectAt: 1, missed: false }));
const progress = (openedMissions = [], quizResults = []) => ({ checkpoints: [], openedMissions, quizResults });

test('new learners start with setup and no earned progress', () => {
  const home = createHomeSummary(missions, progress());
  assert.equal(home.mode, 'new');
  assert.equal(home.mission.id, 0);
  assert.equal(home.masteredCount, 0);
  assert.equal(home.totalXp, 0);
});

test('returning learners resume the last valid unfinished mission', () => {
  const home = createHomeSummary(missions, progress([0, 2, 99]));
  assert.equal(home.mode, 'returning');
  assert.equal(home.mission.id, 2);
});

test('after mastery the home action advances without awarding additional XP', () => {
  const home = createHomeSummary(missions, progress([0], masteredAnswers(0)));
  assert.equal(home.mode, 'mastered');
  assert.equal(home.mission.id, 1);
  assert.equal(home.masteredCount, 1);
  assert.equal(home.totalXp, 20);
});

test('mastering the last mission still offers earlier unfinished missions', () => {
  assert.equal(createHomeSummary(missions, progress([2], masteredAnswers(2))).mission.id, 0);
});

test('all mastered missions lead to review, including restored progress without opened history', () => {
  const home = createHomeSummary(missions, progress([], missions.flatMap(({ id }) => masteredAnswers(id))));
  assert.equal(home.mode, 'complete');
  assert.equal(home.masteredCount, 3);
  assert.equal(home.mission, undefined);
});

test('restored answers without history offer the next unmastered mission', () => {
  const home = createHomeSummary(missions, progress([], masteredAnswers(0)));
  assert.equal(home.mode, 'mastered');
  assert.equal(home.mission.id, 1);
});

test('empty curriculum offers review without crashing', () => {
  assert.equal(createHomeSummary([], progress()).mode, 'complete');
});
