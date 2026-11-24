import Storage from 'expo-sqlite/kv-store';
import { createProgressStore } from '../progress/store';
import { createProjectStore } from '../projects/store';
import { createReadinessStore } from '../projects/readiness';
import { createStudyStore } from '../study/store';
import { createBackupService } from './service';

export const backupService = createBackupService({
  read: key => Storage.getItemSync(key),
  keys: () => Storage.getAllKeysSync(),
  replaceAll: entries => Storage.multiSet(entries),
}, { progress: createProgressStore, projects: createProjectStore, study: createStudyStore, readiness: createReadinessStore });
