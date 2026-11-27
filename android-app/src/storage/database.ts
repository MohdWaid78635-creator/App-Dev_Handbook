import { backupKeys } from '../backup/service.ts';
import { createProjectStore } from '../projects/store.ts';
import { createReadinessStore } from '../projects/readiness.ts';
import { integer } from '../validation/json.ts';
import { namespace } from './scope.ts';
import { isDataKey, readOnlyBackup, validateEntries, validateRecord } from './records.ts';

export type SqlValue = string | number | null;
export type SqlPort = {
  exec(sql: string): void;
  run(sql: string, ...values: SqlValue[]): void;
  get<T>(sql: string, ...values: SqlValue[]): T | null;
  all<T>(sql: string, ...values: SqlValue[]): T[];
  transaction<T>(work: () => T): T;
};
export type LocalIntent = { id: string; namespace: string; key: string; value: string; sequence: number };

export function createLocalDatabase(sql: SqlPort) {
  sql.exec(`
    PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS local_metadata(key TEXT PRIMARY KEY,value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS local_workspaces(namespace TEXT PRIMARY KEY,paused INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS local_records(namespace TEXT NOT NULL REFERENCES local_workspaces(namespace),key TEXT NOT NULL,value TEXT NOT NULL,PRIMARY KEY(namespace,key));
    CREATE TABLE IF NOT EXISTS local_ids(namespace TEXT NOT NULL REFERENCES local_workspaces(namespace),kind TEXT NOT NULL,local_key TEXT NOT NULL,global_id TEXT NOT NULL,
      PRIMARY KEY(namespace,kind,local_key),UNIQUE(namespace,kind,global_id));
    CREATE TABLE IF NOT EXISTS local_outbox(sequence INTEGER PRIMARY KEY AUTOINCREMENT,id TEXT NOT NULL UNIQUE,namespace TEXT NOT NULL REFERENCES local_workspaces(namespace),
      key TEXT NOT NULL,value TEXT NOT NULL,UNIQUE(namespace,key));
  `);
  const metadata = (key: string) => sql.get<{ value: string }>('SELECT value FROM local_metadata WHERE key=?', key)?.value ?? null;
  const setMetadata = (key: string, value: string) => sql.run('INSERT INTO local_metadata(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', key, value);
  if (metadata('schema_version') !== null && metadata('schema_version') !== '1') throw new Error('Unsupported local database version.');
  setMetadata('schema_version', '1');
  function randomId(): string {
    return sql.get<{ id: string }>(`SELECT lower(hex(randomblob(4))||'-'||hex(randomblob(2))||'-4'||substr(hex(randomblob(2)),2)||'-'||
      substr('89ab',(random() & 3)+1,1)||substr(hex(randomblob(2)),2)||'-'||hex(randomblob(6))) AS id`)!.id;
  }
  const ensure = (scope: string) => { namespace(scope); sql.run('INSERT INTO local_workspaces(namespace) VALUES(?) ON CONFLICT DO NOTHING', scope); };
  const read = (scope: string, key: string) => {
    namespace(scope);
    if (!isDataKey(key)) return null;
    return sql.get<{ value: string }>('SELECT value FROM local_records WHERE namespace=? AND key=?', scope, key)?.value ?? null;
  };
  const keys = (scope: string) => { namespace(scope); return sql.all<{ key: string }>('SELECT key FROM local_records WHERE namespace=? ORDER BY key', scope).map(row => row.key); };
  function identity(scope: string, kind: string, key: string): string {
    const saved = sql.get<{ global_id: string }>('SELECT global_id FROM local_ids WHERE namespace=? AND kind=? AND local_key=?', scope, kind, key);
    if (saved) return saved.global_id;
    const id = randomId(); sql.run('INSERT INTO local_ids VALUES(?,?,?,?)', scope, kind, key, id); return id;
  }
  function mapEntries(scope: string, entries: [string, string][]) {
    if (!entries.some(([key]) => key === backupKeys.projects || key.startsWith('academy.readiness.'))) return;
    const map = new Map(entries);
    const slot = (key: string) => ({ read: () => map.get(key) ?? read(scope, key), write: (): never => { throw new Error('Read only.'); } });
    const projects = createProjectStore(slot(backupKeys.projects)).load();
    for (const project of projects) identity(scope, 'project', String(project.id));
    for (const [key] of entries) {
      if (!key.startsWith('academy.readiness.')) continue;
      const id = Number(key.slice('academy.readiness.'.length));
      for (const review of createReadinessStore(slot(key)).load()) identity(scope, 'readiness', JSON.stringify([id, review.build]));
    }
  }
  function insert(scope: string, key: string, value: string) {
    sql.run('INSERT INTO local_records(namespace,key,value) VALUES(?,?,?) ON CONFLICT(namespace,key) DO UPDATE SET value=excluded.value', scope, key, value);
  }
  return {
    read, keys,
    legacyNamespace: () => metadata('legacy_migrated'),
    installLegacy(entries: [string, string][]): string {
      validateEntries(entries);
      return sql.transaction(() => {
        const previous = metadata('legacy_migrated');
        if (previous) return namespace(previous);
        const scope = `guest:${randomId()}`;
        ensure(scope);
        for (const [key, value] of entries) insert(scope, key, value);
        mapEntries(scope, entries);
        setMetadata(`${scope}:recovery:legacy`, JSON.stringify(entries));
        setMetadata('legacy_migrated', scope);
        return scope;
      });
    },
    write(scope: string, key: string, value: string) {
      namespace(scope);
      sql.transaction(() => {
        validateRecord(key, value, key => read(scope, key));
        if (read(scope, key) === value) return;
        ensure(scope); insert(scope, key, value); mapEntries(scope, [[key, value]]);
        if (scope.startsWith('user:')) {
          sql.run('INSERT INTO local_outbox(id,namespace,key,value) VALUES(?,?,?,?) ON CONFLICT(namespace,key) DO UPDATE SET id=excluded.id,value=excluded.value', randomId(), scope, key, value);
        }
      });
    },
    replace(scope: string, entries: [string, string][]) {
      namespace(scope); validateEntries(entries);
      sql.transaction(() => {
        ensure(scope);
        const snapshot = readOnlyBackup(key => read(scope, key), () => keys(scope)).exportBackup();
        setMetadata(`${scope}:recovery:restore`, snapshot);
        sql.run('DELETE FROM local_outbox WHERE namespace=?', scope);
        sql.run('DELETE FROM local_ids WHERE namespace=?', scope);
        sql.run('DELETE FROM local_records WHERE namespace=?', scope);
        for (const [key, value] of entries) insert(scope, key, value);
        mapEntries(scope, entries);
        sql.run('UPDATE local_workspaces SET paused=1 WHERE namespace=?', scope);
      });
    },
    projectIdentity(scope: string, localId: number): string {
      namespace(scope); integer(localId, 'local project ID', 1);
      return sql.transaction(() => {
        const projects = createProjectStore({ read: () => read(scope, backupKeys.projects), write: () => {} }).load();
        if (!projects.some(project => project.id === localId)) throw new Error('Project unavailable in this scope.');
        return identity(scope, 'project', String(localId));
      });
    },
    listIntents(scope: string): LocalIntent[] {
      namespace(scope); return sql.all<LocalIntent>('SELECT id,namespace,key,value,sequence FROM local_outbox WHERE namespace=? ORDER BY sequence', scope);
    },
    acknowledge(scope: string, id: string) {
      namespace(scope); sql.run('DELETE FROM local_outbox WHERE namespace=? AND id=?', scope, id);
    },
    isSyncPaused(scope: string) { namespace(scope); return sql.get<{ paused: number }>('SELECT paused FROM local_workspaces WHERE namespace=?', scope)?.paused === 1; },
    recovery(scope: string, type: 'legacy' | 'restore') { namespace(scope); return metadata(`${scope}:recovery:${type}`); },
  };
}
export type LocalDatabase = ReturnType<typeof createLocalDatabase>;
