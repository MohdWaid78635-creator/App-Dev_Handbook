import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

test('every mission opens with a lesson and a corresponding build task', () => {
  const importer = fileURLToPath(new URL('../scripts/import-curriculum.mjs', import.meta.url));
  execFileSync(process.execPath, [importer]);
  const missions = JSON.parse(readFileSync(new URL('../src/generated/missions.json', import.meta.url)));
  assert.equal(missions.length, 13);
  assert.equal(missions.flatMap(mission => mission.steps).length, 55);
  for (const mission of missions) {
    assert.ok(mission.lessonTitle && mission.lessons?.length, `Missing lesson for mission ${mission.id}`);
    assert.ok(mission.lessons.some(lesson => lesson.explain && lesson.cards.some(card => card.ex)),
      `Mission ${mission.id} needs a worked example and an explain-back question`);
    assert.ok(mission.practice?.length, `Missing practice for mission ${mission.id}`);
    assert.equal(mission.quiz?.length, 3, `Expected two questions and a boss in mission ${mission.id}`);
    assert.deepEqual(mission.quiz.map(question => question.kind), ['question', 'question', 'boss']);
    assert.ok(mission.quiz.every(question => question.options[question.answer] && question.explanation));
  }
  assert.ok(missions[0].lessons.some(lesson => lesson.cards.some(card => card.terms?.length)));
  assert.match(missions[8].lessons[0].cards[0].body, /expected result/i);
  assert.ok(missions[0].practice.some(exercise => exercise.type === 'match'));
  assert.ok(missions[8].practice.some(exercise => exercise.type === 'order'));
  const release = missions[9];
  assert.deepEqual(release.lessons.find(lesson => lesson.id === 'security-tools').cards.map(card => card.h),
    ['MobSF', 'Gitleaks', 'Dependabot', 'Semgrep', 'ZAP passive scanning', 'SafeLine']);
  const exercises = release.practice.filter(exercise => exercise.id.startsWith('security-tools-'));
  assert.deepEqual(exercises.map(exercise => exercise.type), ['match', 'order']);
  assert.equal(exercises[0].pairs.length, 3);
  const readiness = JSON.parse(readFileSync(new URL('../src/generated/readiness.json', import.meta.url)));
  assert.match(readiness.find(group => group.id === 'artifact').checks.find(check => check.id === 'artifact:5').title, /static security report/i);
});
