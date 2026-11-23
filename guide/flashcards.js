// flashcards.js: the glossary as flip cards with simple spaced repetition (Leitner boxes).
// Saved in this browser for YOU (not per app): guide.cards = { term: { b: box 0-4, due: 'YYYY-MM-DD', m: true once learned } }.
const Flashcards = (() => {
  const GAP = [0, 1, 3, 7, 14]; // days until a card comes back, by box
  const data = () => store.get('cards', {});
  const today = () => Game.dayKey(new Date());
  const addDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return Game.dayKey(d); };
  const mastered = () => { const d = data(); return glossary.filter(([t]) => d[t]?.m).length; };
  const isDue = (d, t) => !d[t] || d[t].due <= today();
  let cur = null, flipped = false;

  const pick = () => { const d = data(); return glossary.map(g => g[0]).filter(t => isDue(d, t)).sort((a, b) => (d[a]?.b ?? -1) - (d[b]?.b ?? -1) || a.localeCompare(b))[0] || null; };
  function grade(term, knew) {
    const d = data(), c = d[term] || { b: 0, due: today(), m: false };
    c.b = knew ? Math.min(4, c.b + 1) : 0;
    c.due = addDays(knew ? GAP[c.b] : 0);
    if (c.b >= 3) c.m = true;
    d[term] = c;
    if (!store.set('cards', d)) toast('Could not save: your browser is blocking saved data.');
    Game.noteActivity();
  }

  function page() {
    document.title = 'Flashcards';
    if (!glossary.length) return `<div class="empty"><h1>No glossary yet</h1><p>The glossary chapter is missing from the handbook data.</p></div>`;
    const total = glossary.length, got = mastered(), d = data();
    if (cur === null || !isDue(d, cur)) { cur = pick(); flipped = false; }
    const def = cur && glossary.find(g => g[0] === cur)[1];
    const ring = `<div class="ring" style="--p:${Math.round(got / total * 100)}" role="img" aria-label="${got} of ${total} words mastered"><span>${got}/${total}</span></div>`;
    const body = cur ? `
      <button type="button" class="fcard${flipped ? ' flip' : ''}" data-fc="flip" aria-pressed="${flipped}" aria-label="Flashcard. Press to ${flipped ? 'hide' : 'show'} the meaning.">
        <span class="face front"><small>Word</small><b>${esc(cur)}</b><em>Tap to see the meaning</em></span>
        <span class="face back"><small>Meaning</small><span>${esc(def)}</span></span>
      </button>
      <div class="fc-actions"${flipped ? '' : ' hidden'}>
        <button type="button" class="fc-btn" data-fc="again">Show again</button>
        <button type="button" class="fc-btn go" data-fc="know">I know this</button>
      </div>` : `<div class="empty"><h2>${got === total ? 'You have mastered every word' : 'All caught up for today'}</h2>
        <p>${got === total ? 'The "Glossary master" badge is yours. Words come back for a quick review as they come due.' : 'The words you missed return soon. Come back tomorrow.'}</p></div>`;
    return `<article class="tool"><p class="crumb"><a href="#/learn">Learn Lab</a> › Flashcards</p>
      <h1>Flashcards</h1>
      <div class="fc-head">${ring}<p>${total} glossary words. Say the meaning in your head, then flip. Words you miss come back sooner.</p></div>
      <div id="fc-live" aria-live="polite">${body}</div></article>`;
  }

  function init() {
    main.addEventListener('click', e => {
      const b = e.target.closest('[data-fc]');
      if (!b || location.hash.split('/')[1] !== 'cards') return;
      const a = b.dataset.fc;
      if (a === 'flip') flipped = !flipped;
      else {
        const before = mastered();
        grade(cur, a === 'know'); cur = null; flipped = false;
        if (mastered() === glossary.length && before < glossary.length) toast('Badge earned: Glossary master');
      }
      main.innerHTML = page();
      document.querySelector('.fcard')?.focus();
    });
  }
  return { page, init, mastered };
})();
