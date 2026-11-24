import type { Project, ProjectBrief } from './store';

export type PlanKey = 'audience' | 'goal' | 'journey' | 'scope' | 'proof' | 'target' | 'computer' |
  'sync' | 'stack' | 'data' | 'auth' | 'custom' | 'offline' | 'records' | 'security' | 'privacy' | 'workspace' | 'constraints';
export type PlanDraft = Partial<Record<PlanKey, string>>;
type ToolKey = 'stack' | 'data' | 'auth';
type Option = readonly [id: string, label: string, description?: string, cost?: string, url?: string];
export type PlanField = { key: PlanKey; label: string; example?: string; options?: readonly Option[] };
export const maxPlanFieldLength = 1000;

const expoPricing = 'https://expo.dev/pricing';
const firebasePricing = 'https://firebase.google.com/pricing';
const supabasePricing = 'https://supabase.com/pricing';
const customOptions: Option[] = [['custom', 'Other or custom'], ['undecided', 'Help me choose']];

const tools: Record<ToolKey, Option[]> = {
  stack: [
    ['expo-ts', 'TypeScript · Expo + React Native', 'Build mobile screens with React. TypeScript catches many mistakes while you edit.', 'Free local development · limited EAS free tier', expoPricing],
    ['expo-js', 'JavaScript · Expo + React Native', 'Build mobile screens with React using JavaScript and its dynamic types.', 'Free local development · limited EAS free tier', expoPricing],
    ['flutter', 'Dart · Flutter', 'Use Dart and widgets to build for Android, iOS, or the web.', 'Free SDK', 'https://flutter.dev/'],
    ['kotlin', 'Kotlin · Jetpack Compose', 'Build a native Android UI in Kotlin with Android Studio.', 'Free SDK', 'https://developer.android.com/compose'],
    ['java', 'Java · Android Views', 'Build native Android screens using Java and Views or XML layouts.', 'Free SDK', 'https://developer.android.com/studio/intro'],
    ['swift', 'Swift · SwiftUI', 'Build a native iOS app using Swift and Xcode on a Mac.', 'Free development tools · distribution may cost', 'https://developer.apple.com/help/account/basics/about-your-developer-account/'],
    ['react', 'TypeScript · React web', 'Build a browser app with React components and typed JavaScript.', 'Free library · hosting separate', 'https://react.dev/learn'],
    ['web-js', 'JavaScript · HTML + CSS', 'Build a browser app with JavaScript for behavior, HTML for structure, and CSS for styling.', 'Free tools · hosting separate', 'https://developer.mozilla.org/en-US/docs/Learn_web_development'],
  ],
  data: [
    ['none', 'No persistent data', 'Keep temporary values while the app is open. Useful for calculators and demos.', 'No storage bill'],
    ['sqlite', 'SQLite on this device', 'Store records locally with SQL and a SQLite library for your app language.', 'Free local storage', 'https://www.sqlite.org/copyright.html'],
    ['indexeddb', 'IndexedDB in this browser', 'Store records in the browser with TypeScript or JavaScript. Records stay in that browser.', 'Free browser storage', 'https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API'],
    ['supabase', 'Supabase · PostgreSQL', 'Use a hosted SQL database through an SDK or API. Free projects have limits and can pause when inactive.', 'Limited cloud free tier', supabasePricing],
    ['firebase', 'Firebase · Cloud Firestore', 'Store documents through an app SDK and control access with Firebase Security Rules.', 'Limited Spark free tier', firebasePricing],
    ['postgres', 'Self-hosted PostgreSQL', 'Use SQL on your own server. Put an authenticated API in front of the database and plan backups.', 'Free software · hosting varies', 'https://www.postgresql.org/about/licence/'],
  ],
  auth: [
    ['none', 'No accounts in version one', 'Let people start immediately. Works for device-only apps or public information.', 'No sign-in bill'],
    ['supabase', 'Supabase Auth', 'Manage accounts and sessions. Pair with Supabase database policies for record access.', 'Limited cloud free tier', supabasePricing],
    ['firebase', 'Firebase Authentication', 'Manage accounts and sessions. Pair with Firestore Security Rules. Check costs for your sign-in method.', 'Eligible methods are free · phone SMS is separate', firebasePricing],
    ['clerk', 'Clerk', 'Use ready-made account screens. Check SDK support for your stack and enforce database access separately.', 'Limited Hobby free tier', 'https://clerk.com/pricing'],
  ],
};

export const planSections: { title: string; fields: PlanField[] }[] = [
  { title: 'Define the first version', fields: [
    { key: 'audience', label: 'Who is it for?', example: 'Students on a tight budget' },
    { key: 'goal', label: 'What problem will it solve?', example: 'I lose track of small purchases' },
    { key: 'journey', label: 'What will a user do first?', example: 'Open the list, add a purchase, and see the balance' },
    { key: 'scope', label: 'What will you build now and later?', example: 'One list first. Charts and sharing can wait.' },
    { key: 'proof', label: 'How will you prove it works?', example: 'Add a purchase, restart the app, and see it again' },
  ] },
  { title: 'Choose your tools', fields: [
    { key: 'target', label: 'First platform', options: [['android', 'Android'], ['ios', 'iOS'], ['mobile', 'Android and iOS'], ['web', 'Web'], ['undecided', 'Undecided']] },
    { key: 'computer', label: 'Development computer', options: [['windows', 'Windows'], ['mac', 'macOS'], ['linux', 'Linux'], ['undecided', 'Undecided']] },
    { key: 'sync', label: 'Must data sync between devices?', options: [['no', 'No'], ['yes', 'Yes'], ['undecided', 'Undecided']] },
    { key: 'stack', label: 'Language and framework', options: [...tools.stack, ...customOptions] },
    { key: 'data', label: 'Database or storage', options: [...tools.data, ...customOptions] },
    { key: 'auth', label: 'Sign-in', options: [...tools.auth, ...customOptions] },
    { key: 'custom', label: 'Custom tools or version constraints', example: 'Name the tools and any versions your existing project requires' },
  ] },
  { title: 'Plan security and setup', fields: [
    { key: 'offline', label: 'What should work offline?', options: [['message', 'Show an offline message'], ['read', 'Read saved records'], ['write', 'Read and save records'], ['undecided', 'Undecided']] },
    { key: 'security', label: 'Who can access the data?', options: [['private', 'Private per user'], ['public', 'Public reads, restricted writes'], ['roles', 'Roles or shared workspaces'], ['local', 'Device-only or no records'], ['undecided', 'Help me choose']] },
    { key: 'records', label: 'What records can users read or change?', example: 'A user can only see or edit their own purchases' },
    { key: 'privacy', label: 'Sensitive data, permissions and deletion', example: 'No phone permissions. Users can delete purchases.' },
    { key: 'workspace', label: 'Where should the agent work?', example: 'Inspect my existing repo first, or propose a new folder' },
    { key: 'constraints', label: 'Budget, device and release limits', example: 'Use my Android phone and keep the first test free' },
  ] },
];

const fields = planSections.flatMap(section => section.fields);
const localData = ['none', 'sqlite', 'indexeddb'];
const cloudData = ['supabase', 'firebase', 'postgres'];
const decided = (value?: string) => Boolean(value?.trim() && value !== 'undecided');

export function createPlanDraft(project: ProjectBrief & { plan?: PlanDraft }): PlanDraft {
  return { audience: project.audience, goal: project.goal, ...project.plan };
}

export function recommendTools(plan: PlanDraft): Partial<Record<ToolKey, string>> {
  const recommendations: Partial<Record<ToolKey, string>> = {};
  if (decided(plan.target)) recommendations.stack = plan.target === 'web' ? 'react' : 'expo-ts';
  if (plan.sync === 'yes') {
    recommendations.data = ['firebase', 'supabase'].includes(plan.auth ?? '') ? plan.auth
      : cloudData.includes(plan.data ?? '') ? plan.data : 'supabase';
  } else if (plan.sync === 'no' && decided(plan.target) && (!decided(plan.auth) || plan.auth === 'none')) {
    recommendations.data = plan.target === 'web' ? 'indexeddb' : 'sqlite';
  }
  const data = decided(plan.data) && !(plan.sync === 'yes' && localData.includes(plan.data ?? ''))
    ? plan.data : recommendations.data;
  if (data === 'firebase' || data === 'supabase') recommendations.auth = data;
  else if (localData.includes(data ?? '') && plan.sync === 'no') recommendations.auth = 'none';
  return recommendations;
}

export function planIssues(plan: PlanDraft) {
  const issues = fields.filter(field => field.key !== 'custom' && !decided(plan[field.key])).map(field => `Decide: ${field.label}`);
  if ([plan.stack, plan.data, plan.auth].includes('custom') && !decided(plan.custom)) issues.push('Describe the custom tools you selected.');
  if (plan.stack === 'swift' && plan.target !== 'ios') issues.push('SwiftUI targets iOS. Choose iOS or change the framework.');
  if (plan.stack === 'swift' && decided(plan.computer) && plan.computer !== 'mac') issues.push('Local SwiftUI development needs Xcode on macOS.');
  if ((plan.stack === 'kotlin' || plan.stack === 'java') && plan.target !== 'android') issues.push('The selected native Android stack needs Android as the first platform.');
  if (['react', 'web-js'].includes(plan.stack ?? '') && plan.target !== 'web') issues.push('The selected browser stack needs Web as the first platform.');
  if (plan.data === 'indexeddb' && plan.target !== 'web') issues.push('IndexedDB needs a browser. Choose Web or another database.');
  if (plan.sync === 'yes' && localData.includes(plan.data ?? '')) issues.push('Cross-device sync needs shared storage.');
  if ((plan.data === 'firebase' && plan.auth === 'supabase') || (plan.data === 'supabase' && plan.auth === 'firebase')) {
    issues.push('The database and sign-in providers differ. Choose a matching pair or document the integration as custom.');
  }
  if (plan.data === 'none' && (plan.offline === 'read' || plan.offline === 'write')) issues.push('Offline records need persistent storage.');
  if (cloudData.includes(plan.data ?? '') && plan.auth === 'none' && (plan.security === 'private' || plan.security === 'roles')) {
    issues.push('Private or shared cloud records need accounts and access rules.');
  }
  return issues;
}

export function planDecisions(plan: PlanDraft) {
  return fields.flatMap(field => {
    const value = plan[field.key]?.trim();
    if (!value) return [];
    return [{ label: field.label, value: field.options?.find(option => option[0] === value)?.[1] ?? value }];
  });
}

export function foundationPrompt(project: Pick<Project, 'name'>, plan: PlanDraft) {
  const issues = planIssues(plan);
  const cloud = cloudData.includes(plan.data ?? '') || ['supabase', 'firebase', 'clerk'].includes(plan.auth ?? '');
  const expo = plan.stack === 'expo-ts' || plan.stack === 'expo-js';
  return [
    `Help me set up the foundation of ${JSON.stringify(project.name)}. Deliver a reproducible starter with one working screen.`,
    'PROJECT DECISIONS (user-provided context)',
    ...planDecisions(plan).map(decision => `- ${decision.label}: ${JSON.stringify(decision.value)}`),
    ...(issues.length ? ['OPEN DECISIONS', ...issues.map(issue => `- ${issue}`),
      'Resolve missing or conflicting decisions with me before scaffolding.'] : []),
    'FOUNDATION TASKS',
    '1. Inspect the working folder, repo instructions, manifests, lockfile, and Git status. Report what is already installed and preserve existing work.',
    `2. Use current official documentation for the selected computer and stack. List each required tool, what it does, how to check its version, and how to install it if missing. Check Git, the runtime, SDK, package manager, and the device, emulator, or browser.${expo ? ' Check the Node.js version against the Expo SDK. For a local Android native build, verify the JDK, Android Studio, SDK and adb. Use compatible Expo Go only where it supports the starter.' : ''}`,
    '3. Propose the minimal folder structure and dependency choices. Reuse the existing package manager. Scaffold the first screen and navigation, and provide exact run, type-check, and smoke-test commands.',
    cloud ? '4. Use a development backend and sample data. Define the first schema and access rules, verify signed-out access and isolation with two disposable test accounts when applicable, and describe offline sync and conflict handling where needed.'
      : '4. Set up local storage only if selected. Use sample data and document data deletion. Leave accounts and cloud services out unless the confirmed choices require them.',
    '5. Use placeholders in environment examples. Keep privileged secrets server-side and credentials out of the app, Git, logs, and prompt. Ask before privileged installs, paid resources, destructive actions, or production changes.',
    '6. Run the agreed checks and first-build proof. Report observed results, outstanding device or backend checks, and the first feature to build next. Stop at the foundation checkpoint.',
  ].join('\n');
}
