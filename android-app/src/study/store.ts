export type DailyAnswer = { day: string; id: string; pick: number };
type CardGrade = { id: string; level: number; due: string };
type Study = { daily: DailyAnswer[]; cards: CardGrade[] };
type Storage = { read(): string | null; write(value: string): void };
const DAY_MS = 24 * 60 * 60 * 1000;
const intervals = [0, 1, 3, 7, 14];

export function dayKey(date = new Date()) {
  return [String(date.getFullYear()).padStart(4, '0'), String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')].join('-');
}

function addDays(day: string, count: number) {
  return new Date(Date.parse(`${day}T00:00:00Z`) + count * DAY_MS).toISOString().slice(0, 10);
}

function validDay(day: unknown): day is string {
  return typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day) &&
    Number.isFinite(Date.parse(day)) && addDays(day, 0) === day;
}

export function dailyQuestion<Question extends { id: string }>(questions: readonly Question[], day: string, answer?: DailyAnswer) {
  if (answer?.day === day) return questions.find(question => question.id === answer.id);
  if (!questions.length) return undefined;
  const index = Math.floor(Date.parse(day) / DAY_MS);
  return questions[((index % questions.length) + questions.length) % questions.length];
}

export function studyStreak(answers: readonly DailyAnswer[], today: string) {
  const days = new Set(answers.map(answer => answer.day));
  let day = days.has(today) ? today : addDays(today, -1);
  let count = 0;
  while (days.has(day)) {
    count++;
    day = addDays(day, -1);
  }
  return count;
}

export function dueCards<Card extends { id: string }>(cards: readonly Card[], grades: readonly CardGrade[], day: string,
  deferred: readonly string[] = []) {
  const saved = new Map(grades.map(grade => [grade.id, grade]));
  const later = new Map(deferred.map((id, index) => [id, index]));
  return cards.filter(card => (saved.get(card.id)?.due ?? day) <= day).sort((left, right) => {
    const leftDeferred = later.get(left.id) ?? -1;
    const rightDeferred = later.get(right.id) ?? -1;
    return leftDeferred - rightDeferred || (saved.get(left.id)?.level ?? -1) - (saved.get(right.id)?.level ?? -1);
  });
}

function validAnswer(value: unknown): value is DailyAnswer {
  if (!value || typeof value !== 'object') return false;
  const { day, id, pick } = value as Partial<DailyAnswer>;
  return validDay(day) && typeof id === 'string' && Boolean(id.trim()) && typeof pick === 'number' &&
    Number.isSafeInteger(pick) && pick >= 0;
}

function validGrade(value: unknown): value is CardGrade {
  if (!value || typeof value !== 'object') return false;
  const { id, due, level } = value as Partial<CardGrade>;
  return typeof id === 'string' && Boolean(id.trim()) && validDay(due) && typeof level === 'number' &&
    Number.isInteger(level) && level >= 0 && level < intervals.length;
}

export function createStudyStore(storage: Storage) {
  function load(): Study {
    const raw = storage.read();
    if (raw === null) return { daily: [], cards: [] };
    const saved = JSON.parse(raw) as { version?: unknown; daily?: unknown; cards?: unknown } | null;
    const { daily, cards } = saved ?? {};
    if (saved?.version !== 1 || !Array.isArray(daily) || !daily.every(validAnswer) ||
        !Array.isArray(cards) || !cards.every(validGrade) || new Set(daily.map(answer => answer.day)).size !== daily.length ||
        new Set(cards.map(card => card.id)).size !== cards.length) throw new Error('Saved practice could not be read.');
    return { daily, cards };
  }

  function persist(study: Study) {
    storage.write(JSON.stringify({ version: 1, ...study }));
    return study;
  }

  function saveDaily(day: string, id: string, pick: number) {
    const study = load();
    const answer = { day, id, pick };
    if (!validAnswer(answer)) throw new Error('Invalid daily answer.');
    if (study.daily.some(item => item.day === day)) return study;
    const daily = [...study.daily, answer].sort((left, right) => left.day.localeCompare(right.day)).slice(-400);
    return persist({ ...study, daily });
  }

  function gradeCard(id: string, knew: boolean, day: string) {
    if (!validDay(day)) throw new Error('Invalid practice date.');
    const study = load();
    const previous = study.cards.find(card => card.id === id);
    if (previous && previous.due > day) return study;
    const level = knew ? Math.min(intervals.length - 1, (previous?.level ?? 0) + 1) : 0;
    const grade = { id, level, due: addDays(day, intervals[level]) };
    if (!validGrade(grade)) throw new Error('Invalid flashcard grade.');
    if (previous?.level === grade.level && previous.due === grade.due) return study;
    const cards = previous ? study.cards.map(card => card.id === id ? grade : card) : [...study.cards, grade];
    return persist({ ...study, cards });
  }

  return { load, saveDaily, gradeCard };
}
