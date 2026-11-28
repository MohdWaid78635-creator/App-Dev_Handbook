import assert from 'node:assert/strict';

export function handbookBlockText(block) {
  if (['p', 'pre', 'h', 'label', 'prompt'].includes(block.t)) {
    assert.equal(typeof block.text, 'string', `Invalid ${block.t} text`);
    return block.text.trim() ? [block.text] : [];
  }
  if (block.t === 'check') return block.items.map(item => `• ${item}`);
  if (block.t === 'dl') return block.items.map(([term, meaning]) => `${term}\n${meaning}`);
  if (block.t === 'table') {
    assert.ok(Array.isArray(block.head) && Array.isArray(block.rows), 'Invalid handbook table');
    return [block.head.join(' · '), ...block.rows.map(row => row.map((cell, index) => `${block.head[index] ?? `Column ${index + 1}`}: ${cell}`).join('\n'))];
  }
  throw new Error(`Unsupported handbook block: ${block.t}`);
}

export function importHandbook(chapters) {
  const ids = new Set();
  return chapters.flatMap(chapter => chapter.sections.map(section => {
    assert.ok(section.id && !ids.has(section.id) && section.title, 'Invalid or duplicate handbook section');
    ids.add(section.id);
    const body = section.blocks.flatMap(handbookBlockText).filter(text => text.trim());
    assert.ok(body.length, `Empty handbook section ${section.id}`);
    return { id: section.id, title: section.title, chapterId: chapter.id, chapterTitle: chapter.title,
      body, prompts: section.blocks.filter(block => block.t === 'prompt').map(block => block.text) };
  }));
}
