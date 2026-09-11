/* ------------------------------------------------------------------ *
 * The Legacy Library™ — client for the TRIARCH member environment.
 * Fetches /.netlify/functions/library (cookie-authed), renders the
 * onboarding sequence on first visit, then the Treasury / Forge / Legacy
 * Vault / Royal Archive / Legacy Archive. Every write goes through
 * library-action.js; nothing here touches downloads or Stripe.
 * ------------------------------------------------------------------ */
(function () {
  const $ = (id) => document.getElementById(id);
  const state = { data: null };

  function showSection(id) {
    ['library-loading', 'library-signed-out', 'library-not-enrolled', 'library-dashboard', 'library-error'].forEach((sec) => {
      const el = $(sec);
      if (el) el.hidden = sec !== id;
    });
  }

  async function fetchView() {
    const res = await fetch('/.netlify/functions/library', { credentials: 'include' });
    return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) };
  }

  async function postAction(payload) {
    const res = await fetch('/.netlify/functions/library-action', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return res.json();
  }

  async function fetchCommunity(monthOrder) {
    const res = await fetch(`/.netlify/functions/library-community?month=${monthOrder}`, { credentials: 'include' });
    if (!res.ok) return { entries: [] };
    return res.json();
  }

  function currentMonth(data) {
    return data.months.find((m) => m.order === data.currentMonthOrder) || data.months[0];
  }

  function phaseMeta(data, key) {
    return data.triarchPhases.find((p) => p.key === key);
  }

  /* ---------------------------------------------------------------- *
   * Onboarding
   * ---------------------------------------------------------------- */
  function renderOnboarding(data) {
    const phasesWrap = $('onboarding-phases');
    phasesWrap.innerHTML = data.triarchPhases
      .map(
        (p) => `
      <div class="onboarding-phase-card">
        <span class="phase-glyph">${p.mark}</span>
        <h3>${p.name}</h3>
        <p class="phase-arc">${p.arc}</p>
        <p>${p.description}</p>
      </div>`
      )
      .join('');

    const cycleWrap = $('onboarding-cycle');
    cycleWrap.innerHTML = data.months.map((m) => `<span class="cycle-word">${m.theme}</span>`).join('');
  }

  /* ---------------------------------------------------------------- *
   * TRIARCH progression rail
   * ---------------------------------------------------------------- */
  function renderRail(data) {
    const rail = $('triarch-rail');
    rail.innerHTML = data.triarchPhases
      .map((p) => {
        const monthsInPhase = data.months.filter((m) => m.phase === p.key);
        const crowned = !!data.phaseCrowns[p.key];
        const dots = monthsInPhase
          .map((m) => {
            let cls = '';
            if (m.status === 'current') cls = 'is-current';
            else if (m.stewarded) cls = 'is-stewarded';
            return `<span class="rail-month-dot ${cls}"></span>`;
          })
          .join('');
        return `<div class="rail-phase${crowned ? ' is-crowned' : ''}">
          ${crowned ? '<span class="rail-crown-tag">👑</span>' : ''}
          <span class="rail-glyph">${p.mark}</span>
          <h3>${p.name}</h3>
          <p class="rail-arc">${p.arc}</p>
          <div class="rail-months">${dots}</div>
        </div>`;
      })
      .join('');
  }

  /* ---------------------------------------------------------------- *
   * .LLab Treasury™
   * ---------------------------------------------------------------- */
  function renderTreasury(data) {
    const libraryActive = data.memberships && data.memberships['library-card'] && data.memberships['library-card'].status === 'active';
    const membershipActive = data.memberships && data.memberships.membership && data.memberships.membership.status === 'active';
    $('treasury-library-status').textContent = libraryActive ? 'Active' : 'Not active';
    $('treasury-library-status').className = libraryActive ? 'status-on' : 'status-off';
    $('treasury-membership-status').textContent = membershipActive ? 'Active' : 'Not active';
    $('treasury-membership-status').className = membershipActive ? 'status-on' : 'status-off';

    const marksByKey = new Map(data.marks.map((m) => [m.key, m]));
    const cells = [
      ['book', data.marksSummary.book],
      ['research', data.marksSummary.research],
      ['practice', data.marksSummary.practice],
      ['reflection', data.marksSummary.reflection],
      ['community', data.marksSummary.community],
      ['phase-crown', data.marksSummary.phaseCrowns],
      ['cycle-ring', data.marksSummary.cycleRings],
    ];
    $('treasury-grid').innerHTML = cells
      .map(
        ([key, count]) => `<div class="treasury-cell">
          <span class="treasury-count">${count}</span>
          <span class="treasury-label">${marksByKey.get(key).name}</span>
        </div>`
      )
      .join('');
  }

  /* ---------------------------------------------------------------- *
   * THE FORGE — this month's active work
   * ---------------------------------------------------------------- */
  function bookRowHtml(month, i) {
    const book = month.books[i];
    const done = month.progress.books[i];
    return `<label class="book-row${done ? ' is-done' : ''}">
      <input type="checkbox" class="forge-book" data-index="${i}" ${done ? 'checked' : ''} />
      <span><span class="book-title">${book.title}</span> — <span class="book-author">${book.author}</span></span>
    </label>`;
  }

  function markPill(earned) {
    return `<span class="mark-pill${earned ? ' is-earned' : ''}">${earned ? 'Earned' : 'Not yet'}</span>`;
  }

  function renderForge(data) {
    const month = currentMonth(data);
    const p = month.progress;
    const allBooksDone = p.books.every(Boolean);

    const html = `
      <div class="forge-theme">
        <h3>${month.theme} — ${month.title.split('—')[1] ? month.title.split('—')[1].trim() : month.title}</h3>
        <p>${month.intent}</p>
      </div>

      <div class="forge-block">
        <h4>Book Marks™ ${markPill(allBooksDone)}</h4>
        <p class="forge-prompt">Mark each of this month's four books as read and reflected upon.</p>
        ${[0, 1, 2, 3].map((i) => bookRowHtml(month, i)).join('')}
      </div>

      <div class="forge-block">
        <h4>Research Mark™ ${markPill(p.research.done)}</h4>
        <p class="forge-prompt"><strong>${month.scholarly_reading.title}.</strong> ${month.scholarly_reading.focus}<br />${month.scholarly_reading.prompt}</p>
        <textarea class="forge-textarea" id="forge-research-text">${escapeHtml(p.research.note)}</textarea>
        <div class="forge-actions">
          <button type="button" class="pill-gold" data-action="submit-research">Steward this Research</button>
          <span class="save-hint">${p.research.done ? 'Marked complete — resubmit to update your note.' : ''}</span>
        </div>
      </div>

      <div class="forge-block">
        <h4>Practice Mark™ ${markPill(p.practice.done)}</h4>
        <p class="forge-prompt"><strong>${month.reflective_practice.title}.</strong> ${month.reflective_practice.prompt}</p>
        <textarea class="forge-textarea" id="forge-practice-text">${escapeHtml(p.practice.note)}</textarea>
        <div class="forge-actions">
          <button type="button" class="pill-gold" data-action="submit-practice">Steward this Practice</button>
          <span class="save-hint">${p.practice.done ? 'Marked complete — resubmit to update your note.' : ''}</span>
        </div>
      </div>

      <div class="forge-block">
        <h4>Reflection Mark™ ${markPill(p.reflection.done)}</h4>
        <p class="forge-prompt">Your own reflection on this month — kept in your Legacy Archive.</p>
        <textarea class="forge-textarea" id="forge-reflection-text">${escapeHtml(p.reflection.note)}</textarea>
        <div class="forge-actions">
          <button type="button" class="pill-gold" data-action="submit-reflection">Steward this Reflection</button>
          <span class="save-hint">${p.reflection.done ? 'Marked complete — resubmit to update your note.' : ''}</span>
        </div>
      </div>

      <div class="forge-block" style="margin-bottom:0;">
        <h4>Community Mark™ ${markPill(p.community.done)}</h4>
        <p class="forge-prompt">${month.community_reflection.prompt}</p>
        <textarea class="forge-textarea" id="forge-community-text">${escapeHtml(p.community.note)}</textarea>
        <div class="forge-actions">
          <button type="button" class="pill-gold" data-action="submit-community">Contribute to the Community</button>
          <span class="save-hint">Visible to other members by Member ID.</span>
        </div>
        <div class="community-wall" id="community-wall">
          <p class="community-empty">Loading community reflections…</p>
        </div>
      </div>
    `;
    $('forge-card').innerHTML = html;

    $('forge-card').querySelectorAll('.forge-book').forEach((box) => {
      box.addEventListener('change', async () => {
        const index = Number(box.dataset.index);
        const done = box.checked;
        const result = await postAction({ action: 'toggle-book', monthOrder: data.currentMonthOrder, bookIndex: index, done });
        if (result) {
          applyActionResult(result);
        } else {
          box.checked = !done;
        }
      });
    });

    $('forge-card').querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const action = btn.dataset.action;
        const fieldMap = {
          'submit-research': 'forge-research-text',
          'submit-practice': 'forge-practice-text',
          'submit-reflection': 'forge-reflection-text',
          'submit-community': 'forge-community-text',
        };
        const textEl = $(fieldMap[action]);
        const text = textEl ? textEl.value.trim() : '';
        if (!text) return;
        btn.disabled = true;
        const result = await postAction({ action, monthOrder: data.currentMonthOrder, text, done: true });
        btn.disabled = false;
        if (result) {
          applyActionResult(result);
          if (action === 'submit-community') renderCommunityWall(data.currentMonthOrder);
        }
      });
    });

    renderCommunityWall(data.currentMonthOrder);
  }

  async function renderCommunityWall(monthOrder) {
    const wall = $('community-wall');
    if (!wall) return;
    const { entries } = await fetchCommunity(monthOrder);
    if (!entries || !entries.length) {
      wall.innerHTML = '<p class="community-empty">No community reflections yet this month — be the first to contribute.</p>';
      return;
    }
    wall.innerHTML = entries
      .map(
        (e) => `<div class="community-entry">
          <span class="community-author">${escapeHtml(e.memberId || 'Member')}</span>
          <span class="community-date">${new Date(e.submittedAt).toLocaleDateString()}</span>
          <p style="margin-top:0.3rem;">${escapeHtml(e.text)}</p>
        </div>`
      )
      .join('');
  }

  /* ---------------------------------------------------------------- *
   * THE LEGACY VAULT — regalia + Orders ladder
   * ---------------------------------------------------------------- */
  function renderVault(data) {
    $('vault-crests').innerHTML = data.triarchPhases
      .map((p) => {
        const earned = !!data.phaseCrownsEverEarned[p.key];
        return `<div class="vault-crest${earned ? ' is-earned' : ''}">
          <span class="crest-glyph">${p.mark}</span>
          <span class="crest-name">${p.name}</span>
        </div>`;
      })
      .join('') + `<div class="vault-crest${data.marksSummary.cycleRings > 0 ? ' is-earned' : ''}">
          <span class="crest-glyph">💫</span>
          <span class="crest-name">Cycle Ring${data.marksSummary.cycleRings > 1 ? ' ×' + data.marksSummary.cycleRings : ''}</span>
        </div>`;

    $('orders-ladder').innerHTML = data.orders
      .map(
        (o) => `<div class="order-row${o.key === data.order.key ? ' is-current' : ''}">
          <span class="order-row-name">${o.name}</span>
          <span class="order-row-req">${o.requires}</span>
        </div>`
      )
      .join('');

    $('order-name').textContent = data.order.name;
    $('order-sub').textContent = data.order.description;
  }

  /* ---------------------------------------------------------------- *
   * THE ROYAL ARCHIVE — full syllabus reference
   * ---------------------------------------------------------------- */
  function renderRoyalArchive(data) {
    $('royal-archive').innerHTML = data.months
      .map((m) => {
        const phase = phaseMeta(data, m.phase);
        const tagClass = m.stewarded ? 'is-stewarded' : '';
        const tagText = m.stewarded ? 'Fully stewarded' : m.status === 'upcoming' ? 'Upcoming' : m.status === 'current' ? 'Open now' : 'Open';
        return `<details class="archive-month"${m.status === 'current' ? ' open' : ''}>
          <summary>
            <span class="archive-month-title">${phase.mark} Month ${m.order} · ${m.theme}</span>
            <span class="archive-month-tag ${tagClass}">${tagText}</span>
          </summary>
          <div class="archive-body">
            <p>${m.intent}</p>
            <ul class="archive-books">${m.books.map((b) => `<li>${b.title} — ${b.author}</li>`).join('')}</ul>
            <p><strong>Scholarly Reading:</strong> ${m.scholarly_reading.title}</p>
            <p><strong>Reflective Practice™:</strong> ${m.reflective_practice.title}</p>
          </div>
        </details>`;
      })
      .join('');
  }

  /* ---------------------------------------------------------------- *
   * THE LEGACY ARCHIVE — the member's own written record
   * ---------------------------------------------------------------- */
  function renderLegacyArchive(data) {
    const entries = [];
    data.months.forEach((m) => {
      const p = m.progress;
      if (p.research.note) entries.push({ month: m, kind: 'Research', text: p.research.note });
      if (p.practice.note) entries.push({ month: m, kind: 'Practice', text: p.practice.note });
      if (p.reflection.note) entries.push({ month: m, kind: 'Reflection', text: p.reflection.note });
    });

    if (!entries.length) {
      $('legacy-archive').innerHTML = '<p class="legacy-empty">Your Legacy Archive fills in as you steward each month — nothing recorded yet.</p>';
      return;
    }

    $('legacy-archive').innerHTML = entries
      .map(
        (e) => `<div class="legacy-entry">
          <div class="legacy-entry-head">
            <span class="legacy-entry-month">Month ${e.month.order} · ${e.month.theme}</span>
            <span class="legacy-entry-kind">${e.kind}</span>
          </div>
          <p>${escapeHtml(e.text)}</p>
        </div>`
      )
      .join('');
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function renderAll(data) {
    state.data = data;
    $('cycle-number').textContent = data.cycleNumber;
    $('current-theme-word').textContent = currentMonth(data).theme;
    renderRail(data);
    renderTreasury(data);
    renderForge(data);
    renderVault(data);
    renderRoyalArchive(data);
    renderLegacyArchive(data);
    showSection('library-dashboard');
  }

  function applyActionResult(result) {
    if (!state.data) return;
    const month = state.data.months.find((m) => m.order === result.monthOrder);
    if (month) {
      month.progress = result.progress;
      month.stewarded = result.stewarded;
    }
    state.data.phaseCrowns = result.phaseCrowns;
    state.data.order = result.order;
    state.data.marksSummary = result.marksSummary;
    if (result.newlyEarned && result.newlyEarned.length) {
      // Re-derive phaseCrownsEverEarned locally so the Vault reflects a
      // freshly-earned crown/ring immediately, without a full refetch.
      result.newlyEarned.forEach((n) => {
        if (n.type === 'phase-crown') state.data.phaseCrownsEverEarned[n.phase] = true;
      });
    }
    renderRail(state.data);
    renderTreasury(state.data);
    renderVault(state.data);
    renderForge(state.data);
  }

  async function boot() {
    showSection('library-loading');
    const result = await fetchView();
    if (result.status === 401) {
      showSection('library-signed-out');
      return;
    }
    if (result.status === 403) {
      showSection('library-not-enrolled');
      return;
    }
    if (!result.ok) {
      showSection('library-error');
      return;
    }

    const data = result.data;
    if (!data.onboarded) {
      renderOnboarding(data);
      $('onboarding-overlay').hidden = false;
    }
    renderAll(data);
  }

  document.addEventListener('DOMContentLoaded', () => {
    boot();

    const beginBtn = $('onboarding-begin');
    if (beginBtn) {
      beginBtn.addEventListener('click', async () => {
        await postAction({ action: 'onboard' });
        $('onboarding-overlay').hidden = true;
        if (state.data) state.data.onboarded = true;
      });
    }
  });
})();
