import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { backupKeys, createBackupService, readinessKey } from '../src/backup/service.ts';
import { createProgressStore } from '../src/progress/store.ts';
import { createProjectStore } from '../src/projects/store.ts';
import { createReadinessStore } from '../src/projects/readiness.ts';
import { createStudyStore } from '../src/study/store.ts';

const text = readFileSync(new URL('./fixtures/legacy-workspace.json', import.meta.url), 'utf8');
const legacy = JSON.parse(text);
const readers = { progress: createProgressStore, projects: createProjectStore, study: createStudyStore, readiness: createReadinessStore };

test('frozen legacy workspace restores and reopens every record without changing the source', async () => {
  const map = new Map([['unrelated.setting', 'keep'], [readinessKey(99), '{"version":1,"reviews":[]}']]);
  const storage = { read: key => map.get(key) ?? null, keys: () => [...map.keys()], replaceAll: async pairs => {
    for (const [key, value] of pairs) map.set(key, value);
  } };
  const service = createBackupService(storage, readers);
  assert.deepEqual(service.preview(text), {
    createdAt: '2026-11-27T03:30:00.000Z', projects: 2, quizAnswers: 3, dailyAnswers: 2, flashcards: 2, releaseReviews: 3,
  });
  await service.restore(text);
  const slot = key => ({ read: () => storage.read(key), write: () => { throw new Error('read only'); } });
  const projects = createProjectStore(slot(backupKeys.projects)).load();
  assert.deepEqual(projects, legacy.data.projects.projects);
  assert.deepEqual(createProgressStore(slot(backupKeys.progress)).load(), {
    checkpoints: legacy.data.progress.checkpoints, openedMissions: legacy.data.progress.openedMissions,
    quizResults: legacy.data.progress.quizResults,
  });
  const study = createStudyStore(slot(backupKeys.study)).load();
  assert.deepEqual(study, { daily: legacy.data.study.daily, cards: legacy.data.study.cards });
  assert.equal(study.daily[0].pick, 1, 'first daily answer survives a later attempted replacement');
  assert.equal(projects[1].milestones[11], undefined, 'a cleared milestone stays cleared');
  assert.equal(Object.values(projects[0].build)[0].checked.length, 1, 'unchecked proof stays unchecked');
  for (const item of legacy.data.readiness) {
    assert.deepEqual(createReadinessStore(slot(readinessKey(item.projectId))).load(), item.record.reviews);
  }
  assert.deepEqual(JSON.parse(service.exportBackup(new Date(legacy.createdAt))), legacy);
  assert.equal(storage.read('unrelated.setting'), 'keep');
  assert.equal(readFileSync(new URL('./fixtures/legacy-workspace.json', import.meta.url), 'utf8'), text);
});

test('invalid frozen legacy sections fail before any replacement batch', async () => {
  for (const mutate of [
    data => { data.projects.projects[1].id = data.projects.projects[0].id; },
    data => { data.readiness[0].projectId = 99; },
    data => { data.readiness[0].record.reviews[0].items['auth:0'].evidence = ''; },
    data => { data.study.cards[0].due = '2026-02-30'; },
  ]) {
    const invalid = structuredClone(legacy);
    mutate(invalid.data);
    let writes = 0;
    const service = createBackupService({ read: () => null, keys: () => [], replaceAll: async () => { writes++; } }, readers);
    await assert.rejects(service.restore(JSON.stringify(invalid)));
    assert.equal(writes, 0);
  }
});
