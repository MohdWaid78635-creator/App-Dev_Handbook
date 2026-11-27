import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { readFileSync } from 'node:fs';
import { asRole, createTestDatabase, rpc, users } from './test-db.mjs';

const legacy = JSON.parse(readFileSync(new URL('../../android-app/tests/fixtures/legacy-workspace.json', import.meta.url)));
const strip = (value, key) => Object.fromEntries(Object.entries(value).filter(([name]) => name !== key));
const id = index => `aaaaaaaa-aaaa-4aaa-8aaa-${String(index).padStart(12, '0')}`;
const project = strip(legacy.data.projects.projects[0], 'id');
let db;
before(async () => { db = await createTestDatabase(); });
after(async () => { await db?.close(); });
let sequence = 1;
function mutation(kind = 'project', overrides = {}) {
  return { schemaVersion: 1, ownerId: users.a, operationId: id(sequence++), kind,
    entityId: kind === 'learning' || kind === 'study' ? 'singleton' : id(100), baseRevision: 0, workspaceEpoch: 0,
    action: 'upsert', payload: structuredClone(project), ...overrides };
}

test('all private tables enforce RLS and deny direct client writes', async () => {
  const expected = ['user_workspaces', 'learning_state', 'study_state', 'projects', 'release_reviews', 'sync_receipts', 'guest_imports'];
  const { rows } = await db.query("select relname, relrowsecurity from pg_class where relnamespace='public'::regnamespace and relname=any($1::text[])", [expected]);
  assert.equal(rows.length, expected.length);
  assert.ok(rows.every(row => row.relrowsecurity));
  for (const table of expected) {
    const { rows: grants } = await db.query("select has_table_privilege('authenticated',$1,'INSERT,UPDATE,DELETE,TRUNCATE') as writes", [`public.${table}`]);
    assert.equal(grants[0].writes, false, `${table} cannot bypass RPC validation`);
  }
});

test('owner can commit a project while another user and anonymous readers see no private records', async () => {
  await asRole(db, users.a);
  const request = mutation();
  const saved = await rpc(db, 'apply_sync_mutation', request);
  assert.equal(saved.status, 'applied');
  assert.equal(saved.record.ownerId, users.a);
  assert.deepEqual(saved.record.payload, project);
  assert.equal((await db.query('select count(*)::int as n from public.projects')).rows[0].n, 1);
  await asRole(db, users.b);
  assert.equal((await db.query('select count(*)::int as n from public.projects')).rows[0].n, 0);
  await assert.rejects(rpc(db, 'apply_sync_mutation', mutation()), /owner/i);
  await asRole(db, null, 'anon');
  await assert.rejects(db.query('select * from public.projects'), /permission denied/);
  await assert.rejects(rpc(db, 'apply_sync_mutation', request), /permission denied/);
});

test('retry returns the exact receipt; changed input cannot reuse its operation ID', async () => {
  await asRole(db, users.a);
  const current = (await rpc(db, 'workspace_snapshot', {})).records.find(row => row.kind === 'project');
  const request = mutation('project', { baseRevision: current.revision, payload: { ...project, goal: 'Changed once' } });
  const saved = await rpc(db, 'apply_sync_mutation', request);
  assert.equal(saved.status, 'applied');
  assert.deepEqual(await rpc(db, 'apply_sync_mutation', request), saved);
  await assert.rejects(rpc(db, 'apply_sync_mutation', { ...request, payload: project }), /operation|receipt/i);
});

test('stale writes return an owner-only conflict without replacing the saved record', async () => {
  await asRole(db, users.a);
  const stale = mutation();
  const result = await rpc(db, 'apply_sync_mutation', stale);
  assert.equal(result.status, 'conflict');
  assert.equal(result.current.payload.goal, 'Changed once');
  assert.ok(result.current.revision > stale.baseRevision);
  const invalid = await rpc(db, 'apply_sync_mutation', mutation('project', { baseRevision: 100000 }));
  assert.equal(invalid.status, 'rejected');
});

test('all saved data kinds validate on the server, including evidence and dates', async () => {
  await asRole(db, users.a);
  for (const [kind, payload] of [
    ['learning', strip(legacy.data.progress, 'version')], ['study', strip(legacy.data.study, 'version')],
    ['readiness', { projectId: id(100), review: legacy.data.readiness[0].record.reviews[0] }],
  ]) {
    const request = mutation(kind, { entityId: kind === 'readiness' ? id(101) : 'singleton', payload });
    assert.equal((await rpc(db, 'apply_sync_mutation', request)).status, 'applied', kind);
  }
  const invalidReview = { projectId: id(100), review: { build: 'bad', items: { 'auth:0': { status: 'passed', evidence: '' } } } };
  const badInputs = [
    mutation('readiness', { entityId: id(102), payload: invalidReview }),
    mutation('study', { payload: { daily: [{ day: '2026-02-30', id: 'q', pick: 0 }], cards: [] } }),
    mutation('learning', { payload: { checkpoints: ['unknown'], openedMissions: [], quizResults: [] } }),
    mutation('project', { payload: { ...project, name: '' } }),
    mutation('project', { payload: { ...project, build: { 's1-step1': { checked: [], skipReason: 'not optional' } } } }),
    mutation('project', { ownerId: users.b }), mutation('project', { baseRevision: -1 }),
    mutation('project', { schemaVersion: 2 }), mutation('project', { extra: true }),
  ];
  for (const request of badInputs) {
    try { assert.equal((await rpc(db, 'apply_sync_mutation', request)).status, 'rejected'); }
    catch (error) { if (!/owner/.test(error.message)) throw error; }
  }
});

test('review ownership and project/build uniqueness cannot be bypassed', async () => {
  await asRole(db, users.b);
  const foreign = mutation('readiness', { ownerId: users.b, entityId: id(103), payload: {
    projectId: id(100), review: { build: 'foreign', items: {} },
  } });
  assert.equal((await rpc(db, 'apply_sync_mutation', foreign)).status, 'rejected');
  await asRole(db, users.a);
  const duplicate = mutation('readiness', { entityId: id(104), payload: { projectId: id(100), review: legacy.data.readiness[0].record.reviews[0] } });
  assert.equal((await rpc(db, 'apply_sync_mutation', duplicate)).status, 'rejected');
});

test('project deletion also tombstones reviews and prevents orphan review writes', async () => {
  await asRole(db, users.a);
  const snapshot = await rpc(db, 'workspace_snapshot', {});
  const current = snapshot.records.find(row => row.kind === 'project');
  const result = await rpc(db, 'apply_sync_mutation', mutation('project', { action: 'delete', payload: null, baseRevision: current.revision }));
  assert.equal(result.status, 'applied');
  assert.equal(result.record.payload, null);
  const deleted = (await rpc(db, 'workspace_snapshot', {})).records.filter(row => row.kind === 'readiness');
  assert.ok(deleted.length > 0 && deleted.every(row => row.deletedAt && row.payload === null));
});

test('transactional batch import validates the complete source and retries without duplicate projects', async () => {
  await asRole(db, users.b);
  const request = { schemaVersion: 1, ownerId: users.b, operationId: id(200), mode: 'import', guestDatasetId: id(201),
    expectedWorkspaceRevision: 0, mappings: [{ namespace: `user:${users.b}`, localProjectId: 1, cloudProjectId: id(202) }],
    mutations: [mutation('project', { ownerId: users.b, operationId: id(203), entityId: id(202) })] };
  const receipt = await rpc(db, 'commit_workspace_batch', request);
  assert.equal(receipt.mappings[0].cloudProjectId, id(202));
  assert.deepEqual(await rpc(db, 'commit_workspace_batch', request), receipt);
  assert.equal((await db.query('select count(*)::int as n from public.projects')).rows[0].n, 1);
  await assert.rejects(rpc(db, 'commit_workspace_batch', { ...request, operationId: id(204) }), /import/i);
});

test('a batch rolls back all writes when a later payload is invalid', async () => {
  await asRole(db, users.b);
  const snapshot = await rpc(db, 'workspace_snapshot', {});
  const request = { schemaVersion: 1, ownerId: users.b, operationId: id(210), mode: 'import', guestDatasetId: id(211),
    expectedWorkspaceRevision: snapshot.workspaceRevision,
    mappings: [{ namespace: `user:${users.b}`, localProjectId: 1, cloudProjectId: id(212) }, { namespace: `user:${users.b}`, localProjectId: 2, cloudProjectId: id(213) }],
    mutations: [mutation('project', { ownerId: users.b, entityId: id(212) }), mutation('project', { ownerId: users.b, entityId: id(213), payload: { ...project, name: '' } })] };
  await assert.rejects(rpc(db, 'commit_workspace_batch', request), /batch|invalid/i);
  assert.deepEqual(await rpc(db, 'workspace_snapshot', {}), snapshot);
});

test('replacement is conditional, tombstones removed rows, and stale clients cannot resurrect them', async () => {
  await asRole(db, users.b);
  const before = await rpc(db, 'workspace_snapshot', {});
  const request = { schemaVersion: 1, ownerId: users.b, operationId: id(220), mode: 'replace',
    expectedWorkspaceRevision: before.workspaceRevision, mappings: [], mutations: [] };
  const receipt = await rpc(db, 'commit_workspace_batch', request);
  assert.ok(receipt.workspaceRevision > before.workspaceRevision);
  assert.deepEqual(await rpc(db, 'commit_workspace_batch', request), receipt);
  assert.equal((await rpc(db, 'apply_sync_mutation', mutation('project', { ownerId: users.b, entityId: id(202), workspaceEpoch: 1 }))).status, 'conflict');
  await assert.rejects(rpc(db, 'commit_workspace_batch', { ...request, operationId: id(221) }), /revision|stale/i);
});

test('replacement invalidates even offline projects that have never reached the server', async () => {
  await asRole(db, users.b);
  const result = await rpc(db, 'apply_sync_mutation', mutation('project', { ownerId: users.b, entityId: id(300) }));
  assert.equal(result.status, 'rejected');
  assert.equal(result.code, 'stale_workspace');
});
