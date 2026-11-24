export const checkpointIds = ['tools', 'first-edit', 'git-checkpoint', 'habit-lab'] as const;
export type CheckpointId = typeof checkpointIds[number];
export const REVIEW_INTERVAL_MS = 24 * 60 * 60 * 1000;
export type QuizResult = { id: string; firstCorrectAt: number | null; missed: boolean; reviewDueAt?: number };

export type Progress = {
  checkpoints: CheckpointId[];
  openedMissions: number[];
  quizResults: QuizResult[];
};

type Storage = { read(): string | null; write(value: string): void };

export const emptyProgress = (): Progress => ({ checkpoints: [], openedMissions: [], quizResults: [] });

export function getReviewQueue<Question extends { id: string }>(
  missions: readonly { lessonTitle: string; quiz: readonly Question[] }[],
  results: readonly QuizResult[],
  now = Date.now(),
) {
  const saved = new Map(results.map(result => [result.id, result]));
  return missions.flatMap(mission => mission.quiz.flatMap(question => {
    const result = saved.get(question.id);
    if (!result) return [];
    const needsRetry = result.missed && result.reviewDueAt === undefined;
    const dueAt = result.reviewDueAt ?? (result.firstCorrectAt === null
      ? Infinity : result.firstCorrectAt + REVIEW_INTERVAL_MS);
    return needsRetry || dueAt <= now ? [{ question, lessonTitle: mission.lessonTitle, needsRetry }] : [];
  })).sort((left, right) => Number(right.needsRetry) - Number(left.needsRetry));
}

function validTimestamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function validQuizResult(value: unknown): value is QuizResult {
  if (typeof value !== 'object' || value === null) return false;
  const { id, firstCorrectAt, missed, reviewDueAt } = value as Partial<QuizResult>;
  return typeof id === 'string' && Boolean(id.trim()) && typeof missed === 'boolean' &&
    (firstCorrectAt === null || validTimestamp(firstCorrectAt)) &&
    (reviewDueAt === undefined || (validTimestamp(reviewDueAt) && validTimestamp(firstCorrectAt)));
}

function decode(raw: string | null): Progress {
  if (raw === null) return emptyProgress();
  try {
    const value = JSON.parse(raw);
    const quizResults = value?.quizResults === undefined ? [] : value.quizResults;
    if (value?.version !== 1 || !Array.isArray(value.checkpoints) || !Array.isArray(value.openedMissions) ||
        !value.checkpoints.every((id: unknown) => checkpointIds.some(checkpoint => checkpoint === id)) ||
        !value.openedMissions.every((id: unknown) => typeof id === 'number' && Number.isInteger(id) && id >= 0) ||
        new Set(value.checkpoints).size !== value.checkpoints.length ||
        new Set(value.openedMissions).size !== value.openedMissions.length ||
        !Array.isArray(quizResults) || !quizResults.every(validQuizResult) ||
        new Set(quizResults.map(result => result.id)).size !== quizResults.length) {
      throw new Error('Unsupported progress format');
    }
    return { checkpoints: value.checkpoints, openedMissions: value.openedMissions, quizResults };
  } catch {
    throw new Error('Saved progress could not be read.');
  }
}

export function createProgressStore(storage: Storage) {
  const load = () => decode(storage.read());
  const persist = (value: Progress): Progress => {
    storage.write(JSON.stringify({ version: 1, ...value }));
    return value;
  };

  function saveQuizResult(id: string, correct: boolean, answeredAt: number, reviewed = false) {
    const current = load();
    const previous = current.quizResults.find(result => result.id === id);
    const result: QuizResult = {
      id,
      firstCorrectAt: previous?.firstCorrectAt ?? (correct ? answeredAt : null),
      missed: Boolean(previous?.missed || !correct),
    };
    if (reviewed) result.reviewDueAt = answeredAt + REVIEW_INTERVAL_MS;
    else if (correct && previous?.reviewDueAt !== undefined) result.reviewDueAt = previous.reviewDueAt;
    if (!validQuizResult(result)) throw new Error('Invalid quiz result');
    if (previous?.firstCorrectAt === result.firstCorrectAt && previous.missed === result.missed &&
        previous.reviewDueAt === result.reviewDueAt) return current;
    const quizResults = previous
      ? current.quizResults.map(entry => entry.id === id ? result : entry)
      : [...current.quizResults, result];
    return persist({ ...current, quizResults });
  }

  return {
    load,
    toggleCheckpoint(id: CheckpointId) {
      const current = load();
      const checkpoints = current.checkpoints.includes(id)
        ? current.checkpoints.filter(checkpoint => checkpoint !== id)
        : [...current.checkpoints, id];
      return persist({ ...current, checkpoints });
    },
    openMission(id: number) {
      if (!Number.isInteger(id) || id < 0) throw new Error('Invalid mission ID');
      const current = load();
      if (current.openedMissions.at(-1) === id) return current;
      return persist({ ...current, openedMissions: [...current.openedMissions.filter(mission => mission !== id), id] });
    },
    recordQuizAnswer(id: string, correct: boolean, answeredAt = Date.now()) {
      return saveQuizResult(id, correct, answeredAt);
    },
    recordReviewSuccess(id: string, reviewedAt = Date.now()) {
      return saveQuizResult(id, true, reviewedAt, true);
    },
  };
}
