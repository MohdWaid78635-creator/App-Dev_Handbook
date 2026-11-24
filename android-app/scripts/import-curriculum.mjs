import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { securityTools } from './security-tools.mjs';

const context = { window: {} };
for (const filename of ['playbook-data.js', 'learn-data.js', 'mobile/readiness-data.js', 'data.js']) {
  const source = new URL(`../../guide/${filename}`, import.meta.url);
  runInNewContext(readFileSync(source, 'utf8'), context, { filename, timeout: 1000 });
}
const { stages } = context.window.PLAYBOOK_DATA;
const modules = new Map(context.window.LEARN.modules.map(lesson => [lesson.id, lesson]));
const path = [
  ['How apps work', 'how-apps-work', 'direct-the-ai'],
  ['Find a problem worth solving', 'plan-first'],
  ['Create your workshop', 'ship-and-run'],
  ['Give your app a backend', 'backend', 'apis'],
  ['Sign in safely', 'security-basics'],
  ['Keep each user’s data private', 'databases'],
  ['Build the core journey', 'frontend', 'design-basics'],
  ['Choose optional powers', 'money'],
  ['Catch a bug before users do', 'testing-basics'],
  ['Secure the release', 'lock-mobile', 'security-tools'],
  ['Ship a test build', 'mobile-store'],
  ['Recover when things break', 'ship-and-run'],
  ['Improve a live app', 'after-launch'],
];
modules.set('security-tools', securityTools);
modules.set('testing-basics', {
  title: 'Testing the first user journey',
  src: 'Build Quest Stage 8 · Testing',
  cards: [
    {
      h: 'Start with an observable result',
      body: 'A useful test states the starting situation, what you do, and the expected result.',
      ex: 'Turn on airplane mode, enter a habit, and tap Save. The draft should stay visible and the app should offer a way to retry.',
      terms: [['Expected result', 'What you should see if the app behaves correctly.']],
    },
    {
      h: 'Test the installed app',
      body: 'A logic test can check a rule. An installed Android build lets you check how the full app handles the network, permissions, and the Back button.',
      ex: 'After connectivity comes back, retry the save and confirm the list contains one new habit.',
    },
  ],
  ai: ['Ask your coding agent for one test that would fail today and what you should see after correcting the behavior.'],
  explain: 'Explain how you would prove a failed save preserves the draft and does not create duplicate records.',
  quiz: [
    { q: 'A save times out. Which test catches a duplicate record?',
      options: ['Check the Save button colour.', 'Retry the same save and verify exactly one record exists.', 'Confirm the spinner disappeared.'],
      answer: 1, why: 'A timeout can hide a successful write. Count the resulting records after retry.' },
    { q: 'Which result shows the user can recover?',
      options: ['The app keeps the draft and succeeds after reconnecting.', 'The developer says it should work.', 'The error message is hidden.'],
      answer: 0, why: 'Recovery means the user can finish the task without losing work.' },
  ],
  try: [{
    type: 'order',
    q: 'Put a useful bug report in order.',
    items: ['Record the device and app build', 'Write the steps to reproduce', 'Compare expected and actual results'],
    why: 'Someone reading the report can reproduce the problem and verify a fix on the same build.',
  }],
});
assert.equal(stages.length, 13, 'Expected 13 playable stages');
assert.equal(path.length, stages.length, 'Every stage needs a lesson mapping');
const stepIds = new Set();
const usedModules = new Set();
const missions = stages.map((stage, index) => {
  assert.equal(stage.id, index, 'Stage numbering must remain stable');
  assert.ok(stage.title && stage.desc && stage.steps.length, `Incomplete stage ${index}`);
  for (const step of stage.steps) {
    assert.ok(/^s\d+-step\d+$/.test(step.id) && !stepIds.has(step.id), 'Duplicate or invalid step ID');
    assert.equal(step.stage, stage.id, 'Step assigned to wrong stage');
    assert.ok(step.title && step.why && step.proof.length && step.source?.url.startsWith('https://'), `Invalid step ${step.id}`);
    assert.ok(typeof step.prompt === 'string' && step.prompt.trim() &&
      step.proof.every(item => typeof item === 'string' && item.trim()) &&
      new Set(step.proof).size === step.proof.length, `Invalid prompt or proof for ${step.id}`);
    stepIds.add(step.id);
  }
  const [lessonTitle, ...moduleIds] = path[index];
  const coreModule = modules.get(moduleIds[0]);
  assert.ok(coreModule?.quiz?.length >= 2, `Missing knowledge questions for stage ${stage.id}`);
  const offset = stage.id === 11 ? 1 : 0;
  const quiz = coreModule.quiz.slice(offset, offset + 2).map((question, questionIndex) => ({
    id: `m${stage.id}-${moduleIds[0]}-q${offset + questionIndex + 1}`,
    kind: 'question', prompt: question.q, options: question.options, answer: question.answer, explanation: question.why,
  }));
  assert.equal(quiz.length, 2, `Expected two knowledge questions for stage ${stage.id}`);
  const boss = stage.boss;
  assert.ok(boss, `Missing boss for stage ${stage.id}`);
  quiz.push({
    id: `m${stage.id}-boss`, kind: 'boss', prompt: boss.question, options: boss.options,
    answer: boss.answer, explanation: boss.options?.[boss.answer],
  });
  for (const question of quiz) {
    assert.ok(question.prompt && question.explanation && question.options?.length >= 2 &&
      question.options.every(option => typeof option === 'string' && option.trim()) &&
      Number.isInteger(question.answer) && question.options[question.answer], `Invalid quiz question ${question.id}`);
  }
  const practice = moduleIds.flatMap(moduleId => (modules.get(moduleId)?.try || []).map((game, gameIndex) => {
    const id = `${moduleId}-${gameIndex + 1}`;
    assert.ok(game.q && game.why, `Missing question or explanation for practice ${id}`);
    if (game.type === 'order') {
      assert.ok(game.items?.length >= 3 && game.items.every(item => typeof item === 'string' && item.trim()) &&
        new Set(game.items).size === game.items.length, `Invalid ordering exercise ${id}`);
    } else {
      assert.equal(game.type, 'match', `Unknown practice type in ${id}`);
      assert.ok(game.pairs?.length >= 2 && game.pairs.every(pair => pair.length === 2 &&
        pair.every(item => typeof item === 'string' && item.trim())) &&
        new Set(game.pairs.map(pair => pair[1])).size >= 2, `Invalid matching exercise ${id}`);
    }
    return { id, type: game.type, question: game.q, why: game.why, items: game.items || [], pairs: game.pairs || [] };
  }));
  assert.ok(practice.length, `No practice for Stage ${stage.id}`);
  const lessons = moduleIds.map(id => {
    const lesson = modules.get(id);
    assert.ok(lesson?.title && lesson.src && lesson.cards?.length && lesson.explain, `Incomplete lesson ${id}`);
    const cards = lesson.cards.map(({ h, body, ex = '', note = '', terms = [], sourceUrl = '' }) => {
      assert.ok(h && body, `Incomplete concept in ${id}`);
      assert.ok(terms.every(pair => pair.length === 2 && pair.every(text => typeof text === 'string' && text.trim())),
        `Invalid glossary term in ${id}`);
      assert.ok(sourceUrl === '' || /^https:\/\//.test(sourceUrl), `Invalid source URL in ${id}`);
      return { h, body, ex, note, terms, sourceUrl };
    });
    usedModules.add(id);
    return { id, title: lesson.title, source: lesson.src, cards, ai: lesson.ai || [], explain: lesson.explain };
  });
  return { id: stage.id, title: stage.title, description: stage.desc, lessonTitle, lessons, practice, quiz, steps: stage.steps };
});
assert.equal(usedModules.size, modules.size, 'All Learn Lab modules must be reachable');
const readinessIds = new Set();
const readiness = context.window.READINESS_GROUPS.map(([id, title, missionId, checks, sources = []]) => {
  assert.ok(/^[a-z][a-z-]*$/.test(id) && !readinessIds.has(id) && title && missions[missionId], `Invalid readiness group ${id}`);
  assert.ok(checks.length && checks.every(check => typeof check === 'string' && check.trim()), `Invalid checks for ${id}`);
  assert.ok(sources.every(([label, url]) => label && url.startsWith('https://')), `Invalid sources for ${id}`);
  readinessIds.add(id);
  return { id, title, missionId, checks: checks.map((title, index) => ({ id: `${id}:${index}`, title })), sources };
});
const sections = new Map(context.window.HANDBOOK.chapters.flatMap(chapter => chapter.sections.map(section => [section.id, section])));
const glossary = context.window.HANDBOOK.chapters.find(chapter => chapter.id === '21')?.sections[0]?.blocks
  .find(block => block.t === 'dl')?.items;
assert.ok(glossary?.length && glossary.every(pair => pair.length === 2 && pair.every(item => typeof item === 'string' && item.trim())) &&
  new Set(glossary.map(([term]) => term)).size === glossary.length, 'Invalid handbook glossary');
const articles = ['0-5', '1-4', '3.2', '3.3', '4.4', '4.6', '5.1'].map(id => {
  const section = sections.get(id);
  assert.ok(section?.title && section.blocks.length, `Missing Library article ${id}`);
  return {
    id, title: section.title,
    body: section.blocks.flatMap(block => {
      if (block.t === 'check') return block.items.map(item => `• ${item}`);
      return ['p', 'pre', 'h', 'label'].includes(block.t) && block.text ? [block.text] : [];
    }),
    prompts: section.blocks.filter(block => block.t === 'prompt' && block.text).map(block => block.text),
  };
});
const out = new URL('../src/generated/', import.meta.url);
mkdirSync(out, { recursive: true });
writeFileSync(new URL('missions.json', out), `${JSON.stringify(missions, null, 2)}\n`);
writeFileSync(new URL('readiness.json', out), `${JSON.stringify(readiness, null, 2)}\n`);
writeFileSync(new URL('articles.json', out), `${JSON.stringify(articles, null, 2)}\n`);
writeFileSync(new URL('glossary.json', out), `${JSON.stringify(glossary.map(([term, meaning]) => ({ id: term, term, meaning })), null, 2)}\n`);
console.log(`Imported ${missions.length} missions, ${usedModules.size} lesson modules and ${stepIds.size} build cards.`);
console.log(`Imported ${readiness.reduce((count, group) => count + group.checks.length, 0)} readiness checks across ${readiness.length} groups.`);
