import assert from 'node:assert/strict';
import test from 'node:test';

test('assessment answers survive backup restore without changing learning progress', async () => {
  const source = fixture();
  const [project] = source.projects.save({ name: 'Existing app', audience: '', goal: '' });
  const assessment = { version: 1, mode: 'existing', stage: 'live', goal: 'repair', accounts: 'local',
    checks: { running: 'yes', journey: 'yes', data: 'unsure', access: 'unsure', test: 'unsure', recovery: 'unsure' } };
  source.projects.saveAssessment(project.id, assessment);
  const destination = fixture();
  await destination.service.restore(source.service.exportBackup());
  assert.deepEqual(destination.projects.load()[0].assessment, assessment);
  assert.deepEqual(destination.progress.load(), source.progress.load());
});
import { backupKeys, createBackupService, readinessKey } from '../src/backup/service.ts';
import { createProgressStore } from '../src/progress/store.ts';
import { createProjectStore } from '../src/projects/store.ts';
import { createReadinessStore } from '../src/projects/readiness.ts';
import { createStudyStore } from '../src/study/store.ts';

const readers = { progress: createProgressStore, projects: createProjectStore, study: createStudyStore, readiness: createReadinessStore };

function fixture() {
  const map = new Map();
  const slot = key => ({ read: () => map.get(key) ?? null, write: value => map.set(key, value) });
  const storage = { read: key => slot(key).read(), keys: () => [...map.keys()], replaceAll: async pairs => {
    for (const [key, value] of pairs) map.set(key, value);
  } };
  const projects = createProjectStore(slot(backupKeys.projects));
  const progress = createProgressStore(slot(backupKeys.progress));
  const study = createStudyStore(slot(backupKeys.study));
  const readiness = id => createReadinessStore(slot(readinessKey(id)));
  return { slot, storage, projects, progress, study, readiness, service: createBackupService(storage, readers) };
}

test('full backups restore all device learning records and project evidence', async () => {
  const source = fixture();
  const [project] = source.projects.save({ name: 'Pocket Budget', audience: 'Students', goal: 'Log purchases' });
  source.projects.savePlan(project.id, { target: 'android' });
  source.projects.saveMilestone(project.id, 1, 'Talked to two learners.');
  source.projects.setBuildProof(project.id, { id: 's1-step1', proof: ['Write the goal'] }, 'Write the goal', true);
  source.progress.toggleCheckpoint('tools');
  source.progress.recordQuizAnswer('question', true, 10);
  source.study.saveDaily('2026-11-24', 'question', 1);
  source.study.gradeCard('API', true, '2026-11-24');
  source.readiness(project.id).open('Build 12');
  source.readiness(project.id).saveCheck('Build 12', 'auth:0', 'passed', 'Redacted test report');

  const destination = fixture();
  destination.slot('unrelated.setting').write('keep');
  destination.readiness(2).open('Old review');
  const backup = source.service.exportBackup(new Date('2026-11-24T12:00:00Z'));
  assert.deepEqual(destination.service.preview(backup), {
    createdAt: '2026-11-24T12:00:00.000Z', projects: 1, quizAnswers: 1, dailyAnswers: 1, flashcards: 1, releaseReviews: 1,
  });
  await destination.service.restore(backup);
  assert.deepEqual(destination.projects.load(), source.projects.load());
  assert.deepEqual(destination.progress.load(), source.progress.load());
  assert.deepEqual(destination.study.load(), source.study.load());
  assert.deepEqual(destination.readiness(1).load(), source.readiness(1).load());
  assert.deepEqual(destination.readiness(2).load(), []);
  assert.equal(destination.slot('unrelated.setting').read(), 'keep');
});

test('validates every section and rejects unsupported or orphaned records before writing', async () => {
  const target = fixture();
  target.progress.openMission(3);
  const invalid = JSON.parse(target.service.exportBackup());
  invalid.data.study = { version: 1, daily: [], cards: [{ id: 'API', due: 'invalid', level: 1 }] };
  await assert.rejects(target.service.restore(JSON.stringify(invalid)), /study/i);
  await assert.rejects(target.service.restore(JSON.stringify({ ...invalid, version: 2 })), /version/i);
  const orphan = JSON.parse(target.service.exportBackup());
  orphan.data.readiness.push({ projectId: 9, record: { version: 1, reviews: [] } });
  await assert.rejects(target.service.restore(JSON.stringify(orphan)), /project/i);
  assert.deepEqual(target.progress.load().openedMissions, [3]);
});

test('restore submits a single batch and a rejected batch leaves local data intact', async () => {
  const target = fixture();
  target.progress.openMission(3);
  let batches = 0;
  const failing = createBackupService({ ...target.storage, replaceAll: async () => { batches++; throw new Error('disk full'); } }, readers);
  await assert.rejects(failing.restore(fixture().service.exportBackup()), /disk full/);
  assert.equal(batches, 1);
  assert.deepEqual(target.progress.load().openedMissions, [3]);
});
