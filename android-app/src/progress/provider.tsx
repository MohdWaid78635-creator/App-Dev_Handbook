import Storage from 'expo-sqlite/kv-store';
import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { backupKeys } from '../backup/service';
import { createProgressStore, emptyProgress } from './store';
import type { CheckpointId, Progress } from './store';

const key = backupKeys.progress;
const store = createProgressStore({
  read: () => Storage.getItemSync(key),
  write: value => Storage.setItemSync(key, value),
});

type ProgressContextValue = {
  progress: Progress;
  saveError: string;
  toggleCheckpoint(id: CheckpointId): void;
  openMission(id: number): void;
  recordQuizAnswer(id: string, correct: boolean): boolean;
  recordReviewSuccess(id: string): boolean;
  reloadProgress(): boolean;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(() => {
    try {
      return { progress: store.load(), saveError: '' };
    } catch {
      return { progress: emptyProgress(), saveError: 'Saved progress could not be loaded. Your previous record is kept.' };
    }
  });

  const update = useCallback((operation: () => Progress) => {
    try {
      setState({ progress: operation(), saveError: '' });
      return true;
    } catch {
      setState(previous => ({ ...previous, saveError: 'Progress could not be saved. Your previous record is kept.' }));
      return false;
    }
  }, []);
  const toggleCheckpoint = useCallback((id: CheckpointId) => update(() => store.toggleCheckpoint(id)), [update]);
  const openMission = useCallback((id: number) => update(() => store.openMission(id)), [update]);
  const recordQuizAnswer = useCallback((id: string, correct: boolean) => update(() => store.recordQuizAnswer(id, correct)), [update]);
  const recordReviewSuccess = useCallback((id: string) => update(() => store.recordReviewSuccess(id)), [update]);
  const reloadProgress = useCallback(() => update(store.load), [update]);

  return <ProgressContext.Provider value={{ ...state, toggleCheckpoint, openMission, recordQuizAnswer, recordReviewSuccess, reloadProgress }}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) throw new Error('ProgressProvider is missing');
  return context;
}
