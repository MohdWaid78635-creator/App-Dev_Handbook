import { DatabaseSync } from 'node:sqlite';

export function sqlitePort(filename = ':memory:') {
  const native = new DatabaseSync(filename);
  let fail;
  const port = {
    exec: sql => native.exec(sql),
    run: (sql, ...args) => { if (fail?.(sql)) throw new Error('simulated disk failure'); native.prepare(sql).run(...args); },
    get: (sql, ...args) => native.prepare(sql).get(...args) ?? null,
    all: (sql, ...args) => native.prepare(sql).all(...args),
    transaction: work => {
      native.exec('BEGIN IMMEDIATE');
      try { const result = work(); native.exec('COMMIT'); return result; }
      catch (error) { native.exec('ROLLBACK'); throw error; }
    },
  };
  return { port, native, setFailure: value => { fail = value; }, close: () => native.close() };
}
