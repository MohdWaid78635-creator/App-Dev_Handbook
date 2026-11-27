import { maxBackupBytes } from '../backup/service.ts';
import { parseJson } from '../validation/json.ts';
import { isDataKey, readOnlyBackup, validateEntries } from './records.ts';
import type { LocalDatabase } from './database.ts';

export type LegacySource = { read(key: string): string | null; keys(): string[] };
export function migrateLegacy(database: LocalDatabase, source: LegacySource): string {
  const previous = database.legacyNamespace();
  if (previous) return previous;
  const entries: [string, string][] = [];
  for (const key of source.keys()) {
    if (key.startsWith('academy.readiness.') && !isDataKey(key)) throw new Error('Invalid legacy project review key.');
    if (!isDataKey(key)) continue;
    const value = source.read(key);
    if (value !== null) entries.push([key, value]);
  }
  validateEntries(entries);
  const snapshot = new Map(entries);
  const backup = readOnlyBackup(key => snapshot.get(key) ?? null, () => [...snapshot.keys()]).exportBackup();
  parseJson(backup, maxBackupBytes);
  return database.installLegacy(entries);
}
