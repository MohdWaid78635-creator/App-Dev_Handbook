import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';

export const users = { a: '11111111-1111-4111-8111-111111111111', b: '22222222-2222-4222-8222-222222222222' };
export async function createTestDatabase() {
  const db = new PGlite();
  // Test scaffolding only. Supabase provides these roles/schema/functions in a real stack.
  await db.exec(`
    create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    grant usage on schema public, auth to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
    insert into auth.users values ('${users.a}'), ('${users.b}');
  `);
  const directory = new URL('../migrations/', import.meta.url);
  let files = [];
  try { files = await readdir(directory); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  for (const filename of files.filter(file => file.endsWith('.sql')).sort()) {
    try { await db.exec(await readFile(new URL(filename, directory), 'utf8')); }
    catch (error) { await db.close(); throw new Error(`${filename}: ${error.message} (${error.code})`); }
  }
  return db;
}
export async function asRole(db, user, role = 'authenticated') {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [user ?? '']);
  await db.exec(`set role ${role}`);
}
export async function rpc(db, name, request) {
  const { rows } = await db.query(`select public.${name}($1::jsonb) as result`, [JSON.stringify(request)]);
  return rows[0].result;
}
