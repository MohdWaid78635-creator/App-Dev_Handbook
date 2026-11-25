import { createLearningResults } from './results.ts';
import type { Progress } from './store';

type Mission = { id: number; quiz: readonly { id: string; kind: string }[] };

export function createHomeSummary<T extends Mission>(missions: readonly T[], progress: Progress) {
  const results = createLearningResults(missions, progress.quizResults);
  const mastered = missions.filter(mission => results.forMission(mission.quiz).mastered);
  const lastMission = [...progress.openedMissions].reverse()
    .map(id => missions.find(mission => mission.id === id)).find(mission => mission !== undefined);
  const next = missions.find(mission => !mastered.includes(mission));
  const lastMastered = lastMission !== undefined && mastered.includes(lastMission);
  const mission = lastMastered ? next : lastMission ?? next;
  const mode = !next ? 'complete' : lastMastered || (!lastMission && mastered.length > 0)
    ? 'mastered' : lastMission || results.totalXp > 0 ? 'returning' : 'new';
  return { mode, mission, masteredCount: mastered.length, totalXp: results.totalXp };
}
