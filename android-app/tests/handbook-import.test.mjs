import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import { buildLibrary, searchLibrary } from '../src/library/search.ts';

const context = { window: {} };
runInNewContext(readFileSync(new URL('../../guide/data.js', import.meta.url), 'utf8'), context, { timeout: 1000 });
const chapters = JSON.parse(JSON.stringify(context.window.HANDBOOK.chapters));
const sections = chapters.flatMap(chapter => chapter.sections);
const read = name => JSON.parse(readFileSync(new URL(`../src/generated/${name}.json`, import.meta.url)));
const articles = read('articles');
const library = buildLibrary(read('missions'), articles, read('glossary'));

test('every handbook section is imported once with chapter context and its original identity', () => {
  assert.equal(articles.length, 191);
  assert.equal(new Set(articles.map(article => article.id)).size, sections.length);
  for (const chapter of chapters) for (const section of chapter.sections) {
    const article = articles.find(item => item.id === section.id);
    assert.ok(article, `Missing section ${section.id}`);
    assert.equal(article.title, section.title);
    assert.equal(article.chapterId, chapter.id);
    assert.equal(article.chapterTitle, chapter.title);
    assert.ok(article.body.length);
  }
});

test('all handbook prompt blocks are available as copyable searchable resources', () => {
  const source = sections.flatMap(section => section.blocks.filter(block => block.t === 'prompt').map(block => ({ id: section.id, text: block.text })));
  assert.equal(source.length, 125);
  const imported = articles.flatMap(article => article.prompts);
  assert.equal(imported.length, source.length);
  for (const prompt of source) assert.ok(library.some(item => item.id.startsWith(`prompt-article-${prompt.id}-`) && item.copyText === prompt.text));
});

test('paragraphs, code, labels, headings, checklists, definitions and table cells survive import', () => {
  for (const section of sections) {
    const body = articles.find(article => article.id === section.id)?.body.join('\n') ?? '';
    for (const block of section.blocks) {
      if (block.t === 'table') {
        for (const text of [...block.head, ...block.rows.flat()]) assert.ok(body.includes(text), `Lost table cell in ${section.id}: ${text}`);
      } else if (block.t === 'dl') {
        for (const text of block.items.flat()) assert.ok(body.includes(text), `Lost definition in ${section.id}`);
      } else if (block.t === 'check') {
        for (const text of block.items) assert.ok(body.includes(text), `Lost checklist item in ${section.id}`);
      } else assert.ok(body.includes(block.text), `Lost ${block.t} text in ${section.id}`);
    }
  }
});

test('all glossary definitions and chapter context can be found in the resource library', () => {
  for (const term of read('glossary')) assert.ok(library.some(item => item.kind === 'glossary' && item.title === term.term && item.body.includes(term.meaning)), `Missing glossary ${term.term}`);
  assert.ok(searchLibrary(library, 'Edge cases: the complete list', 'learn').some(item => item.chapterId === '11'));
});
