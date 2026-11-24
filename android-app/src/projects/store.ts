import type { PlanDraft } from './plan';

export const projectLimits = { name: 80, audience: 160, goal: 600 };
export type ProjectBrief = { name: string; audience: string; goal: string };
export type BuildEvidence = { checked: string[]; skipReason?: string };
type BuildCard = { id: string; proof: readonly string[] };
export const projectMilestones = [
  { id: 1, title: 'Problem and audience', prompt: 'Who will use your app, and what single problem will it solve?' },
  { id: 6, title: 'Core journey', prompt: 'List the screens and the one action users must be able to finish.' },
  { id: 8, title: 'Test evidence', prompt: 'Record the build, one failure you reproduced, and the result after the fix.' },
  { id: 11, title: 'Release readiness', prompt: 'Record the candidate, test results, and a verified rollback or restore plan.' },
] as const;
export type MilestoneId = typeof projectMilestones[number]['id'];
type MilestoneNotes = Partial<Record<MilestoneId, string>>;
export const maxMilestoneNoteLength = 1200;
export type Project = ProjectBrief & {
  id: number;
  plan?: PlanDraft;
  build?: Record<string, BuildEvidence | undefined>;
  milestones?: MilestoneNotes;
};
type Storage = { read(): string | null; write(value: string): void };
export const maxBuildSkipReasonLength = 300;
const optionalBuildCards = new Set(['s7-step2', 's7-step3', 's7-step4', 's9-step4']);

export function canSkipBuildCard(card: BuildCard) {
  return optionalBuildCards.has(card.id);
}

export function buildCardStatus(card: BuildCard, evidence?: BuildEvidence) {
  if (evidence?.skipReason && canSkipBuildCard(card)) return 'not-applicable';
  const checked = card.proof.filter(proof => evidence?.checked.includes(proof)).length;
  if (checked === 0) return 'not-started';
  return checked === card.proof.length ? 'verified' : 'in-progress';
}

export function projectSummary(project: Project, cards: readonly (BuildCard & { title: string })[],
  decisions: readonly { label: string; value: string }[]) {
  const recorded = projectMilestones.filter(item => project.milestones?.[item.id]).length;
  const build = cards.map(card => ({ card, evidence: project.build?.[card.id], status: buildCardStatus(card, project.build?.[card.id]) }));
  const verified = build.filter(item => item.status === 'verified').length;
  const skipped = build.filter(item => item.status === 'not-applicable').length;

  return [
    `${project.name} — project summary`,
    project.audience && `Audience: ${project.audience}`,
    project.goal && `Goal: ${project.goal}`,
    '\nSAVED PLAN DECISIONS',
    ...(decisions.length ? decisions.map(item => `${item.label}: ${item.value}`) : ['No decisions recorded']),
    `\nMILESTONES · ${recorded} of ${projectMilestones.length} milestones recorded`,
    ...projectMilestones.map(item => `\n${item.title}\n${project.milestones?.[item.id] ?? 'Not recorded'}`),
    `\nBUILD EVIDENCE · ${verified} of ${cards.length} build cards with all proof · ${skipped} not applicable`,
    ...build.flatMap(({ card, evidence, status }) => {
      if (status === 'not-started') return [];
      if (status === 'not-applicable') return [`\n${card.title} · Not applicable\n${evidence?.skipReason}`];
      const checked = card.proof.filter(item => evidence?.checked.includes(item));
      return [`\n${card.title} · ${checked.length} of ${card.proof.length} checks`, ...checked.map(item => `- ${item}`)];
    }),
  ].filter(Boolean).join('\n');
}

export function projectFieldError(field: keyof ProjectBrief, value: string) {
  if (field === 'name' && !value.trim()) return 'Enter an app name.';
  return value.length > projectLimits[field] ? `Use ${projectLimits[field]} characters or fewer.` : '';
}

function isProject(value: unknown): value is Project {
  if (typeof value !== 'object' || value === null) return false;
  const { id, name, audience, goal, plan, build, milestones } = value as Partial<Project>;
  return typeof id === 'number' && Number.isSafeInteger(id) && id > 0 &&
    typeof name === 'string' && !projectFieldError('name', name) &&
    typeof audience === 'string' && !projectFieldError('audience', audience) &&
    typeof goal === 'string' && !projectFieldError('goal', goal) &&
    (plan === undefined || isPlanDraft(plan)) && (build === undefined || isBuildRecord(build)) &&
    (milestones === undefined || isMilestoneRecord(milestones));
}

function isMilestoneRecord(value: unknown): value is MilestoneNotes {
  return typeof value === 'object' && value !== null && !Array.isArray(value) &&
    Object.entries(value).every(([id, note]) => projectMilestones.some(item => String(item.id) === id) &&
      typeof note === 'string' && Boolean(note.trim()) && note.length <= maxMilestoneNoteLength);
}

function isBuildCardId(id: string) {
  return /^s\d+-step\d+$/.test(id);
}

function isBuildRecord(value: unknown): value is Project['build'] {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  return Object.entries(value).every(([id, evidence]) => {
    if (!isBuildCardId(id) || typeof evidence !== 'object' || evidence === null) return false;
    const { checked, skipReason } = evidence as Partial<BuildEvidence>;
    return Array.isArray(checked) && checked.every(item => typeof item === 'string' && item.trim()) &&
      new Set(checked).size === checked.length && (skipReason === undefined ||
        (optionalBuildCards.has(id) && typeof skipReason === 'string' && Boolean(skipReason.trim()) && skipReason.length <= maxBuildSkipReasonLength));
  });
}

function isPlanDraft(value: unknown): value is PlanDraft {
  return typeof value === 'object' && value !== null && !Array.isArray(value) &&
    Object.values(value).every(field => typeof field === 'string');
}

export function createProjectStore(storage: Storage) {
  function persist(projects: Project[]) {
    storage.write(JSON.stringify({ version: 1, projects }));
  }

  function load(): Project[] {
    const raw = storage.read();
    if (raw === null) return [];
    try {
      const saved = JSON.parse(raw) as { version?: unknown; projects?: unknown } | null;
      const projects = saved?.projects;
      if (saved?.version === 1 && Array.isArray(projects) && projects.every(isProject) &&
          new Set(projects.map(project => project.id)).size === projects.length) return projects;
    } catch {
      throw new Error('Saved projects could not be read.');
    }
    throw new Error('Saved projects could not be read.');
  }

  function save(brief: ProjectBrief, id?: number): Project[] {
    const current = load();
    for (const field of ['name', 'audience', 'goal'] as const) {
      const error = projectFieldError(field, brief[field]);
      if (error) throw new Error(error);
    }
    if (id !== undefined && !current.some(project => project.id === id)) {
      throw new Error('This project could not be found.');
    }
    const nextProject: Project = {
      id: id ?? current.reduce((highest, project) => Math.max(highest, project.id), 0) + 1,
      name: brief.name.trim(),
      audience: brief.audience.trim(),
      goal: brief.goal.trim(),
    };
    if (!Number.isSafeInteger(nextProject.id)) throw new Error('Could not assign a project ID.');
    const projects = id === undefined ? [...current, nextProject] :
      current.map(project => project.id === id ? { ...project, ...nextProject } : project);
    persist(projects);
    return projects;
  }

  function updateProject(id: number, update: (project: Project) => Project) {
    const current = load();
    const project = current.find(item => item.id === id);
    if (!project) throw new Error('This project could not be found.');
    const updated = update(project);
    persist(current.map(item => item.id === id ? updated : item));
    return updated;
  }

  function savePlan(id: number, plan: PlanDraft) {
    if (!isPlanDraft(plan)) throw new Error('The plan could not be saved.');
    updateProject(id, project => ({ ...project, plan }));
  }

  function saveMilestone(id: number, milestoneId: MilestoneId, note: string) {
    if (!projectMilestones.some(item => item.id === milestoneId)) throw new Error('Unknown milestone.');
    if (note.length > maxMilestoneNoteLength) throw new Error(`Use ${maxMilestoneNoteLength} characters or fewer.`);
    return updateProject(id, project => {
      const milestones = { ...project.milestones };
      const text = note.trim();
      if (text) milestones[milestoneId] = text;
      else delete milestones[milestoneId];
      return { ...project, milestones };
    });
  }

  function updateBuildCard(id: number, card: BuildCard, update: (evidence: BuildEvidence) => BuildEvidence) {
    if (!isBuildCardId(card.id)) throw new Error('Invalid build card.');
    return updateProject(id, project => {
      const evidence = update(project.build?.[card.id] ?? { checked: [] });
      return { ...project, build: { ...project.build, [card.id]: evidence } };
    });
  }

  function setBuildProof(id: number, card: BuildCard, proof: string, checked: boolean) {
    if (!card.proof.includes(proof)) throw new Error('Unknown proof item.');
    return updateBuildCard(id, card, evidence => {
      if (evidence.skipReason) throw new Error('Resume this card before changing proof.');
      const remaining = evidence.checked.filter(item => item !== proof);
      return { checked: checked ? [...remaining, proof] : remaining };
    });
  }

  function setBuildSkip(id: number, card: BuildCard, reason: string | null) {
    if (!canSkipBuildCard(card)) throw new Error('Only optional cards can be marked not applicable.');
    const skipReason = reason?.trim();
    if (reason !== null && (!skipReason || skipReason.length > maxBuildSkipReasonLength)) {
      throw new Error('Enter a reason of 300 characters or fewer.');
    }
    return updateBuildCard(id, card, evidence => ({ checked: evidence.checked, skipReason }));
  }

  return { load, save, savePlan, saveMilestone, setBuildProof, setBuildSkip };
}
