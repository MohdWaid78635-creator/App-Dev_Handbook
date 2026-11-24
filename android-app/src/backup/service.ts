import type { createProgressStore } from '../progress/store';
import type { createProjectStore } from '../projects/store';
import type { createReadinessStore } from '../projects/readiness';
import type { createStudyStore } from '../study/store';

export const backupKeys = { progress: 'academy.progress', projects: 'academy.projects', study: 'academy.study' };
const readinessPrefix = 'academy.readiness.';
export const readinessKey = (projectId: number) => `${readinessPrefix}${projectId}`;
export const maxBackupBytes = 8 * 1024 * 1024;
const format = 'buildwisp-backup';

type Storage = { read(key: string): string | null; keys(): string[]; replaceAll(entries: [string, string][]): Promise<void> };
type Readers = { progress: typeof createProgressStore; projects: typeof createProjectStore;
  study: typeof createStudyStore; readiness: typeof createReadinessStore };
type BackupData = { progress: unknown; projects: unknown; study: unknown; readiness: unknown };

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readSection<T>(name: string, value: unknown, factory: (store: { read(): string | null; write(): never }) => { load(): T }) {
  try {
    if (value !== null && !object(value)) throw new Error('Invalid record.');
    return factory({ read: () => value === null ? null : JSON.stringify(value), write: () => { throw new Error('Read only.'); } }).load();
  } catch {
    throw new Error(`The backup’s ${name} data is invalid or unsupported.`);
  }
}

export function createBackupService(storage: Storage, readers: Readers) {
  function prepare(text: string) {
    if (text.length > maxBackupBytes) throw new Error('The backup exceeds the 8 MB limit.');
    let file: unknown;
    try { file = JSON.parse(text); } catch { throw new Error('Choose a valid BuildWisp backup JSON file.'); }
    if (!object(file) || file.app !== format) throw new Error('This file is not a BuildWisp backup.');
    if (file.version !== 1) throw new Error('This backup version is unsupported.');
    const { createdAt, data } = file;
    if (typeof createdAt !== 'string' || !Number.isFinite(Date.parse(createdAt)) || !object(data) || !Array.isArray(data.readiness)) {
      throw new Error('The backup is missing its date or saved data.');
    }

    const progress = readSection('learning progress', data.progress, readers.progress);
    const projects = readSection('projects', data.projects, readers.projects);
    const study = readSection('study', data.study, readers.study);
    const projectIds = new Set(projects.map(project => project.id));
    const seen = new Set<number>();
    let releaseReviews = 0;
    const entries: [string, string][] = [
      [backupKeys.progress, JSON.stringify({ version: 1, ...progress })],
      [backupKeys.projects, JSON.stringify({ version: 1, projects })],
      [backupKeys.study, JSON.stringify({ version: 1, ...study })],
    ];
    for (const item of data.readiness) {
      if (!object(item) || typeof item.projectId !== 'number' || !projectIds.has(item.projectId) || seen.has(item.projectId)) {
        throw new Error('The backup has a release review without a unique matching project.');
      }
      const reviews = readSection('release review', item.record, readers.readiness);
      seen.add(item.projectId);
      releaseReviews += reviews.length;
      entries.push([readinessKey(item.projectId), JSON.stringify({ version: 1, reviews })]);
    }
    return { entries, summary: { createdAt, projects: projects.length, quizAnswers: progress.quizResults.length,
      dailyAnswers: study.daily.length, flashcards: study.cards.length, releaseReviews } };
  }

  function exportBackup(date = new Date()) {
    function read(key: string): unknown {
      const raw = storage.read(key);
      if (raw === null) return null;
      try { return JSON.parse(raw); } catch { throw new Error('Saved BuildWisp data could not be read.'); }
    }
    const projects = read(backupKeys.projects);
    const profiles = readSection('projects', projects, readers.projects);
    const data: BackupData = { progress: read(backupKeys.progress), projects, study: read(backupKeys.study),
      readiness: profiles.flatMap(project => {
        const record = read(readinessKey(project.id));
        return record === null ? [] : [{ projectId: project.id, record }];
      }) };
    const text = JSON.stringify({ app: format, version: 1, createdAt: date.toISOString(), data });
    prepare(text);
    return text;
  }

  async function restore(text: string) {
    const { entries } = prepare(text);
    const incoming = new Set(entries.map(([key]) => key));
    const empty = JSON.stringify({ version: 1, reviews: [] });
    for (const key of storage.keys()) {
      if (key.startsWith(readinessPrefix) && /^[1-9]\d*$/.test(key.slice(readinessPrefix.length)) && !incoming.has(key)) {
        entries.push([key, empty]);
      }
    }
    await storage.replaceAll(entries);
  }

  return { exportBackup, preview: (text: string) => prepare(text).summary, restore };
}
