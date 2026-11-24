import Storage from 'expo-sqlite/kv-store';
import { backupKeys } from '../backup/service';
import { createStudyStore } from './store';

const key = backupKeys.study;
export const studyStore = createStudyStore({
  read: () => Storage.getItemSync(key),
  write: value => Storage.setItemSync(key, value),
});
