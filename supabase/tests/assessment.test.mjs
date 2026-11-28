import assert from 'node:assert/strict';
import test from 'node:test';
import { createTestDatabase } from './test-db.mjs';

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
});
