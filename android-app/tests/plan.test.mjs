import assert from 'node:assert/strict';
import test from 'node:test';
import { createProjectStore } from '../src/projects/store.ts';
import { createPlanDraft, foundationPrompt, planIssues, recommendTools } from '../src/projects/plan.ts';

const brief = { name: 'Pocket Budget', audience: 'Students', goal: 'Track purchases' };

test('suggests free local tools for a first Android project and pairs cloud providers', () => {
  assert.deepEqual(recommendTools({ target: 'android', sync: 'no' }), { stack: 'expo-ts', data: 'sqlite', auth: 'none' });
  assert.deepEqual(recommendTools({ target: 'web', sync: 'yes', auth: 'firebase' }), { stack: 'react', data: 'firebase', auth: 'firebase' });
  assert.equal(recommendTools({ target: 'android', sync: 'yes', data: 'sqlite' }).data, 'supabase');
});

test('flags incompatible choices and asks the agent to resolve them before setup', () => {
  const plan = { ...brief, target: 'android', computer: 'windows', stack: 'swift', data: 'sqlite', auth: 'none', sync: 'yes' };
  assert.match(planIssues(plan).join('\n'), /SwiftUI.*iOS/i);
  assert.match(planIssues(plan).join('\n'), /sync.*shared storage/i);
  const prompt = foundationPrompt(brief, plan);
  assert.match(prompt, /Pocket Budget/);
  assert.match(prompt, /resolve.*before scaffolding/i);
  assert.match(prompt, /Swift · SwiftUI/);
  assert.match(prompt, /official documentation/i);
});

test('a complete local plan includes observable proof and Expo setup without cloud accounts', () => {
  const plan = { ...createPlanDraft(brief), journey: 'Add purchase', scope: 'One list', proof: 'Restart and see the purchase',
    target: 'android', computer: 'windows', stack: 'expo-ts', data: 'sqlite', auth: 'none', sync: 'no', offline: 'write',
    records: 'Purchases stay on this phone', security: 'local', privacy: 'No permissions', workspace: 'New folder', constraints: 'Free' };
  assert.deepEqual(planIssues(plan), []);
  const prompt = foundationPrompt(brief, plan);
  assert.match(prompt, /Restart and see the purchase/);
  assert.match(prompt, /Android Studio.*adb/);
  assert.match(prompt, /Leave accounts and cloud services out/);
});

test('drafts belong to the chosen project and survive reopening and editing the brief', () => {
  let data = null;
  const storage = { read: () => data, write: value => { data = value; } };
  const store = createProjectStore(storage);
  const [first] = store.save(brief);
  const [, second] = store.save({ ...brief, name: 'Practice App' });
  store.savePlan(first.id, { target: 'android' });
  store.savePlan(second.id, { target: 'web' });
  store.save({ ...brief, name: 'Renamed' }, first.id);
  const [reopened, other] = createProjectStore(storage).load();
  assert.equal(reopened.name, 'Renamed');
  assert.deepEqual(createPlanDraft(reopened), { audience: 'Students', goal: 'Track purchases', target: 'android' });
  assert.deepEqual(other.plan, { target: 'web' });
  assert.throws(() => store.savePlan(999, {}), /could not be found/i);
});
