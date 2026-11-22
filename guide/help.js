// help.js: "Something broke?" help desk. You say what went wrong; it shows the book's own rescue steps for it,
// in the order the book uses (stop the damage, find out, fix, prevent), with the exact prompts to copy and the proof to demand.
// It adds nothing of its own: every step is a section of your handbook (see helpTopics in game-data.js).
const Help = (() => {
  const G = window.GAME;
  const PHASES = { stop: 'Stop the damage', check: 'Find out what happened', fix: 'Fix it', prevent: 'Make sure it cannot happen again' };

  function index() {
    document.title = 'Something broke?';
    const calm = byId['20']?.s.blocks.find(b => b.t === 'p')?.text || '';
    return `<div class="wide helppage">
      <p class="crumb"><a href="#/">Home</a> › Something broke?</p>
      <h1>Something broke? Start here.</h1>
      <p class="lede">Take a breath. ${esc(calm)} Pick what is happening, and I will show you the steps from your handbook, in the right order.</p>
      <ul class="helpgrid">${G.helpTopics.map(t => `<li><a class="helpcard ${t.urgent ? 'urgent' : ''}" href="#/help/${t.id}">${t.urgent ? '<span class="urg">Act first</span>' : ''}<b>${esc(t.ask)}</b><small>${t.steps.length} steps</small></a></li>`).join('')}</ul>
      <p class="fnote">Not sure what is wrong? Pick <a href="#/help/unknown">“I do not know the real state of my app”</a>, or search the guide with the box at the top. If real money, health data or children are involved, the book says to bring in a human expert (see your app types on the Quest page).</p></div>`;
  }

  function stepHtml(st, n) {
    const m = Game.sectionInfo(st.sec);
    return `<li class="hstep ${st.phase}">
      <div class="hhead"><span class="hnum" aria-hidden="true">${n}</span><div><span class="hphase">${PHASES[st.phase]}</span><h3>${esc((m.label + m.title).trim())}</h3></div></div>
      ${m.intro ? `<p class="hwhy">${esc(m.intro)}</p>` : ''}
      ${m.prompts.length ? `<h4>Tell your AI</h4>${m.prompts.map(p => renderBlock(p, st.sec)).join('')}` : ''}
      ${m.proofs.length ? `<h4>Proof to demand <small>(tick only when you have seen it yourself)</small></h4>${renderBlock({ t: 'check', items: m.proofs }, st.sec)}` : ''}
      <p class="hread"><a href="#/s/${st.sec}">Read the whole section${m.page ? ` (PDF page ${m.page})` : ''}</a></p></li>`;
  }

  function page(id) {
    const t = G.helpTopics.find(x => x.id === id);
    if (!id || !t) return index();
    document.title = t.ask;
    let n = 0;
    return `<div class="wide helppage">
      <p class="crumb"><a href="#/">Home</a> › <a href="#/help">Something broke?</a> › ${esc(t.ask)}</p>
      <h1>${esc(t.title)}</h1>
      ${t.urgent ? '<p class="urgentbar" role="note"><b>This one is urgent.</b> Do the first steps today. Do not add new features until they are done.</p>' : ''}
      ${t.note ? `<p class="helpnote" role="note">${esc(t.note)}</p>` : ''}
      <p class="lede">Do these in order. Each step is a section of your handbook. Copy the prompt, give it to your AI, then check the proof yourself.</p>
      <ol class="hsteps">${t.steps.map(st => stepHtml(st, ++n)).join('')}</ol>
      <div class="hafter"><b>When it is over:</b> write down what happened and what you decided, so the next chat with your AI cannot undo it. <a href="#/myapp/decisions">Open the decisions log</a>. Then go back to your <a href="#/play">quest</a>.</div>
      <p class="fnote"><a href="#/help">← All problems</a></p></div>`;
  }

  return { page };
})();
