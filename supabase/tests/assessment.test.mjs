import assert from 'node:assert/strict';
import test from 'node:test';
import { asRole, createTestDatabase, rpc, users } from './test-db.mjs';

test('project assessment is accepted by the database while unknown versions and invalid checks are rejected', async t => {
  const db = await createTestDatabase(); t.after(() => db.close());
  const assessment = { version: 1, mode: 'existing', stage: 'live', goal: 'release', accounts: 'private',
    checks: { running: 'yes', journey: 'yes', data: 'yes', access: 'unsure', test: 'yes', recovery: 'yes' } };
  const payload = { name: 'Existing app', audience: '', goal: '', assessment };
  const valid = async value => (await db.query("select buildwisp_private.valid_payload('project', $1::jsonb) as valid", [JSON.stringify(value)])).rows[0].valid;
  assert.equal(await valid(payload), true);
  for (const change of [{ version: 2 }, { extra: 'hidden' }, { goal: 'unknown' }, { checks: { ...assessment.checks, access: 'na' } }, { checks: {} }]) {
    assert.equal(await valid({ ...payload, assessment: { ...assessment, ...change } }), false);
  }
  assert.equal(await valid({ name: 'Old app', audience: '', goal: '' }), true);
  await asRole(db, users.a);
  const request = { schemaVersion: 1, ownerId: users.a, operationId: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000001',
    kind: 'project', entityId: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000002', baseRevision: 0, workspaceEpoch: 0, action: 'upsert', payload };
  const saved = await rpc(db, 'apply_sync_mutation', request);
  assert.equal(saved.status, 'applied');
  assert.deepEqual(saved.record.payload.assessment, assessment);
  await asRole(db, users.b);
  assert.equal((await db.query('select count(*)::int as n from public.projects')).rows[0].n, 0);
});
