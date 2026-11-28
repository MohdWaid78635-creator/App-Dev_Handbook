export const categories = { all: 'All', learn: 'Learn', glossary: 'Glossary', troubleshooting: 'Troubleshooting', prompt: 'Prompts' };
export type Category = keyof typeof categories;
export type Resource = {
  id: string;
  kind: Exclude<Category, 'all'>;
  title: string;
  subtitle: string;
  body: readonly string[];
  missionId?: number;
  chapterId?: string;
  sourceUrl?: string;
  copyText?: string;
};

type Mission = {
  id: number;
  lessonTitle: string;
  lessons: readonly { id: string; title: string; source: string; cards: readonly {
    h: string; body: string; ex: string; note: string; terms: readonly (readonly string[])[]; sourceUrl?: string;
  }[] }[];
  steps: readonly { id: string; title: string; why: string; prompt: string; ifStuck: string;
    proof: readonly string[]; source: { url: string } }[];
};
type Article = { id: string; title: string; body: readonly string[]; prompts: readonly string[]; chapterId?: string; chapterTitle?: string };

function searchable(text: string) {
  return text.toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '')
    .replace(/\b(?:log[\s-]*in|sign[\s-]*in)\b/g, 'signin')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

export function buildLibrary(missions: readonly Mission[], articles: readonly Article[], glossary: readonly { id: string; term: string; meaning: string }[] = []) {
  const resources: Resource[] = [];
  const definitions = new Set<string>();
  for (const mission of missions) {
    const context = { subtitle: mission.lessonTitle, missionId: mission.id };
    for (const lesson of mission.lessons) {
      resources.push({ ...context, id: `lesson-${mission.id}-${lesson.id}`, kind: 'learn', title: lesson.title,
        body: [...lesson.cards.flatMap(card => [card.h, card.body, card.ex && `Example: ${card.ex}`, card.note].filter(Boolean)), `Source: ${lesson.source}`] });
      lesson.cards.forEach((card, index) => {
        if (!card.sourceUrl) return;
        resources.push({ ...context, id: `guide-${mission.id}-${lesson.id}-${index}`, kind: 'learn', title: card.h,
          body: [card.body, card.ex && `Example: ${card.ex}`, card.note].filter(Boolean), sourceUrl: card.sourceUrl });
      });
      for (const card of lesson.cards) for (const [term, meaning] of card.terms) {
        const key = `${searchable(term)}:${searchable(meaning)}`;
        if (definitions.has(key)) continue;
        definitions.add(key);
        resources.push({ ...context, id: `term-${definitions.size}`, kind: 'glossary', title: term, body: [meaning] });
      }
    }
    for (const step of mission.steps) {
      const sourceUrl = step.source.url;
      resources.push({ ...context, id: `trouble-${step.id}`, kind: 'troubleshooting', title: step.title, sourceUrl,
        body: [step.ifStuck, 'What to verify', ...step.proof.map(item => `• ${item}`)].filter(Boolean) });
      resources.push({ ...context, id: `prompt-${step.id}`, kind: 'prompt', title: step.title,
        body: [step.why], copyText: step.prompt, sourceUrl });
    }
  }
  for (const article of articles) {
    const subtitle = article.chapterTitle ? `${article.chapterTitle} · Section ${article.id}` : 'App Builder’s Handbook';
    resources.push({ id: `article-${article.id}`, kind: 'learn', title: article.title, subtitle, chapterId: article.chapterId, body: article.body });
    article.prompts.forEach((copyText, index) => resources.push({ id: `prompt-article-${article.id}-${index}`, kind: 'prompt',
      title: article.title, subtitle, chapterId: article.chapterId, body: [], copyText }));
  }
  for (const term of glossary) {
    const key = `${searchable(term.term)}:${searchable(term.meaning)}`;
    if (definitions.has(key)) continue;
    definitions.add(key);
    resources.push({ id: `handbook-term-${term.id}`, kind: 'glossary', title: term.term,
      subtitle: 'Handbook glossary', chapterId: '21', body: [term.meaning] });
  }
  return resources;
}

export function searchLibrary(resources: readonly Resource[], query: string, category: Category, missionId?: number, chapterId?: string) {
  const terms = searchable(query).split(' ').filter(Boolean);
  const applicable = resources.filter(item => (category === 'all' || item.kind === category) &&
    (missionId === undefined || item.missionId === missionId) && (chapterId === undefined || item.chapterId === chapterId));
  if (!terms.length) return applicable;
  return applicable.flatMap(item => {
    const title = searchable(item.title);
    const text = searchable([item.subtitle, ...item.body, item.copyText ?? ''].join(' '));
    if (!terms.every(term => title.includes(term) || text.includes(term))) return [];
    const rank = title === terms.join(' ') ? terms.length + 1 : terms.filter(term => title.includes(term)).length;
    return [{ item, rank }];
  }).sort((left, right) => right.rank - left.rank).map(match => match.item);
}
