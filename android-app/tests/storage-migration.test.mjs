import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { sqlitePort } from './sqlite-helper.mjs';
import { createLocalDatabase } from '../src/storage/database.ts';
import { migrateLegacy } from '../src/storage/migrate.ts';
import { createScopeController } from '../src/storage/scope.ts';
import { createScopedStores } from '../src/storage/stores.ts';

const backup = JSON.parse(readFileSync(new URL('./fixtures/legacy-workspace.json', import.meta.url)));
const A = 'user:11111111-1111-4111-8111-111111111111';
const B = 'user:22222222-2222-4222-8222-222222222222';
function legacySource() {
  const map = new Map([
    ['academy.progress', JSON.stringify(backup.data.progress)], ['academy.projects', JSON.stringify(backup.data.projects)],
    ['academy.study', JSON.stringify(backup.data.study)], ['buildwisp.auth.session', 'never migrate tokens'],
    ...backup.data.readiness.map(item => [`academy.readiness.${item.projectId}`, JSON.stringify(item.record)]),
  ]);
  return { map, read: key => map.get(key) ?? null, keys: () => [...map.keys()] };
}
function fixture(t) {
  const sql = sqlitePort(); t.after(sql.close);
  const database = createLocalDatabase(sql.port);
  const scope = createScopeController(A);
  return { ...sql, database, scope, stores: () => createScopedStores(database, scope.capture()) };
}

test('one-time guest migration preserves all legacy records and never copies auth keys', async t => {
  const f = fixture(t); const source = legacySource(); const original = [...source.map];
  const namespace = migrateLegacy(f.database, source);
  assert.match(namespace, /^guest:/);
  const guest = createScopedStores(f.database, createScopeController(namespace).capture());
  assert.deepEqual(JSON.parse(guest.backupService.exportBackup(new Date(backup.createdAt))), backup);
  assert.equal(f.database.read(namespace, 'buildwisp.auth.session'), null);
  assert.equal(f.database.listIntents(namespace).length, 0);
  assert.deepEqual([...source.map], original);
  guest.projectStore.saveMilestone(1, 1, 'Changed after migration');
  assert.equal(migrateLegacy(f.database, source), namespace);
  assert.equal(guest.projectStore.load()[0].milestones[1], 'Changed after migration');
  assert.equal(f.database.recovery(namespace, 'legacy'), JSON.stringify(original.filter(([key]) => key.startsWith('academy.'))));
});

test('a failed migration rolls back records and its marker, then safely retries', t => {
  const f = fixture(t); const source = legacySource();
  f.setFailure(sql => sql.includes('INSERT INTO local_records'));
  assert.throws(() => migrateLegacy(f.database, source), /disk/);
  assert.equal(f.native.prepare('select count(*) as n from local_records').get().n, 0);
  assert.equal(f.native.prepare("select count(*) as n from local_metadata where key='legacy_migrated'").get().n, 0);
  f.setFailure(undefined);
  assert.match(migrateLegacy(f.database, source), /^guest:/);
});

test('corrupt/orphaned legacy data blocks migration and leaves the source intact', t => {
  const f = fixture(t); const source = legacySource();
  source.map.set('academy.projects', '{broken');
  const original = [...source.map];
  assert.throws(() => migrateLegacy(f.database, source));
  assert.deepEqual([...source.map], original);
  source.map.set('academy.projects', JSON.stringify(backup.data.projects));
  source.map.set('academy.readiness.99', JSON.stringify(backup.data.readiness[0].record));
  assert.throws(() => migrateLegacy(f.database, source), /project|orphan/i);
});

test('equal local IDs belong to separate accounts and old store callbacks cannot write after switching', t => {
  const f = fixture(t); const a = f.stores();
  a.projectStore.save({ name: 'Account A', audience: '', goal: '' });
  const aId = f.database.projectIdentity(A, 1);
  f.scope.select(B); const b = f.stores();
  assert.deepEqual(b.projectStore.load(), []);
  b.projectStore.save({ name: 'Account B', audience: '', goal: '' });
  assert.notEqual(f.database.projectIdentity(B, 1), aId);
  assert.throws(() => a.projectStore.saveMilestone(1, 1, 'stale callback'), /scope|account/i);
  assert.throws(() => a.projectStore.load(), /scope|account/i);
  assert.deepEqual(b.projectStore.load().map(project => project.name), ['Account B']);
  f.scope.select(A);
  assert.deepEqual(f.stores().projectStore.load().map(project => project.name), ['Account A']);
  assert.equal(f.database.projectIdentity(A, 1), aId);
  assert.throws(() => a.projectStore.load(), /scope|account/i, 'returning to A does not revive a prior lease');
});

test('saved records and their pending intents commit together or neither commits', t => {
  const f = fixture(t); const stores = f.stores();
  stores.projectStore.save({ name: 'Before', audience: '', goal: '' });
  const before = stores.projectStore.load(); const intents = f.database.listIntents(A);
  f.setFailure(sql => sql.includes('INSERT INTO local_outbox'));
  assert.throws(() => stores.projectStore.save({ name: 'After', audience: '', goal: '' }, 1), /disk/);
  f.setFailure(undefined);
  assert.deepEqual(stores.projectStore.load(), before);
  assert.deepEqual(f.database.listIntents(A), intents);
});

test('a newer snapshot cannot be cleared by acknowledgement of an older intent', t => {
  const f = fixture(t); const stores = f.stores();
  stores.projectStore.save({ name: 'First', audience: '', goal: '' });
  const [first] = f.database.listIntents(A);
  stores.projectStore.save({ name: 'Second', audience: '', goal: '' }, 1);
  const [second] = f.database.listIntents(A);
  assert.notEqual(first.id, second.id);
  f.database.acknowledge(A, first.id);
  assert.deepEqual(f.database.listIntents(A), [second]);
  f.database.acknowledge(B, second.id);
  assert.deepEqual(f.database.listIntents(A), [second]);
  f.database.acknowledge(A, second.id);
  assert.deepEqual(f.database.listIntents(A), []);
});

test('backups include only the captured account and restore pauses its sync atomically', async t => {
  const f = fixture(t); const stores = f.stores();
  stores.projectStore.save({ name: 'Before restore', audience: '', goal: '' });
  const original = stores.backupService.exportBackup(new Date(backup.createdAt));
  await stores.backupService.restore(JSON.stringify(backup));
  assert.deepEqual(JSON.parse(stores.backupService.exportBackup(new Date(backup.createdAt))), backup);
  assert.equal(f.database.isSyncPaused(A), true);
  assert.deepEqual(f.database.listIntents(A), []);
  assert.deepEqual(JSON.parse(f.database.recovery(A, 'restore')).data, JSON.parse(original).data);
  f.scope.select(B);
  assert.equal(f.stores().backupService.preview(f.stores().backupService.exportBackup()).projects, 0);
  assert.equal(f.database.isSyncPaused(B), false);
});

test('failed restore preserves both local data and pending intents', async t => {
  const f = fixture(t); const stores = f.stores();
  stores.projectStore.save({ name: 'Keep', audience: '', goal: '' });
  const before = stores.projectStore.load(); const intents = f.database.listIntents(A);
  f.setFailure(sql => sql.includes('INSERT INTO local_records'));
  await assert.rejects(stores.backupService.restore(JSON.stringify(backup)), /disk/);
  f.setFailure(undefined);
  assert.deepEqual(stores.projectStore.load(), before);
  assert.deepEqual(f.database.listIntents(A), intents);
  assert.equal(f.database.isSyncPaused(A), false);
});

test('data, project identities and pending changes survive closing and reopening SQLite', t => {
  const directory = mkdtempSync(join(tmpdir(), 'buildwisp-storage-')); const filename = join(directory, 'test.db');
  let sql = sqlitePort(filename); let database = createLocalDatabase(sql.port);
  t.after(() => { sql.close(); unlinkSync(filename); rmdirSync(directory); });
  const stores = createScopedStores(database, createScopeController(A).capture());
  stores.projectStore.save({ name: 'Persistent', audience: '', goal: '' });
  const identity = database.projectIdentity(A, 1); const intents = database.listIntents(A);
  sql.close(); sql = sqlitePort(filename); database = createLocalDatabase(sql.port);
  assert.equal(database.projectIdentity(A, 1), identity);
  assert.deepEqual(database.listIntents(A), intents);
  assert.equal(createScopedStores(database, createScopeController(A).capture()).projectStore.load()[0].name, 'Persistent');
});

test('unknown namespaces and non-learning keys fail closed', t => {
  const f = fixture(t);
  assert.throws(() => createScopeController('user:bad'));
  assert.throws(() => f.database.write(A, 'buildwisp.auth.session', 'secret'));
  assert.throws(() => f.database.write('guest:bad', 'academy.progress', '{}'));
  assert.throws(() => f.database.write(A, 'academy.progress', '{}'));
  assert.deepEqual(f.database.listIntents(A), []);
});
