import type missionData from '../generated/missions.json';
import type articleData from '../generated/articles.json';
import type glossaryData from '../generated/glossary.json';
import type readinessData from '../generated/readiness.json';
import { integer, list, object, parseJson, requireThat, text, timestamp, uuid } from '../validation/json.ts';

export const contentLimits = { releaseBytes: 4 * 1024 * 1024, textCharacters: 16000 } as const;
export const contentSchemaVersion = 1;
export const contentReaderVersion = 1;
export type ContentDocuments = { missions: typeof missionData; articles: typeof articleData; glossary: typeof glossaryData; readiness: typeof readinessData };
export type ContentRelease = { schemaVersion: 1; releaseId: string; minimumReaderVersion: number; createdAt: string; documents: ContentDocuments };
export type ContentIdentityManifest = ReturnType<typeof createContentIdentityManifest>;

function strings(value: unknown, label: string, minimum = 0, unique = false): string[] {
  const values = list(value, label, minimum).map(item => text(item, label));
  if (unique) requireThat(new Set(values).size === values.length, `Duplicate ${label}.`);
  return values;
}

function uniqueRecords(value: unknown, label: string, minimum = 1, numeric = false): Record<string, unknown>[] {
  const values = list(value, label, minimum).map(item => object(item, label));
  const ids = values.map(item => numeric ? integer(item.id, `${label} ID`) : text(item.id, `${label} ID`));
  requireThat(new Set(ids).size === ids.length, `Duplicate ${label} identity.`);
  return values;
}

function https(value: unknown): void {
  const url = new URL(text(value, 'source URL'));
  requireThat(url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password, 'Invalid HTTPS source URL.');
}

function pairs(value: unknown, label: string, minimum = 0): unknown[][] {
  return list(value, label, minimum).map(pair => {
    const values = list(pair, label, 2);
    requireThat(values.length === 2, `Invalid ${label} pair.`);
    values.forEach(item => text(item, label));
    return values;
  });
}

function validateDocuments(input: unknown): asserts input is ContentDocuments {
  const documents = object(input, 'content documents', ['missions', 'articles', 'glossary', 'readiness']);
  const missions = uniqueRecords(documents.missions, 'missions', 1, true);
  const missionIds = new Set(missions.map(item => item.id));
  const quizIds = new Set<string>();
  const stepIds = new Set<string>();
  for (const mission of missions) {
    for (const key of ['title', 'description', 'lessonTitle']) text(mission[key], key);
    for (const lesson of uniqueRecords(mission.lessons, 'lessons')) {
      for (const key of ['title', 'source', 'explain']) text(lesson[key], key);
      strings(lesson.ai, 'lesson prompts');
      for (const input of list(lesson.cards, 'lesson cards', 1)) {
        const card = object(input, 'lesson card');
        text(card.h, 'card heading'); text(card.body, 'card body');
        text(card.ex, 'card example', true); text(card.note, 'card note', true);
        pairs(card.terms, 'card terms');
        if (text(card.sourceUrl, 'card source', true)) https(card.sourceUrl);
      }
    }
    for (const question of uniqueRecords(mission.quiz, 'quiz questions')) {
      const id = text(question.id, 'quiz ID');
      requireThat(!quizIds.has(id), 'Duplicate global quiz identity.'); quizIds.add(id);
      requireThat(question.kind === 'question' || question.kind === 'boss', 'Invalid question kind.');
      text(question.prompt, 'quiz prompt'); text(question.explanation, 'quiz explanation');
      const options = strings(question.options, 'quiz options', 2, true);
      requireThat(integer(question.answer, 'answer index') < options.length, 'Answer index is out of bounds.');
    }
    for (const practice of uniqueRecords(mission.practice, 'practice')) {
      text(practice.question, 'practice question'); text(practice.why, 'practice explanation');
      requireThat(practice.type === 'order' || practice.type === 'match', 'Unknown practice type.');
      const items = strings(practice.items, 'order items', practice.type === 'order' ? 3 : 0, true);
      const matches = pairs(practice.pairs, 'match pairs', practice.type === 'match' ? 2 : 0);
      if (practice.type === 'match') requireThat(new Set(matches.map(pair => pair[1])).size >= 2, 'Invalid match targets.');
      else requireThat(items.length >= 3, 'Invalid ordering exercise.');
    }
    for (const step of uniqueRecords(mission.steps, 'build cards')) {
      const id = text(step.id, 'build card ID');
      requireThat(/^s\d+-step\d+$/.test(id) && !stepIds.has(id) && step.stage === mission.id && id.startsWith(`s${mission.id}-`), 'Invalid build card identity or assignment.');
      stepIds.add(id);
      for (const key of ['title', 'why', 'prompt', 'ifStuck', 'risk', 'rollback', 'cost']) text(step[key], `build ${key}`);
      strings(step.do, 'build instructions', 1); strings(step.proof, 'build proof', 1, true);
      integer(step.xp, 'build XP');
      const source = object(step.source, 'build source'); https(source.url);
      text(source.checked, 'source checked date'); strings(source.versions, 'source versions');
      if (step.factCheck !== undefined) {
        const fact = object(step.factCheck, 'fact check'); text(fact.key, 'fact key'); https(fact.url); text(fact.checkedOn, 'fact date');
      }
    }
  }
  for (const group of uniqueRecords(documents.readiness, 'readiness groups')) {
    const id = text(group.id, 'readiness group ID');
    requireThat(/^[a-z][a-z-]*$/.test(id) && missionIds.has(group.missionId), 'Invalid readiness mission or group ID.');
    text(group.title, 'readiness group title');
    for (const check of uniqueRecords(group.checks, 'readiness checks')) {
      requireThat(typeof check.id === 'string' && check.id.startsWith(`${id}:`) && /^\d+$/.test(check.id.slice(id.length + 1)), 'Invalid readiness check identity.');
      text(check.title, 'readiness check title');
    }
    for (const pair of pairs(group.sources, 'readiness sources')) https(pair[1]);
  }
  for (const term of uniqueRecords(documents.glossary, 'glossary')) {
    text(term.term, 'glossary term'); text(term.meaning, 'glossary meaning');
  }
  for (const article of uniqueRecords(documents.articles, 'articles')) {
    text(article.title, 'article title'); strings(article.body, 'article body', 1); strings(article.prompts, 'article prompts');
  }
}

export function parseContentRelease(source: string): ContentRelease {
  const value = object(parseJson(source, contentLimits.releaseBytes), 'content release',
    ['schemaVersion', 'releaseId', 'minimumReaderVersion', 'createdAt', 'documents']);
  requireThat(value.schemaVersion === contentSchemaVersion, 'Unsupported content schema version.');
  requireThat(integer(value.minimumReaderVersion, 'minimum reader version', 1) <= contentReaderVersion, 'Unsupported content reader version.');
  uuid(value.releaseId); timestamp(value.createdAt);
  validateDocuments(value.documents);
  return value as ContentRelease;
}

export function createContentIdentityManifest(documents: ContentDocuments) {
  validateDocuments(documents);
  return {
    schemaVersion: 1 as const,
    missions: documents.missions.map(mission => ({ id: mission.id, lessons: mission.lessons.map(lesson => lesson.id),
      practice: mission.practice.map(practice => practice.id),
      quiz: mission.quiz.map(({ id, kind, prompt, options, answer }) => ({ id, kind, prompt, options: [...options], answer })),
      steps: mission.steps.map(({ id, proof }) => ({ id, proof: [...proof] })) })),
    readiness: documents.readiness.map(({ id, missionId, checks }) => ({ id, missionId, checks: checks.map(check => ({ ...check })) })),
    glossary: documents.glossary.map(({ id, term }) => ({ id, term })),
    articles: documents.articles.map(({ id }) => id),
  };
}

function retained<T extends { id: string | number }>(old: readonly T[], next: readonly T[], label: string, compare: (before: T, after: T) => void): void {
  const byId = new Map(next.map(item => [item.id, item]));
  for (const before of old) {
    const after = byId.get(before.id);
    requireThat(after, `Removed ${label} identity ${before.id}; an explicit migration is required.`);
    compare(before, after);
  }
}

function same(before: unknown, after: unknown, label: string): void {
  requireThat(JSON.stringify(before) === JSON.stringify(after), `Changed ${label}; an explicit migration is required.`);
}

export function assertContentCompatibility(previous: ContentIdentityManifest, documents: ContentDocuments): void {
  requireThat(previous?.schemaVersion === contentSchemaVersion, 'Unsupported content identity manifest.');
  const current = createContentIdentityManifest(documents);
  retained(previous.missions, current.missions, 'mission', (before, after) => {
    for (const id of before.lessons) requireThat(after.lessons.includes(id), 'Removed lesson identity.');
    for (const id of before.practice) requireThat(after.practice.includes(id), 'Removed practice identity.');
    retained(before.quiz, after.quiz, 'question', (a, b) => same(a, b, 'assessment meaning or answer choices'));
    retained(before.steps, after.steps, 'build card', (a, b) => same(a.proof, b.proof, 'saved proof strings'));
  });
  retained(previous.readiness, current.readiness, 'readiness group', (before, after) => {
    same(before.missionId, after.missionId, 'readiness mission');
    retained(before.checks, after.checks, 'readiness check', (a, b) => same(a, b, 'readiness meaning'));
  });
  retained(previous.glossary, current.glossary, 'glossary', (a, b) => same(a.term, b.term, 'glossary term'));
  for (const id of previous.articles) requireThat(current.articles.includes(id), 'Removed article identity.');
}
