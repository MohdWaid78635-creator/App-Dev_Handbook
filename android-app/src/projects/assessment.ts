import type { Project } from './store.ts';
import type { Resource } from '../library/search.ts';

export const appStages = { screens: 'Prototype', building: 'Building the core app', testing: 'Preparing a release', live: 'Live app', unknown: 'Needs assessment' } as const;
export const appGoals = { feature: 'Finish a feature', release: 'Prepare to launch', repair: 'Fix a bug or broken update', security: 'Handle possible data or key exposure', performance: 'Make it faster', costs: 'Investigate a high bill', live: 'Improve a live app' } as const;
export const capabilityLabels = { running: 'A build runs on your device', journey: 'The main user task works', data: 'Saved data survives reopening', access: 'Private user access is tested', test: 'Failure and device tests are done', recovery: 'A recovery process is tested' } as const;
export type Capability = keyof typeof capabilityLabels;
export type CheckAnswer = 'yes' | 'no' | 'unsure' | 'na';
export type Assessment = { version: 1; mode: 'new' | 'existing'; stage: keyof typeof appStages; goal: keyof typeof appGoals;
  accounts: 'private' | 'local' | 'unknown'; checks: Record<Capability, CheckAnswer> };

const has = (value: object, key: unknown) => typeof key === 'string' && Object.hasOwn(value, key);
export function canSkipCapability(key: Capability) { return key === 'data' || key === 'recovery'; }
export function isAssessment(value: unknown): value is Assessment {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const a = value as Assessment;
  if (Object.keys(a).length !== 6 || a.version !== 1 || !['new', 'existing'].includes(a.mode) ||
    !has(appStages, a.stage) || !has(appGoals, a.goal) || !['private', 'local', 'unknown'].includes(a.accounts) ||
    typeof a.checks !== 'object' || a.checks === null || Array.isArray(a.checks)) return false;
  const keys = Object.keys(capabilityLabels) as Capability[];
  return Object.keys(a.checks).length === keys.length && keys.every(key =>
    Object.hasOwn(a.checks, key) && ['yes', 'no', 'unsure', ...(canSkipCapability(key) ? ['na'] : [])].includes(a.checks[key]));
}

export function newAssessment(): Assessment {
  return { version: 1, mode: 'existing', stage: 'unknown', goal: 'feature', accounts: 'unknown',
    checks: { running: 'unsure', journey: 'unsure', data: 'unsure', access: 'unsure', test: 'unsure', recovery: 'unsure' } };
}

const focusDetails = {
  start: { title: 'Run and change one screen', missionId: 0, task: 'Run a development build, change visible text, and save a Git checkpoint. Verify the edited screen on your device.' },
  inventory: { title: 'Understand the app you have', missionId: 11, task: 'Inventory the source, tools, environments, access, and backup options. Reproduce a development build before changing the app.' },
  journey: { title: 'Finish one complete user journey', missionId: 6, task: 'Choose one user task. Check its empty, loading, success, invalid-input, and failed-save states on your device.' },
  data: { title: 'Check saving, reopening, and retry', missionId: 3, task: 'Create a sample record, reopen the app, and confirm it remains. Simulate a failed save, keep the draft, and retry without creating duplicates.' },
  access: { title: 'Check who can access each record', missionId: 5, task: 'Confirm whether private cloud records exist. If they do, test with two disposable accounts: each can access its own records and cannot read or change the other account’s data.' },
  test: { title: 'Try the failures before launch', missionId: 8, task: 'Check offline behavior, repeated taps, failed saves, Back navigation, restart, large text, and TalkBack. Record the build and observed results.' },
  release: { title: 'Prepare a verified test release', missionId: 10, task: 'Check the candidate build, signing, privacy declarations, and applicable store requirements. Install it from the test channel and verify the main user task.' },
  recovery: { title: 'Practise recovery and monitor the app', missionId: 12, task: 'Restore sample data into an isolated test environment. Check what was restored, what was excluded, and how the app recovers. Review monitoring and costs.' },
  repair: { title: 'Investigate the broken behavior first', missionId: 11, task: 'Record the symptom, affected build, and when it started. Preserve useful evidence without secrets. Test a fix in development and verify a recovery option before release.' },
  security: { title: 'Prioritise the possible exposure', missionId: 9, task: 'Follow your incident response process to contain access and preserve evidence. Review affected privileged credentials and access rules. This assessment cannot determine the extent of an incident.' },
  performance: { title: 'Measure the slow part first', missionId: 12, task: 'Reproduce the slow action on a representative device. Record the build, network, and measurement. Change one cause at a time and compare the result.' },
  costs: { title: 'Investigate the unexpected usage', missionId: 11, task: 'Find the service and usage item that increased. Check abuse, retries, and controls supported by your plan. Confirm what each cost limit actually covers.' },
} as const;
export type Focus = keyof typeof focusDetails;
export type Guidance = { focus: Focus; stage: string; reason: string; generalOnly: boolean; startHere: boolean; relatedMissions: readonly number[] } & { title: string; missionId: number; task: string };

export function recommendProject(project: Pick<Project, 'assessment' | 'plan'>): Guidance | null {
  const a = project.assessment;
  if (!a) return null;
  let focus: Focus;
  let reason: string;
  const immediate: Partial<Record<Assessment['goal'], Focus>> = { repair: 'repair', security: 'security', performance: 'performance', costs: 'costs' };
  if (a.mode === 'new') { focus = 'start'; reason = 'Start with a small working screen before adding features.'; }
  else if (immediate[a.goal]) { focus = immediate[a.goal]!; reason = 'Your current problem takes priority over the normal learning sequence.'; }
  else if (a.stage === 'unknown') { focus = 'inventory'; reason = 'Establish what exists before choosing the next change.'; }
  else {
    const order: Capability[] = ['running', 'journey', 'data', ...(a.accounts !== 'local' ? ['access' as const] : []), 'test'];
    const gap = order.find(key => (key === 'access' && a.accounts === 'unknown') || !['yes', 'na'].includes(a.checks[key]));
    const mapping = { running: 'start', journey: 'journey', data: 'data', access: 'access', test: 'test', recovery: 'recovery' } as const;
    focus = gap ? mapping[gap] : a.goal === 'release' ? 'release' : a.goal === 'live' ? 'recovery' : 'journey';
    reason = gap ? `${capabilityLabels[gap]} is ${a.checks[gap] === 'no' ? 'marked as needing work' : 'not yet verified for this app'}.`
      : 'Your reported checks support working on your selected goal. They do not certify the app for release.';
  }
  const localLab = focus === 'data' && project.plan?.data === 'sqlite';
  const backendMismatch = (focus === 'data' && !localLab || focus === 'access') && project.plan?.data !== 'supabase';
  const generalOnly = !['expo-ts', 'expo-js'].includes(project.plan?.stack ?? '') || project.plan?.target === 'web' || backendMismatch;
  const detail = localLab ? { ...focusDetails.data, missionId: 0 } : focusDetails[focus];
  return { focus, ...detail, stage: a.mode === 'new' ? 'Fresh start' : appStages[a.stage], reason, generalOnly, startHere: focus === 'start' || localLab,
    relatedMissions: [...new Set([detail.missionId, ...(a.accounts !== 'local' ? [5] : []), ...(a.goal === 'release' ? [8, 10] : [])])] };
}

// General handbook references remain available when the app has no matching stack-specific lab.
const generalArticles: Record<Focus, readonly string[]> = {
  start: ['5.1', '0-5'], inventory: ['5.1', '0-5', '1-4'], journey: ['4.4', '3.3', '4.6'], data: ['5.1', '3.3'],
  access: ['5.1', '0-5'], test: ['1-4', '3.3', '4.6'], release: ['4.6', '3.3', '0-5'], recovery: ['0-5', '1-4'],
  repair: ['1-4', '0-5'], security: ['0-5', '5.1'], performance: ['3.3', '4.4'], costs: ['3.2', '5.1'],
};
export function matchProjectResources(resources: readonly Resource[], guidance: Guidance): Resource[] {
  const articles = generalArticles[guidance.focus];
  return resources.flatMap((item, index) => {
    const missionRank = guidance.generalOnly || item.missionId === undefined ? -1 : guidance.relatedMissions.indexOf(item.missionId);
    const articleRank = articles.findIndex(id => item.id === `article-${id}` || item.id.startsWith(`prompt-article-${id}-`));
    if (missionRank < 0 && articleRank < 0) return [];
    const kindRank = item.kind === 'learn' ? 0 : item.kind === 'troubleshooting' ? 1 : item.kind === 'prompt' ? 2 : 3;
    return [{ item, rank: missionRank >= 0 ? missionRank * 10 + kindRank : 100 + articleRank, index }];
  }).sort((a, b) => a.rank - b.rank || a.index - b.index).map(({ item }) => item);
}
