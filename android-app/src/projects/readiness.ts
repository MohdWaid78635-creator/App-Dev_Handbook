export const readinessStatuses = { pending: 'To check', passed: 'Passed', blocked: 'Blocked', na: 'Not applicable' };
export type ReadinessStatus = keyof typeof readinessStatuses;
type Entry = { status: ReadinessStatus; evidence: string };
export type ReleaseReview = { build: string; items: Record<string, Entry | undefined> };
type Check = { id: string; title: string };
type Group = { id: string; title: string; checks: readonly Check[] };
type Storage = { read(): string | null; write(value: string): void };

export const maxBuildLength = 120;
export const maxEvidenceLength = 1000;
const checkId = /^[a-z][a-z-]*:\d+$/;

function validEntry(entry: unknown): entry is Entry {
  if (typeof entry !== 'object' || entry === null) return false;
  const { status, evidence } = entry as Partial<Entry>;
  return typeof status === 'string' && Object.hasOwn(readinessStatuses, status) &&
    typeof evidence === 'string' && evidence.length <= maxEvidenceLength && (status === 'pending' || Boolean(evidence.trim()));
}

function validReview(review: unknown): review is ReleaseReview {
  if (typeof review !== 'object' || review === null) return false;
  const { build, items } = review as Partial<ReleaseReview>;
  return typeof build === 'string' && Boolean(build) && build === build.trim() && build.length <= maxBuildLength &&
    typeof items === 'object' && items !== null && !Array.isArray(items) &&
    Object.entries(items).every(([id, entry]) => checkId.test(id) && validEntry(entry));
}

export function createReadinessStore(storage: Storage) {
  function load(): ReleaseReview[] {
    const raw = storage.read();
    if (raw === null) return [];
    try {
      const saved = JSON.parse(raw) as { version?: unknown; reviews?: unknown } | null;
      const reviews = saved?.reviews;
      if (saved?.version === 1 && Array.isArray(reviews) && reviews.every(validReview) &&
          new Set(reviews.map(review => review.build)).size === reviews.length) return reviews;
    } catch {
      throw new Error('Saved release reviews could not be read.');
    }
    throw new Error('Saved release reviews could not be read.');
  }

  function persist(reviews: ReleaseReview[]) {
    storage.write(JSON.stringify({ version: 1, reviews }));
  }

  function open(buildInput: string) {
    const build = buildInput.trim();
    if (!build || build.length > maxBuildLength) throw new Error('Enter a build number or commit.');
    const reviews = load();
    const existing = reviews.find(review => review.build === build);
    if (existing) return existing;
    const review: ReleaseReview = { build, items: {} };
    persist([...reviews, review]);
    return review;
  }

  function saveCheck(build: string, id: string, status: ReadinessStatus, evidence: string) {
    if (!checkId.test(id)) throw new Error('Unknown check.');
    const entry = { status, evidence: evidence.trim() };
    if (!validEntry(entry)) throw new Error('Record evidence or a reason for this status.');
    const reviews = load();
    const review = reviews.find(item => item.build === build);
    if (!review) throw new Error('Release review could not be found.');
    const items = { ...review.items };
    if (status === 'pending' && !entry.evidence) delete items[id];
    else items[id] = entry;
    const updated = { ...review, items };
    persist(reviews.map(item => item.build === build ? updated : item));
    return updated;
  }

  return { load, open, saveCheck };
}

export function readinessCounts(groups: readonly Group[], items: ReleaseReview['items']) {
  const counts = { pending: 0, passed: 0, blocked: 0, na: 0 };
  for (const group of groups) for (const check of group.checks) counts[items[check.id]?.status ?? 'pending']++;
  return counts;
}

const reviewHints: Record<string, string> = {
  auth: 'Inspect sign-in, session handling, route guards, and existing account tests.',
  database: 'Inspect migrations, access policies, grants, and existing database test or restore reports.',
  api: 'Inspect route handlers, shared validation and authorization, configuration, and existing API test reports.',
  money: 'Inspect server-side usage accounting, billing integration, spending limits, and existing test results.',
  queries: 'Inspect relevant queries, migrations, and existing query plans or measurements.',
  performance: 'Inspect the relevant app code and existing release measurements. Name the device and build for each result.',
  ux: 'Trace the relevant screen and its normal success, loading, offline, and error states. Point to device evidence where available.',
  testing: 'Inspect test configuration and recent reports. Identify the exact build and environment covered.',
  release: 'Inspect release configuration, installed build results, and release records.',
  'security-extra': 'Inspect applicable configuration, authorization decisions, and existing defensive verification reports.',
  scale: 'Inspect retry, migration, or recovery configuration and existing safe development rehearsal results.',
  code: 'Inspect repository configuration, implementation, and recent automated check reports.',
  operations: 'Inspect ownership, written procedures, and redacted operational evidence.',
  'android-extra': 'Inspect Android configuration and installed build results for the relevant devices and conditions.',
  'control-plane': 'Inspect service inventories, ownership, permissions, and documented data flows.',
  artifact: 'Inspect the release artifact, merged manifest, or build metadata as applicable.',
  'recovery-proof': 'Inspect the build record, recovery runbook, and the evidence from the latest rehearsal.',
};

const boundaries = 'Keep this review read-only. Use repository files, configuration, and existing redacted reports for evidence. Do not modify code or reach production services. Keep secrets and personal data out of the response.';

export function checkPrompt(project: string, build: string, group: Group, check: Check) {
  const hint = check.id === 'artifact:5'
    ? 'Read the existing redacted static report from MobSF or an equivalent tool and confirm it matches this APK or AAB. Check a flagged permission against the merged manifest and the features that need it. Record the build ID, finding, fix or reason it does not apply, and verification result. Use To check if the report or follow-up proof is missing.'
    : reviewHints[group.id] ?? 'Inspect the relevant implementation and existing verification evidence.';
  return [
    `Help me verify one production readiness check for ${JSON.stringify(project)} on ${JSON.stringify(build)}.`,
    `Section: ${group.title}\nCheck: ${check.title}`,
    hint,
    boundaries,
    'Explain in plain language what should be true and what evidence would prove it. Cite file paths, a redacted result, or a report for this build. If evidence is missing, state the smallest safe next step with local or disposable test data. Suggest Passed, Blocked, Not applicable, or To check and provide a one-line evidence note I can record.',
  ].join('\n\n');
}

export function auditPrompt(project: string, build: string, groups: readonly Group[]) {
  return [
    `Review production readiness for ${JSON.stringify(project)} on ${JSON.stringify(build)}.`,
    boundaries,
    'Review the checks below. Cite evidence for this build and mark missing evidence as To check. List blockers first, then the smallest verification steps. Explain any Not applicable result.',
    ...groups.map(group => `${group.title}\n${group.checks.map(check => `- ${check.title}`).join('\n')}`),
  ].join('\n\n');
}
