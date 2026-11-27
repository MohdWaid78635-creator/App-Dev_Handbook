import { createBackupService, backupKeys } from '../backup/service.ts';
import { createProgressStore } from '../progress/store.ts';
import { createProjectStore } from '../projects/store.ts';
import { createReadinessStore } from '../projects/readiness.ts';
import { createStudyStore } from '../study/store.ts';

export const readers = { progress: createProgressStore, projects: createProjectStore, readiness: createReadinessStore, study: createStudyStore };
export const isDataKey = (key: string) => Object.values(backupKeys).some(value => value === key) || /^academy\.readiness\.[1-9]\d*$/.test(key);
export function validateRecord(key: string, value: string, read: (key: string) => string | null): void {
  const slot = { read: () => value, write: (): never => { throw new Error('Validation is read only.'); } };
  if (key === backupKeys.progress) createProgressStore(slot).load();
  else if (key === backupKeys.projects) createProjectStore(slot).load();
  else if (key === backupKeys.study) createStudyStore(slot).load();
  else if (/^academy\.readiness\.[1-9]\d*$/.test(key)) {
    const reviews = createReadinessStore(slot).load();
    const projects = createProjectStore({ ...slot, read: () => read(backupKeys.projects) }).load();
    if (reviews.length && !projects.some(project => String(project.id) === key.slice('academy.readiness.'.length))) {
      throw new Error('Orphaned release review: matching project is missing.');
    }
  } else throw new Error('Unsupported local data key.');
}
export function validateEntries(entries: [string, string][]): void {
  if (new Set(entries.map(([key]) => key)).size !== entries.length) throw new Error('Duplicate local data key.');
  const map = new Map(entries);
  for (const [key, value] of entries) validateRecord(key, value, key => map.get(key) ?? null);
}
export function readOnlyBackup(read: (key: string) => string | null, keys: () => string[]) {
  return createBackupService({ read, keys, replaceAll: async () => { throw new Error('Read only.'); } }, readers);
}
