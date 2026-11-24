import assert from 'node:assert/strict';
import test from 'node:test';
import { buildLibrary, searchLibrary } from '../src/library/search.ts';

const missions = [{ id: 4, lessonTitle: 'Sign in safely', lessons: [{ id: 'sessions', title: 'Sessions', source: 'Learn Lab',
  cards: [{ h: 'Sign-in state', body: 'A session lets the server recognize the user.', ex: 'After signing in, reopen the app.', note: '',
    terms: [['Session', 'Evidence of a signed-in user.'], ['Session', 'Evidence of a signed-in user.']] }] }],
steps: [{ id: 's4-step1', title: 'Set up sign-in', why: 'Manage sessions.', do: [], prompt: 'Check sign-in for [APP_NAME].',
  ifStuck: 'Check the redirect setting.', proof: ['The session is restored.'], source: { url: 'https://example.com' } }] }];
const articles = [{ id: '1', title: 'Prove tests work', body: ['Look for the passing test output.'], prompts: ['List the passing tests.'] }];
const items = buildLibrary(missions, articles);

test('indexes lessons, distinct glossary meanings, troubleshooting, and copyable prompts', () => {
  assert.equal(items.filter(item => item.kind === 'glossary').length, 1);
  assert.equal(items.filter(item => item.kind === 'prompt').length, 2);
  assert.equal(items.find(item => item.kind === 'troubleshooting').missionId, 4);
  assert.equal(items.find(item => item.id === 'prompt-s4-step1').copyText, 'Check sign-in for [APP_NAME].');
});

test('finds full-text terms, treats login as sign-in, and keeps category filters', () => {
  assert.equal(searchLibrary(items, 'redirect', 'troubleshooting')[0].id, 'trouble-s4-step1');
  assert.ok(searchLibrary(items, 'LOGIN', 'prompt').some(item => item.id === 'prompt-s4-step1'));
  assert.equal(searchLibrary(items, 'signed-in user', 'glossary')[0].title, 'Session');
  assert.equal(searchLibrary(items, 'passing test output', 'learn')[0].id, 'article-1');
  assert.equal(searchLibrary(items, '', 'learn', 4)[0].id, 'lesson-4-sessions');
  assert.deepEqual(searchLibrary(items, '', 'all', 5), []);
  assert.deepEqual(searchLibrary(items, 'qzxz', 'all'), []);
});

test('reused lesson modules get distinct result IDs for their missions', () => {
  const reused = buildLibrary([missions[0], { ...missions[0], id: 5, steps: [] }], []);
  assert.deepEqual(reused.filter(item => item.kind === 'learn').map(item => item.id), ['lesson-4-sessions', 'lesson-5-sessions']);
  assert.equal(new Set(reused.map(item => item.id)).size, reused.length);
});

test('source-backed lesson cards appear as individual library guides', () => {
  const mission = structuredClone(missions[0]);
  mission.lessons[0].cards[0].sourceUrl = 'https://example.com/sessions';
  const found = searchLibrary(buildLibrary([mission], []), 'Sign-in state', 'learn', 4);
  assert.equal(found[0].id, 'guide-4-sessions-0');
  assert.equal(found[0].sourceUrl, 'https://example.com/sessions');
});
