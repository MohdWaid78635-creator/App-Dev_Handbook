import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { asRole, createTestDatabase } from './test-db.mjs';
let db;
const releaseId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
before(async () => { db = await createTestDatabase(); });
after(async () => { await db?.close(); });

test('learners cannot read drafts or write content', async () => {
  await db.query('insert into public.content_releases (id, minimum_reader_version) values ($1,1)', [releaseId]);
  for (const kind of ['missions', 'articles', 'glossary', 'readiness']) {
    await db.query('insert into public.content_documents (release_id,kind,payload) values ($1,$2,$3)', [releaseId, kind, '[{"id":"sample"}]']);
  }
  await asRole(db, null, 'anon');
  assert.equal((await db.query('select * from public.content_releases')).rows.length, 0);
  assert.equal((await db.query('select * from public.content_documents')).rows.length, 0);
  await assert.rejects(db.query("insert into public.content_channels values ('stable',$1)", [releaseId]), /permission denied/);
});

test('trusted publication exposes all four documents and freezes the release', async () => {
  await db.exec('reset role');
  await db.query("update public.content_releases set state='published' where id=$1", [releaseId]);
  await db.query("insert into public.content_channels values ('stable',$1)", [releaseId]);
  await asRole(db, null, 'anon');
  assert.equal((await db.query('select * from public.content_documents')).rows.length, 4);
  assert.equal((await db.query('select * from public.content_channels')).rows.length, 1);
  await db.exec('reset role');
  await assert.rejects(db.query("update public.content_documents set payload='[]' where release_id=$1", [releaseId]), /immutable/);
  await assert.rejects(db.query("update public.content_releases set state='draft' where id=$1", [releaseId]), /immutable/);
});

test('a channel cannot expose an incomplete or unpublished release', async () => {
  await db.exec('reset role');
  const incomplete = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  await db.query('insert into public.content_releases(id, minimum_reader_version) values ($1,1)', [incomplete]);
  await assert.rejects(db.query("update public.content_releases set state='published' where id=$1", [incomplete]), /four|incomplete/i);
  await assert.rejects(db.query("update public.content_channels set release_id=$1 where name='stable'", [incomplete]), /published/);
});
