import type { QuizResult } from './store';

type Question = { id: string; kind: string };
const XP_PER_CORRECT = 10;

export function createLearningResults(
  missions: readonly { quiz: readonly Question[] }[],
  quizResults: readonly QuizResult[],
) {
  const correctIds = new Set(quizResults.filter(result => result.firstCorrectAt !== null).map(result => result.id));
  const knownCorrectIds = new Set(missions.flatMap(mission => mission.quiz)
    .filter(question => correctIds.has(question.id)).map(question => question.id));

  function forMission(quiz: readonly Question[]) {
    const knowledge = quiz.filter(question => question.kind === 'question');
    const correct = quiz.filter(question => knownCorrectIds.has(question.id));
    const bosses = quiz.filter(question => question.kind === 'boss');
    const bossCleared = bosses.length > 0 && bosses.every(question => knownCorrectIds.has(question.id));

    return {
      xp: new Set(correct.map(question => question.id)).size * XP_PER_CORRECT,
      knowledgeCorrect: knowledge.filter(question => knownCorrectIds.has(question.id)).length,
      knowledgeTotal: knowledge.length,
      bossCleared,
      mastered: bossCleared && correct.length === quiz.length,
    };
  }

  return { totalXp: knownCorrectIds.size * XP_PER_CORRECT, forMission };
}
