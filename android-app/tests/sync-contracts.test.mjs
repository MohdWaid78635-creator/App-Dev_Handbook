import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { contractLimits, parseMutation, parseCloudRecord, parseSyncResponse, parseProjectMappings, parseImportReceipt } from '../src/sync/contracts.ts';

const backup = JSON.parse(readFileSync(new URL('./fixtures/legacy-workspace.json', import.meta.url)));
const owner = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const operationId = '33333333-3333-4333-8333-333333333333';
const projectId = '44444444-4444-4444-8444-444444444444';
const reviewId = '55555555-5555-4555-8555-555555555555';
const without = (value, key) => Object.fromEntries(Object.entries(value).filter(([name]) => name !== key));
const payloads = {
  learning: without(backup.data.progress, 'version'), study: without(backup.data.study, 'version'),
  project: without(backup.data.projects.projects[0], 'id'),
  readiness: { projectId, review: backup.data.readiness[0].record.reviews[0] },
};
function mutation(kind = 'project') {
  return { schemaVersion: 1, ownerId: owner, operationId, kind,
    entityId: kind === 'learning' || kind === 'study' ? 'singleton' : kind === 'project' ? projectId : reviewId,
    baseRevision: 0, action: 'upsert', payload: structuredClone(payloads[kind]) };
}
function record(kind = 'project') {
  const input = mutation(kind);
  return { schemaVersion: 1, ownerId: owner, kind, entityId: input.entityId,
    revision: 1, workspaceRevision: 1, payload: input.payload, deletedAt: null };
}
const mapping = { namespace: `user:${owner}`, localProjectId: 1, cloudProjectId: projectId };

test('all current saved-data payloads fit the cloud contract without rewriting their values', () => {
  for (const kind of Object.keys(payloads)) {
    const input = mutation(kind);
    assert.deepEqual(parseMutation(JSON.stringify(input), owner), input);
    assert.deepEqual(parseCloudRecord(JSON.stringify(record(kind)), owner), record(kind));
  }
});

test('mutation boundary rejects wrong ownership, identity, revision, version, action and hidden fields', () => {
  for (const change of [
    value => { value.ownerId = other; }, value => { value.ownerId = 'not-a-uuid'; },
    value => { value.schemaVersion = 2; }, value => { value.operationId = ''; },
    value => { value.entityId = '1'; }, value => { value.baseRevision = -1; },
    value => { value.baseRevision = 0.5; }, value => { value.baseRevision = Number.MAX_SAFE_INTEGER + 1; },
    value => { value.kind = 'unknown'; }, value => { value.action = 'replace-all'; },
    value => { value.access_token = 'never-accept-this'; }, value => { delete value.payload; },
    value => { value.payload.id = 1; }, value => { value.payload.plan = []; },
    value => { value.payload.name = ''; }, value => { value.payload = null; },
  ]) {
    const input = mutation(); change(input);
    assert.throws(() => parseMutation(JSON.stringify(input), owner));
  }
  const singleton = mutation('learning'); singleton.entityId = projectId;
  assert.throws(() => parseMutation(JSON.stringify(singleton), owner));
  assert.throws(() => parseMutation('{}', 'bad-owner'));
  for (const text of ['null', '[]', 'oops']) assert.throws(() => parseMutation(text, owner));
});

test('domain validation still rejects evidence-free decisions, orphan identity and invalid study dates', () => {
  const review = mutation('readiness'); review.payload.review.items['auth:0'].evidence = '';
  assert.throws(() => parseMutation(JSON.stringify(review), owner));
  review.payload.projectId = 'local-project-1';
  assert.throws(() => parseMutation(JSON.stringify(review), owner));
  const study = mutation('study'); study.payload.cards[0].due = '2026-02-30';
  assert.throws(() => parseMutation(JSON.stringify(study), owner));
  const learning = mutation('learning'); learning.payload.checkpoints.push('unknown');
  assert.throws(() => parseMutation(JSON.stringify(learning), owner));
});

test('delete intents and server tombstones require an existing revision and no payload', () => {
  for (const kind of ['project', 'readiness']) {
    const input = { ...mutation(kind), action: 'delete', payload: null, baseRevision: 1 };
    assert.deepEqual(parseMutation(JSON.stringify(input), owner), input);
    assert.throws(() => parseMutation(JSON.stringify({ ...input, baseRevision: 0 }), owner));
    const tombstone = { ...record(kind), payload: null, deletedAt: '2026-11-27T03:30:00.000Z' };
    assert.deepEqual(parseCloudRecord(JSON.stringify(tombstone), owner), tombstone);
    assert.throws(() => parseCloudRecord(JSON.stringify({ ...tombstone, payload: payloads[kind] }), owner));
    assert.throws(() => parseCloudRecord(JSON.stringify({ ...tombstone, deletedAt: 'yesterday' }), owner));
  }
  for (const kind of ['learning', 'study']) {
    assert.throws(() => parseMutation(JSON.stringify({ ...mutation(kind), action: 'delete', payload: null, baseRevision: 1 }), owner));
    assert.throws(() => parseCloudRecord(JSON.stringify({ ...record(kind), payload: null, deletedAt: '2026-11-27T03:30:00.000Z' }), owner));
  }
  for (const changes of [{ revision: 0 }, { workspaceRevision: 0 }, { revision: 2, workspaceRevision: 1 }, { payload: null }]) {
    assert.throws(() => parseCloudRecord(JSON.stringify({ ...record(), ...changes }), owner));
  }
});

test('sync responses are bound to the request and distinguish applied, conflict and rejected', () => {
  const request = mutation();
  for (const status of ['applied', 'conflict']) {
    const key = status === 'applied' ? 'record' : 'current';
    const response = { schemaVersion: 1, status, operationId, [key]: record() };
    assert.deepEqual(parseSyncResponse(JSON.stringify(response), request), response);
    for (const change of [
      value => { value.operationId = other; }, value => { value[key].ownerId = other; },
      value => { value[key].entityId = other; }, value => { value[key].kind = 'study'; },
      value => { value.schemaVersion = 2; }, value => { value.extra = true; },
    ]) {
      const bad = structuredClone(response); change(bad);
      assert.throws(() => parseSyncResponse(JSON.stringify(bad), request));
    }
    assert.throws(() => parseSyncResponse(JSON.stringify(response), { ...request, baseRevision: 1 }));
  }
  for (const code of ['invalid', 'forbidden', 'quota', 'unsupported']) {
    const response = { schemaVersion: 1, status: 'rejected', operationId, code };
    assert.deepEqual(parseSyncResponse(JSON.stringify(response), request), response);
  }
  assert.throws(() => parseSyncResponse(JSON.stringify({ schemaVersion: 1, status: 'rejected', operationId, code: 'whatever' }), request));
  assert.throws(() => parseSyncResponse(JSON.stringify({ schemaVersion: 1, status: 'unknown', operationId }), request));
});

test('project mappings isolate equal numeric IDs across namespaces and reject ambiguous mappings', () => {
  assert.deepEqual(parseProjectMappings(JSON.stringify([mapping]), `user:${owner}`), [mapping]);
  const guest = { ...mapping, namespace: `guest:${other}`, cloudProjectId: other };
  assert.deepEqual(parseProjectMappings(JSON.stringify([guest]), `guest:${other}`), [guest]);
  for (const rows of [
    [mapping, mapping], [mapping, { ...mapping, localProjectId: 2 }],
    [{ ...mapping, namespace: `user:${other}` }], [{ ...mapping, localProjectId: 0 }],
    [{ ...mapping, localProjectId: 1.5 }], [{ ...mapping, cloudProjectId: '1' }],
    [{ ...mapping, extra: 'secret' }],
  ]) assert.throws(() => parseProjectMappings(JSON.stringify(rows), `user:${owner}`));
  assert.throws(() => parseProjectMappings('{}', `user:${owner}`));
  assert.throws(() => parseProjectMappings('[]', 'user:bad'));
});

test('import receipts match the account, source dataset and operation before marking import complete', () => {
  const expected = { ownerId: owner, guestDatasetId: other, operationId };
  const receipt = { schemaVersion: 1, ...expected, workspaceRevision: 1, mappings: [mapping] };
  assert.deepEqual(parseImportReceipt(JSON.stringify(receipt), expected), receipt);
  for (const changes of [{ ownerId: other }, { guestDatasetId: owner }, { operationId: other },
    { workspaceRevision: 0 }, { schemaVersion: 2 }, { mappings: [mapping, mapping] }, { extra: 'unexpected' }]) {
    assert.throws(() => parseImportReceipt(JSON.stringify({ ...receipt, ...changes }), expected));
  }
});

test('contract limits count UTF-8 bytes and reject oversized or malformed input', () => {
  const input = mutation(); input.payload.goal = '😀'.repeat(contractLimits.mutationBytes / 3);
  assert.throws(() => parseMutation(JSON.stringify(input), owner), /size|large|limit/i);
  assert.throws(() => parseCloudRecord(' '.repeat(contractLimits.mutationBytes + 1), owner), /size|large|limit/i);
  assert.throws(() => parseProjectMappings('not json', `user:${owner}`));
});
