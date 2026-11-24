import Storage from 'expo-sqlite/kv-store';
import { backupKeys, readinessKey } from '../backup/service';
import { createProjectStore } from './store';
import { createReadinessStore } from './readiness';

const key = backupKeys.projects;
export const projectStore = createProjectStore({
  read: () => Storage.getItemSync(key),
  write: value => Storage.setItemSync(key, value),
});

export function projectReadinessStore(projectId: number) {
  const key = readinessKey(projectId);
  return createReadinessStore({
    read: () => Storage.getItemSync(key),
    write: value => Storage.setItemSync(key, value),
  });
}
