/* global store, toast, route */
// ── Build Quest — Playbook engine ──────────────────────────────────────────
// Module shape: window.BuildQuest = { page(arg), init() }
// Storage keys:
//   bq.steps:{appName}   → [{stepId, state:'todo|doing|done|stuck'}]
//   bq.proofs:{appName}  → {stepId: [bool, bool, ...]}
//   bq.xp:{appName}      → number (total XP earned)
//   bq.boss:{appName}    → {stageId: 'pass'|'fail'|null}

(function () {
  'use strict';

  // ── XP per action ─────────────────────────────────────────────────────
  const XP = { stepDone: 20, bossPass: 50, bossFail: 5, stageUnlock: 10 };

  // ── Storage helpers ───────────────────────────────────────────────────
  const PB = {
    _key:   (ns, app) => `bq.${ns}:${app}`,
    steps:  (app)     => store.get(PB._key('steps', app), []),
    proofs: (app)     => store.get(PB._key('proofs', app), {}),
    xp:     (app)     => store.get(PB._key('xp', app), 0),
    boss:   (app)     => store.get(PB._key('boss', app), {}),

    stateFor(stepId, app) {
      return (PB.steps(app).find(s => s.stepId === stepId) || {}).state || 'todo';
    },
    setState(stepId, state, app) {
      const all = PB.steps(app);
      const idx = all.findIndex(s => s.stepId === stepId);
      if (idx >= 0) all[idx].state = state; else all.push({ stepId, state });
      store.set(PB._key('steps', app), all);
    },
    proofsFor(stepId, app) {
      return PB.proofs(app)[stepId] || [];
    },
    setProof(stepId, idx, checked, app) {
      const p = PB.proofs(app);
      if (!p[stepId]) p[stepId] = [];
      p[stepId][idx] = checked;
      store.set(PB._key('proofs', app), p);
    },
    addXp(amount, app) {
      const v = PB.xp(app) + amount;
      store.set(PB._key('xp', app), v);
      return v;
    },
    setBossResult(stageId, result, app) {
      const b = PB.boss(app);
      b[stageId] = result;
      store.set(PB._key('boss', app), b);
    },
    bossResultFor(stageId, app) {
      return PB.boss(app)[stageId] || null;
    },
  };

  // ── Current app helper ────────────────────────────────────────────────
  function currentApp() { return store.get('guide.currentApp', 'default'); }

  // ── Stage helpers ─────────────────────────────────────────────────────
  function stageComplete(stageId, app) {
    const stage = stageById(stageId);
    if (!stage || stage.stub || !stage.steps.length) return false;
    return stage.steps.every(s => PB.stateFor(s.id, app) === 'done');
  }
  function stageById(id) {
    return (window.PLAYBOOK_DATA.stages || []).find(s => s.id === id) || null;
  }
  function stageUnlocked(stageId, app) {
    if (stageId === 0) return true;
    return stageComplete(stageId - 1, app);
  }
  function totalXp(app) { return PB.xp(app); }

  // ── SVG ring ──────────────────────────────────────────────────────────
  function renderRing(pct) {
    const r = 13, c = +(2 * Math.PI * r).toFixed(2);
    const offset = +(c - (pct / 100) * c).toFixed(2);
    return `<svg class="pb-ring" width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
  <circle cx="16" cy="16" r="${r}" class="pb-ring-bg"/>
  <circle cx="16" cy="16" r="${r}" class="pb-ring-fill"
    stroke-dasharray="${c}" stroke-dashoffset="${offset}"
    transform="rotate(-90 16 16)"/>
</svg>`;
  }

  // ── XP lightning bolt pill (top bar) ─────────────────────────────────
  function xpPill(app) {
    const xp = totalXp(app);
    return `<span class="bq-xp-bar" title="Your total XP">
  <svg width="13" height="13" viewBox="0 0 13 13" aria-hidden="true" fill="none">
    <path d="M7.5 1 2 7.5h4.5L5.5 12 11 5.5H6.5L7.5 1Z" fill="currentColor"/>
  </svg>
  ${xp} XP
</span>`;
  }

  // ── Stage list page ───────────────────────────────────────────────────
  function stageListPage() {
    const app = currentApp();
    const stages = window.PLAYBOOK_DATA.stages || [];
    const cards = stages.map(stage => {
      const steps = stage.stub ? [] : (stage.steps || []);
      const done  = steps.filter(s => PB.stateFor(s.id, app) === 'done').length;
      const pct   = steps.length ? Math.round((done / steps.length) * 100) : 0;
      const ring  = renderRing(pct);
      const unlocked = stageUnlocked(stage.id, app);
      const bossResult = PB.bossResultFor(stage.id, app);
      const bossBadge  = bossResult === 'pass' ? '<span class="pb-boss-badge">⚔ Boss cleared</span>' :
                         (stage.boss ? '<span class="pb-boss-badge" style="opacity:.5">⚔ Boss fight</span>' : '');
      const cls = stage.stub || !unlocked ? 'pb-stage-card pb-stage-card--stub' : 'pb-stage-card';
      const href = (!stage.stub && unlocked) ? `href="#/buildquest/${stage.id}"` : '';
      const lockIcon = !unlocked ? '🔒 ' : '';
      return `<li>
  <a class="${cls}" ${href} aria-label="Stage ${stage.id}: ${stage.title}, ${done} of ${steps.length} steps done">
    ${ring}
    <div class="pb-stage-info">
      <span class="pb-stage-num">Stage ${stage.id}</span>
      <strong class="pb-stage-title">${lockIcon}${esc(stage.title)}</strong>
      <span class="pb-stage-sub">${steps.length ? `${done}/${steps.length} steps` : 'coming soon'}</span>
    </div>
    ${bossBadge}
  </a>
</li>`;
    });

    const meta = window.PLAYBOOK_DATA.meta || {};
    return `<div class="page-content">
  <div class="page-header" style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
    <div style="flex:1;min-width:0">
      <h1 style="margin:0">⚔ ${esc(meta.name || 'Build Quest')}</h1>
      <p style="margin:.25rem 0 0;opacity:.7;font-size:.9rem">${esc(meta.subtitle || '')}</p>
    </div>
    ${xpPill(app)}
  </div>
  <ul class="pb-stage-list" role="list">
    ${cards.join('\n')}
  </ul>
</div>`;
  }

  // ── Stage detail page ─────────────────────────────────────────────────
  function stageDetailPage(stageId) {
    const app   = currentApp();
    const stage = stageById(stageId);
    if (!stage) return `<div class="empty"><h1>Stage not found</h1><a href="#/buildquest">← Back</a></div>`;
    if (stage.stub) return `<div class="empty">
  <h1>Stage ${stageId}: ${esc(stage.title)}</h1>
  <p>Content coming soon. Research pass required for stages 6–12.</p>
  <a href="#/buildquest">← All stages</a>
</div>`;
    if (!stageUnlocked(stageId, app)) return `<div class="empty">
  <h1>🔒 Stage ${stageId} locked</h1>
  <p>Complete Stage ${stageId - 1} first.</p>
  <a href="#/buildquest">← All stages</a>
</div>`;

    const steps   = stage.steps || [];
    const done    = steps.filter(s => PB.stateFor(s.id, app) === 'done').length;
    const pct     = steps.length ? Math.round((done / steps.length) * 100) : 0;
    const ring    = renderRing(pct);
    const complete = done === steps.length && steps.length > 0;
    const bossHtml = stage.boss ? renderBossCard(stage, app) : '';
    const fanfare  = complete && !stage.boss ? renderFanfare(stageId, app) : '';

    return `<div class="page-content">
  <div class="pb-detail-header">
    <a href="#/buildquest" class="pb-back">← All Stages</a>
    <div style="display:flex;align-items:center;gap:.75rem;flex-wrap:wrap">
      <div>${ring}</div>
      <div>
        <h2 style="margin:0">Stage ${stageId}: ${esc(stage.title)}</h2>
        <span class="pb-stage-xp">⚡ ${done * XP.stepDone + (PB.bossResultFor(stageId, app) === 'pass' ? XP.bossPass : 0)} XP earned this stage</span>
      </div>
    </div>
    ${!complete ? '' : '<p style="color:#3bba6b;font-weight:700;margin:.5rem 0 0">✓ All steps complete!</p>'}
  </div>
  ${fanfare}
  <ol class="pb-step-list" role="list" style="list-style:none;padding:0">
    ${steps.map(step => renderStepCard(step, app)).join('\n')}
  </ol>
  ${bossHtml}
</div>`;
  }

  // ── Step card ─────────────────────────────────────────────────────────
  function renderStepCard(step, app) {
    const state  = PB.stateFor(step.id, app);
    const labels = { todo: '○ To do', doing: '◑ Doing', done: '✓ Done', stuck: '⚠ Stuck' };
    const proofs = (step.proof || []).map((p, i) => {
      const checked = !!PB.proofsFor(step.id, app)[i];
      return `<label class="pb-proof-item">
  <input type="checkbox" data-stepid="${step.id}" data-proof="${i}" ${checked ? 'checked' : ''}>
  ${esc(p)}
</label>`;
    }).join('');

    const prompt = (step.prompt || '').replace(/\[APP_NAME\]/g, esc(currentApp()));

    return `<li class="pb-step-card pb-step--${state}" data-step="${step.id}">
  <div class="pb-step-header">
    <span class="pb-state-badge" role="status" aria-atomic="true" aria-label="${state}: ${esc(step.title)}">${labels[state]}</span>
    <strong class="pb-step-title">${esc(step.title)}</strong>
    <span class="pb-step-xp">+${step.xp || XP.stepDone} XP</span>
  </div>
  <p class="pb-why">${esc(step.why)}</p>
  <ol class="pb-do-list">${(step.do || []).map(d => `<li>${esc(d)}</li>`).join('')}</ol>
  <div class="pb-prompt-wrap">
    <pre class="pb-prompt-text">${esc(prompt)}</pre>
    <button class="pb-copy-btn" data-copy="${step.id}" aria-label="Copy AI prompt for: ${esc(step.title)}">Copy</button>
  </div>
  ${proofs ? `<fieldset class="pb-proof-set">
  <legend>Proof (tick each before marking done)</legend>
  ${proofs}
</fieldset>` : ''}
  <details class="pb-ifstuck">
    <summary>🆘 If stuck</summary>
    <p>${esc(step.ifStuck || '')}</p>
  </details>
  <details class="pb-risk">
    <summary>⚠ Risk &amp; rollback</summary>
    <p><strong>Risk:</strong> ${esc(step.risk || 'Low')}</p>
    <p><strong>Rollback:</strong> ${esc(step.rollback || 'git stash')}</p>
  </details>
  <footer class="pb-step-footer">
    <span class="pb-cost">Cost: ${esc(step.cost || '$0')}</span>
    ${step.source ? `<a class="pb-source" href="${step.source.url}" target="_blank" rel="noopener noreferrer">Source ↗</a>
    <span class="pb-checked">Checked ${esc(step.source.checked)}</span>` : ''}
  </footer>
  <div class="pb-actions">
    ${state !== 'doing' && state !== 'done' ? `<button class="pb-btn" data-action="doing" data-stepid="${step.id}">▶ Start</button>` : ''}
    ${state !== 'done' ? `<button class="pb-btn pb-btn--done" data-action="done" data-stepid="${step.id}">✓ Mark done</button>` : ''}
    ${state !== 'stuck' ? `<button class="pb-btn pb-btn--stuck" data-action="stuck" data-stepid="${step.id}">⚠ I'm stuck</button>` : ''}
    ${state === 'stuck' ? `<button class="pb-btn" data-action="doing" data-stepid="${step.id}">↩ Back to doing</button>` : ''}
  </div>
</li>`;
  }

  // ── Boss fight card ───────────────────────────────────────────────────
  function renderBossCard(stage, app) {
    const result = PB.bossResultFor(stage.id, app);
    if (result === 'pass') return `<div class="pb-boss-card">
  <h3>⚔ Boss Defeated! +${XP.bossPass} XP</h3>
  <p class="pb-boss-q" style="color:#3bba6b">You cleared the Stage ${stage.id} boss fight. Well done.</p>
</div>`;

    const boss = stage.boss;
    const opts = (boss.options || []).map((o, i) =>
      `<li><button class="pb-boss-opt" data-boss-stage="${stage.id}" data-boss-idx="${i}">${esc(o)}</button></li>`
    ).join('');
    const failNote = result === 'fail' ? `<p class="pb-boss-result" style="color:#e0533a">❌ Not quite — re-read the steps above, then try again. +${XP.bossFail} XP for trying.</p>` : '';

    return `<div class="pb-boss-card">
  <h3>⚔ Boss Fight — Stage ${stage.id}</h3>
  <p class="pb-boss-q">${esc(boss.question)}</p>
  <ul class="pb-boss-opts">${opts}</ul>
  ${failNote}
  <p style="font-size:.75rem;opacity:.6;margin-top:.5rem">Answer correctly to clear this boss fight and earn ${XP.bossPass} XP.</p>
</div>`;
  }

  // ── Stage complete fanfare ────────────────────────────────────────────
  function renderFanfare(stageId, app) {
    // Only show if no boss fight on this stage
    return `<div class="pb-fanfare">
  <h3>🎉 Stage ${stageId} cleared! +${XP.stageUnlock} XP</h3>
  <p style="margin:.25rem 0 0;font-size:.9rem">Stage ${stageId + 1} is now unlocked.</p>
</div>`;
  }

  // ── HTML escaper ──────────────────────────────────────────────────────
  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Proof auto-complete: mark done when all proofs ticked ─────────────
  function checkAutoComplete(stepId, stageId, app) {
    const stage = stageById(stageId);
    if (!stage) return;
    const step = (stage.steps || []).find(s => s.id === stepId);
    if (!step) return;
    const proofs = PB.proofsFor(stepId, app);
    const allTicked = (step.proof || []).every((_, i) => proofs[i]);
    if (allTicked && PB.stateFor(stepId, app) !== 'done') {
      PB.setState(stepId, 'done', app);
      const gained = PB.addXp(step.xp || XP.stepDone, app);
      toast(`✓ Step done! +${step.xp || XP.stepDone} XP (total: ${gained})`);
    }
  }

  // ── Event delegation (called once from BuildQuest.init) ───────────────
  function attachEvents() {
    document.addEventListener('click', function (e) {
      // State action buttons
      const btn = e.target.closest('[data-action][data-stepid]');
      if (btn) {
        const { action, stepid } = btn.dataset;
        const app = currentApp();
        const wasNotDone = PB.stateFor(stepid, app) !== 'done';
        PB.setState(stepid, action, app);
        if (action === 'done' && wasNotDone) {
          // Find step to get its XP value
          let xpGain = XP.stepDone;
          for (const st of (window.PLAYBOOK_DATA.stages || [])) {
            const found = (st.steps || []).find(s => s.id === stepid);
            if (found) { xpGain = found.xp || XP.stepDone; break; }
          }
          const total = PB.addXp(xpGain, app);
          toast(`✓ +${xpGain} XP! Total: ${total}`);
        }
        route();
        return;
      }

      // Copy prompt button
      const copy = e.target.closest('[data-copy]');
      if (copy) {
        const pre = copy.previousElementSibling;
        if (!pre) return;
        (navigator.clipboard ? navigator.clipboard.writeText(pre.textContent) : Promise.resolve())
          .then(() => {
            copy.textContent = '✓ Copied!';
            copy.classList.add('pb-copy--success');
            setTimeout(() => { copy.textContent = 'Copy'; copy.classList.remove('pb-copy--success'); }, 1500);
          })
          .catch(() => toast('Copy failed — select text manually'));
        return;
      }

      // Boss fight option
      const bossBtn = e.target.closest('[data-boss-stage][data-boss-idx]');
      if (bossBtn) {
        const stageId = Number(bossBtn.dataset.bossStage);
        const idx     = Number(bossBtn.dataset.bossIdx);
        const app     = currentApp();
        const stage   = stageById(stageId);
        if (!stage || !stage.boss) return;
        const correct = stage.boss.answer === idx;
        const result  = correct ? 'pass' : 'fail';
        PB.setBossResult(stageId, result, app);
        const gained = correct ? PB.addXp(XP.bossPass, app) : PB.addXp(XP.bossFail, app);
        if (correct) toast(`⚔ Boss defeated! +${XP.bossPass} XP · Total: ${gained}`);
        else toast(`❌ Wrong answer — +${XP.bossFail} XP for trying · Total: ${gained}`);
        route();
      }
    });

    document.addEventListener('change', function (e) {
      const cb = e.target.closest('[data-stepid][data-proof]');
      if (!cb) return;
      const { stepid } = cb.dataset;
      const proofIdx   = Number(cb.dataset.proof);
      const app        = currentApp();

      // Find stageId for this step
      let stageId = null;
      for (const st of (window.PLAYBOOK_DATA.stages || [])) {
        if ((st.steps || []).find(s => s.id === stepid)) { stageId = st.id; break; }
      }
      PB.setProof(stepid, proofIdx, cb.checked, app);
      if (stageId !== null) checkAutoComplete(stepid, stageId, app);
      else route(); // re-render badge even without auto-complete
    });
  }

  // ── Public API ────────────────────────────────────────────────────────
  window.BuildQuest = {
    page(arg) {
      if (arg === undefined || arg === null || arg === '') return stageListPage();
      const n = Number(arg);
      if (Number.isInteger(n) && n >= 0 && n <= 12) return stageDetailPage(n);
      return `<div class="empty"><h1>Unknown page</h1><a href="#/buildquest">← Back</a></div>`;
    },
    init() {
      attachEvents();
    },
  };
})();
