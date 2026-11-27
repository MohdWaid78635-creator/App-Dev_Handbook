import { backupKeys, createBackupService, readinessKey } from '../backup/service.ts';
import { createProgressStore } from '../progress/store.ts';
import { createProjectStore } from '../projects/store.ts';
import { createStudyStore } from '../study/store.ts';
import { createReadinessStore } from '../projects/readiness.ts';
import { readers } from './records.ts';
import type { LocalDatabase } from './database.ts';
import type { ScopeLease } from './scope.ts';

export function createScopedStores(database: LocalDatabase, lease: ScopeLease) {
  const read = (key: string) => { lease.assertCurrent(); return database.read(lease.namespace, key); };
  const slot = (key: string) => ({ read: () => read(key), write: (value: string) => {
    lease.assertCurrent(); database.write(lease.namespace, key, value);
  } });
  return {
    progressStore: createProgressStore(slot(backupKeys.progress)),
    projectStore: createProjectStore(slot(backupKeys.projects)),
    studyStore: createStudyStore(slot(backupKeys.study)),
    projectReadinessStore: (id: number) => createReadinessStore(slot(readinessKey(id))),
    backupService: createBackupService({ read,
      keys: () => { lease.assertCurrent(); return database.keys(lease.namespace); },
      replaceAll: async entries => { lease.assertCurrent(); database.replace(lease.namespace, entries); },
    }, readers),
  };
}
export type LocalStores = ReturnType<typeof createScopedStores>;
