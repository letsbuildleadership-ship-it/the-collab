/* ------------------------------------------------------------------ *
 * Account dashboard: signs the customer in (either via a fresh Stripe
 * checkout redirect, a saved access link, or an existing cookie), then
 * renders their entitlements grouped by the four phases, plus membership
 * status and the download links for everything they own.
 * ------------------------------------------------------------------ */
(function () {
  const PHASE_ORDER = [
    'Phase I · Foundations',
    'Phase II · Infrastructure Planning & Management',
    'Phase III · Internal Operating Systems',
    'Phase IV · Preservation',
    'Build · Founders Organization',
  ];

  // Console-facing TRIARCH™ names for the same phase keys used everywhere
  // else (pricing.json, buildAccountView). Display-only — never sent
  // anywhere, so the underlying phase strings stay the source of truth.
  const BAY_NAME = {
    'Phase I · Foundations': '👑 CROWN — Foundations',
    'Phase II · Infrastructure Planning & Management': '⚜️ SCEPTER — Infrastructure Planning & Management',
    'Phase III · Internal Operating Systems': '💍 SIGNET — Internal Operating Systems',
    'Phase IV · Preservation': '🏛️ HEIRLOOM — Preservation',
    'Build · Founders Organization': 'Founders Organization',
  };

  // The progression track shown above the dashboard: Welcome, then the
  // four TRIARCH™ phases. Founders Organization is a parallel track (not
  // a phase), so it isn't a node here — it still renders as its own
  // phase-group below the track.
  const TRACK_PHASES = [
    'Phase I · Foundations',
    'Phase II · Infrastructure Planning & Management',
    'Phase III · Internal Operating Systems',
    'Phase IV · Preservation',
  ];
  const TRACK_LABEL = {
    'Phase I · Foundations': 'CROWN',
    'Phase II · Infrastructure Planning & Management': 'SCEPTER',
    'Phase III · Internal Operating Systems': 'SIGNET',
    'Phase IV · Preservation': 'HEIRLOOM',
  };

  // Generic 3-step refinement checklist shown under every owned item — a
  // lightweight engagement layer on top of the PDF download, not a gate
  // on it (download access is unchanged). Progress persists server-side
  // via progress.js so it follows the member across devices.
  const ACTIVITY_STEPS = ['Review the material', 'Apply it to your work', 'Log your takeaway'];

  const state = { data: null };

  const $ = (id) => document.getElementById(id);

  function show(id) {
    ['account-loading', 'account-confirming', 'account-seat-invite', 'account-signed-out', 'account-dashboard', 'account-error'].forEach((sec) => {
      const el = $(sec);
      if (el) el.hidden = sec !== id;
    });
  }

  async function verifySession(sessionId) {
    const res = await fetch(`/.netlify/functions/verify-session?session_id=${encodeURIComponent(sessionId)}`, {
      credentials: 'include',
    });
    return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) };
  }

  async function fetchMe(tokenParam) {
    const url = tokenParam ? `/.netlify/functions/me?token=${encodeURIComponent(tokenParam)}` : '/.netlify/functions/me';
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) return null;
    return res.json();
  }

  async function loginWithMemberId(memberId, password) {
    const res = await fetch('/.netlify/functions/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, password }),
    });
    if (!res.ok) return null;
    return res.json();
  }

  async function postProgress(itemKey, stepIndex, done) {
    const res = await fetch('/.netlify/functions/progress', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemKey, stepIndex, done }),
    });
    if (!res.ok) return null;
    return res.json();
  }

  async function savePassword(password) {
    const res = await fetch('/.netlify/functions/set-password', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    return res.ok;
  }

  function extractToken(raw) {
    const trimmed = raw.trim();
    try {
      const url = new URL(trimmed);
      const t = url.searchParams.get('token');
      if (t) return t;
    } catch (e) {
      /* not a URL — treat the whole input as a bare token */
    }
    return trimmed;
  }

  function formatShortDate(iso) {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function membershipLabel(m) {
    if (!m) return 'Not active';
    if (m.status === 'active' && m.source === 'partnership') return `Active · Partnership through ${formatShortDate(m.currentPeriodEnd)}`;
    if (m.status === 'active') return `Active · billed ${m.interval === 'year' ? 'annually' : 'monthly'}`;
    if (m.status === 'expired') {
      const plan = (m.renewal || [])[0];
      return plan && plan.payment_link
        ? `Partnership term ended · <a href="${plan.payment_link}" style="text-decoration:underline;">Renew at ${plan.price_display}</a>`
        : 'Partnership term ended';
    }
    return 'Canceled';
  }

  function missionChecklistHtml(key) {
    const done = new Set(((state.data && state.data.activityProgress) || {})[key] || []);
    const allDone = ACTIVITY_STEPS.every((_, i) => done.has(i));
    const rows = ACTIVITY_STEPS.map(
      (label, i) => `
      <label class="mission-step-row">
        <input type="checkbox" class="mission-step" data-item-key="${key}" data-step-index="${i}" ${done.has(i) ? 'checked' : ''} />
        <span>${label}</span>
      </label>`
    ).join('');
    return `<div class="mission-checklist${allDone ? ' is-complete' : ''}">
      <p class="mission-label">${allDone ? 'Refined' : 'Refinement'}</p>
      ${rows}
    </div>`;
  }

  function itemCard({ name, actionsHtml, key }) {
    const div = document.createElement('div');
    div.className = 'card item-card';
    div.innerHTML = `<h3 class="item-name">${name}</h3><div class="item-actions">${actionsHtml}</div>${key ? missionChecklistHtml(key) : ''}`;
    return div;
  }

  function phaseIsCertified(phase, data) {
    const items = data.owned.filter((i) => i.phase === phase);
    if (!items.length) return false;
    const progress = data.activityProgress || {};
    return items.every((item) => {
      const done = new Set(progress[item.key] || []);
      return ACTIVITY_STEPS.every((_, i) => done.has(i));
    });
  }

  function statusDotHtml(isActive) {
    return `<span class="system-status-dot${isActive ? ' is-online' : ''}"></span>`;
  }

  /**
   * The flight-path track above the dashboard: one node per phase, plus
   * a leading "Welcome" node that's always lit (membership/library/
   * journal benefits live there). A phase is "unlocked" once the member
   * owns anything in it (or holds full-catalog membership), "current"
   * if it's the first not-yet-unlocked phase, else "locked".
   */
  function renderPhaseTrack(data) {
    const rail = $('phase-track-rail');
    const track = $('phase-track');
    if (!rail || !track) return;

    const unlockedPhases = new Set();
    data.owned.forEach((item) => {
      if (item.phase) unlockedPhases.add(item.phase);
    });

    rail.innerHTML = '';
    track.hidden = false;

    const nodes = [{ key: '__welcome', label: 'Welcome', unlocked: true, certified: false }].concat(
      TRACK_PHASES.map((phase) => ({
        key: phase,
        label: TRACK_LABEL[phase],
        unlocked: data.hasFullCatalog || unlockedPhases.has(phase),
        certified: phaseIsCertified(phase, data),
      }))
    );

    let currentAssigned = false;
    nodes.forEach((node) => {
      const el = document.createElement('div');
      const isCurrent = !node.unlocked && !currentAssigned;
      if (isCurrent) currentAssigned = true;
      el.className =
        'phase-node' +
        (node.unlocked ? ' is-unlocked' : isCurrent ? ' is-current' : ' is-locked') +
        (node.certified ? ' is-certified' : '');
      el.innerHTML = `<span class="node-connector"></span><span class="node-dot">${node.certified ? '👑' : ''}</span><span class="node-label">${node.label}</span>`;
      rail.appendChild(el);
    });
  }

  const STEWARD_NOTE_DISMISS_KEY = 'collab_steward_note_dismissed';

  function openRefinementCount(data) {
    const progress = data.activityProgress || {};
    return data.owned.filter((item) => item.pdf_file || item.kind === 'product').filter((item) => {
      const done = new Set(progress[item.key] || []);
      return !ACTIVITY_STEPS.every((_, i) => done.has(i));
    }).length;
  }

  function stewardMessage(data) {
    const ownedCount = data.owned.length;
    const lockedCount = (data.locked || []).length;
    const openRefinements = openRefinementCount(data);
    const memberId = data.memberId || 'Member';
    if (data.hasFullCatalog && lockedCount === 0 && openRefinements === 0 && ownedCount > 0) {
      return `All four phases of the TRIARCH™ are charted and refined, <strong>${memberId}</strong>. Your infrastructure stands complete.`;
    }
    if (ownedCount === 0) {
      return `Welcome, <strong>${memberId}</strong>. CROWN is your first phase — everything else is built on it.`;
    }
    if (openRefinements > 0) {
      return `${openRefinements} refinement${openRefinements === 1 ? '' : 's'} still open. Complete a module's three steps to bring its phase fully online.`;
    }
    if (lockedCount > 0) {
      return `Good progress. ${lockedCount} more module${lockedCount === 1 ? '' : 's'} left to bring into the TRIARCH™.`;
    }
    return `Your console is current, <strong>${memberId}</strong>.`;
  }

  function renderStewardNote(data) {
    const wrap = $('steward-note-wrap');
    if (!wrap) return;
    const dismissed = sessionStorage.getItem(STEWARD_NOTE_DISMISS_KEY);
    if (dismissed) {
      wrap.innerHTML = '';
      return;
    }
    wrap.innerHTML = `<div class="steward-note" id="steward-note">
      <div>
        <span class="steward-note-label">Steward's Note</span>
        <span>${stewardMessage(data)}</span>
      </div>
      <button type="button" class="steward-close" id="steward-note-close" aria-label="Dismiss">×</button>
    </div>`;
  }

  function formatRecognizedDate(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return iso;
    }
  }

  function renderFounderCard(data) {
    const wrap = $('founder-card-group');
    if (!wrap) return;
    const founder = data.founder;
    if (!founder) {
      wrap.hidden = true;
      wrap.innerHTML = '';
      return;
    }
    wrap.hidden = false;
    wrap.innerHTML = `
      <div class="founder-card">
        <div class="founder-card-badge">Founder Recognition</div>
        <div class="founder-card-grid">
          <div>
            <span class="founder-card-label">Founder Level</span>
            <strong class="founder-card-value">${founder.levelLabel}</strong>
          </div>
          <div>
            <span class="founder-card-label">Founder Number</span>
            <strong class="founder-card-value">${founder.founderNumber}</strong>
          </div>
          <div>
            <span class="founder-card-label">Member</span>
            <strong class="founder-card-value">${data.name || data.memberId || '—'}</strong>
          </div>
          <div>
            <span class="founder-card-label">Recognized</span>
            <strong class="founder-card-value">${formatRecognizedDate(founder.recognizedAt)}</strong>
          </div>
        </div>
        <p class="founder-card-benefit">Permanent thank-you benefit: <strong>20% off</strong> all eligible future products from The Co.LLab™, applied automatically at checkout whenever you're signed in.</p>
        <p class="founder-card-copy">Founder participation supports The Co.LLab™'s Omnidirectional Enterprise™ model — value, authority, intelligence, IP, and opportunity moving in multiple directions rather than purely top-down. As a Founder, you help strengthen Leadership Infrastructure™ and the ecosystem connecting creators, businesses, nonprofits, organizations, and enterprise — turning human potential into performance, sustainable enterprise value, and lasting legacy.</p>
      </div>`;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /* ---------------------------------------------------------------- *
   * Partnership seats: the purchaser's roster and invite links, and the
   * invite-claim screen a teammate lands on (?seat_invite=CODE).
   * ---------------------------------------------------------------- */
  const SEAT_INVITE_KEY = 'collab_seat_invite';

  async function seatsApi(body) {
    const res = await fetch('/.netlify/functions/partnership-seats', body
      ? { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      : { credentials: 'include' });
    let data = {};
    try { data = await res.json(); } catch (e) { /* empty */ }
    return { ok: res.ok, status: res.status, data };
  }

  function seatRosterHtml(v) {
    const holders = (v.holders || []).map((h) => `<li style="display:flex; justify-content:space-between; gap:1rem; align-items:center; padding:0.5rem 0; border-top:1px solid var(--hairline);">
        <span>${esc(h.email)} <span style="opacity:0.7;">· ${esc(h.memberId || '')}</span></span>
        <button type="button" class="pill mini" data-seat-remove="${esc(h.memberId || '')}" data-seat-email="${esc(h.email)}">Remove</button>
      </li>`).join('');
    const invites = (v.invites || []).map((i) => `<li style="display:flex; justify-content:space-between; gap:1rem; align-items:center; padding:0.5rem 0; border-top:1px solid var(--hairline); flex-wrap:wrap;">
        <input type="text" readonly value="${esc(i.link)}" style="flex:1; min-width:200px; background:transparent; border:1px solid var(--hairline-strong); border-radius:999px; padding:0.45em 0.9em; color:var(--white); font-family:var(--font); font-size:0.8rem;" />
        <span style="display:flex; gap:0.4rem;"><button type="button" class="pill mini" data-seat-copy="${esc(i.link)}">Copy</button><button type="button" class="pill mini" data-seat-revoke="${esc(i.code)}">Revoke</button></span>
      </li>`).join('');
    const add = v.free > 0
      ? `<button type="button" class="pill pill--solid" id="seat-invite-create" style="margin-top:1rem;">Create invite link <span class="arrow">→</span></button>
         <p class="founder-card-copy" style="font-size:0.8rem;">Each link works once and expires in 14 days. Share it only with the person taking the seat.</p>`
      : '';
    return `<div style="margin-top:1.5rem;">
      <span class="founder-card-label">Seats</span>
      <strong class="founder-card-value" style="display:block;">${v.used} of ${v.seats} in use</strong>
      <ul style="list-style:none; padding:0; margin:0.75rem 0 0;">
        <li style="padding:0.5rem 0;">You (purchaser)</li>${holders}${invites}
      </ul>
      ${add}
      <p class="subhead" id="seat-error" style="font-size:0.85rem;" hidden></p>
    </div>`;
  }

  async function loadSeatRoster() {
    const el = $('seat-roster');
    if (!el) return;
    const r = await seatsApi();
    if (r.ok && r.data.role === 'purchaser' && r.data.seats > 1) el.innerHTML = seatRosterHtml(r.data);
  }

  async function seatAction(body) {
    const r = await seatsApi(body);
    const el = $('seat-roster');
    if (r.ok && el) el.innerHTML = seatRosterHtml(r.data);
    else if ($('seat-error')) { $('seat-error').textContent = r.data.error || 'Something went wrong.'; $('seat-error').hidden = false; }
  }

  function showSeatInvite(signedInData) {
    show('account-seat-invite');
    const emailInput = $('seat-invite-email');
    if (signedInData) {
      emailInput.hidden = true;
      $('seat-invite-copy').textContent = `Accept to add this partnership seat to your account (${signedInData.email}).`;
      $('seat-invite-signin').hidden = true;
    } else {
      emailInput.hidden = false;
      emailInput.required = true;
      $('seat-invite-copy').textContent = 'Enter your email to create your Co.LLab™ account and accept the seat.';
      $('seat-invite-signin').hidden = false;
    }
  }

  async function claimSeat(code, email) {
    const r = await seatsApi({ action: 'claim', code, email: email || undefined });
    if (r.ok) {
      try { sessionStorage.removeItem(SEAT_INVITE_KEY); } catch (e) { /* storage unavailable */ }
      const data = await fetchMe(null);
      if (data) renderDashboard(data);
      else show('account-signed-out');
      return;
    }
    if (r.data.needsSignIn) {
      $('seat-invite-error').textContent = r.data.error;
      $('seat-invite-error').hidden = false;
      return;
    }
    $('seat-invite-error').textContent = r.data.error || 'This invite could not be accepted.';
    $('seat-invite-error').hidden = false;
  }

  function pendingInvite() {
    try { return sessionStorage.getItem(SEAT_INVITE_KEY); } catch (e) { return null; }
  }

  /** After any sign-in: if a seat invite is waiting, offer it; else the dashboard. */
  function afterSignIn(data) {
    if (pendingInvite()) showSeatInvite(data);
    else renderDashboard(data);
  }

  function seatPanelHtml(seat) {
    return `<div class="founder-card" style="margin-top:2rem;">
        <div class="founder-card-badge">Omnidirectional Enterprise™ Partnership · ${esc(seat.tierLabel || '')} seat</div>
        <h3 style="margin:0.75rem 0 0;">Access through your organization's partnership</h3>
        <p class="founder-card-copy">You hold a seat on a ${esc(seat.tierLabel || '')} partnership${seat.sponsorName ? ` purchased by ${esc(seat.sponsorName)}` : ''}. Memberships included through ${formatShortDate(seat.expiresAt)}. Your access continues while you hold the seat. Use is personal to you under the standard <a href="ip-license.html" style="text-decoration:underline;">Co.LLab™ IP license</a>.</p>
      </div>`;
  }

  /* Omnidirectional Enterprise™ Partnership: term status, and at the end
   * of the term, every membership offered at its regular price. */
  function renderPartnership(data) {
    const wrap = $('partnership-group');
    if (!wrap) return;
    const p = data.partnership;
    if (!p && data.seat) {
      wrap.innerHTML = seatPanelHtml(data.seat);
      wrap.hidden = false;
      return;
    }
    if (!p) {
      wrap.hidden = true;
      wrap.innerHTML = '';
      return;
    }
    const r = p.renewal || { status: 'active', options: [] };
    const end = formatShortDate(p.expiresAt);
    let heading;
    let copy;
    if (r.status === 'ended') {
      heading = 'Your Partnership membership term has ended';
      copy = `Thank you for partnering with The Co.LLab™. Every product and Blueprint™ issue from your Partnership is still yours. Continue any or all of our memberships at their regular prices:`;
    } else if (r.status === 'ending-soon') {
      heading = `Your memberships are included through ${end}`;
      copy = `${r.daysLeft} day${r.daysLeft === 1 ? '' : 's'} left in your Partnership term. To keep going without a gap, continue any or all of our memberships at their regular prices:`;
    } else {
      heading = `Memberships included through ${end}`;
      copy = 'Your one-time Partnership includes every membership for 12 months. Nothing renews automatically. Near the end of your term, you can continue any or all memberships at their regular prices.';
    }

    const options = (r.options || [])
      .map((o) => {
        const plans = (o.plans || [])
          .filter((pl) => pl.payment_link)
          .map((pl) => `<a class="pill" href="${pl.payment_link}">${pl.price_display} <span class="arrow">→</span></a>`)
          .join(' ');
        return `<div class="card is-visible" style="text-align:left;">
          <span class="num">${o.name}</span>
          <p>${o.description || ''}</p>
          <div style="display:flex; gap:0.6rem; flex-wrap:wrap; margin-top:auto;">${plans}</div>
        </div>`;
      })
      .join('');

    const recognition = `<p class="founder-card-copy" style="margin-top:0.5rem;"><strong>Recognized ${esc(p.tierLabel === 'Omnidirectional' ? 'Omnidirectional Enterprise™' : p.tierLabel)} partner</strong> since ${formatShortDate(p.purchasedAt)}.</p>`;
    const engagement = p.engagement
      ? `<div style="margin-top:1.25rem;"><span class="founder-card-label">Included session</span>
           <strong class="founder-card-value" style="display:block;">${esc(p.engagement.label)}</strong>
           <p class="founder-card-copy" style="font-size:0.85rem;">${esc(p.engagement.format)} To schedule, email <a href="mailto:letsbuildleadership@gmail.com" style="text-decoration:underline;">letsbuildleadership@gmail.com</a>.</p></div>`
      : '';

    wrap.innerHTML = `<div class="founder-card" style="margin-top:2rem;">
        <div class="founder-card-badge">Omnidirectional Enterprise™ Partnership · ${esc(p.tierLabel || '')}</div>
        <h3 style="margin:0.75rem 0 0;">${heading}</h3>
        ${recognition}
        <p class="founder-card-copy">${copy}</p>
        ${options ? `<div class="grid grid-3" style="margin-top:1.25rem;">${options}</div>` : ''}
        ${engagement}
        <div id="seat-roster"></div>
      </div>`;
    wrap.hidden = false;
    if ((p.seats || 1) > 1) loadSeatRoster();
  }

  function renderDashboard(data) {
    data.activityProgress = data.activityProgress || {};
    state.data = data;

    $('account-email').textContent = data.email;
    $('account-member-id').textContent = `Member ID: ${data.memberId || '—'}`;
    renderFounderCard(data);
    renderPartnership(data);

    if (!data.hasPassword && data.memberId) {
      $('create-password-member-id').textContent = data.memberId;
      $('create-password-callout').hidden = false;
    } else {
      $('create-password-callout').hidden = true;
    }

    const membership = data.memberships && data.memberships.membership;
    const libraryCard = data.memberships && data.memberships['library-card'];
    const membershipActive = !!(membership && membership.status === 'active');
    const libraryActive = !!(libraryCard && libraryCard.status === 'active');
    $('membership-status').innerHTML = statusDotHtml(membershipActive) + membershipLabel(membership);
    $('membership-status').className = membershipActive ? 'badge-active' : 'badge-canceled';
    $('library-status').innerHTML = statusDotHtml(libraryActive) + membershipLabel(libraryCard);
    $('library-status').className = libraryActive ? 'badge-active' : 'badge-canceled';
    const libraryLink = $('library-status-link');
    if (libraryLink) {
      libraryLink.innerHTML = libraryActive
        ? '<a href="library.html" style="text-decoration:underline;">Enter the Legacy Library™ →</a>'
        : '<a href="products.html#library-card" style="text-decoration:underline;">View Library Card</a>';
    }

    renderPhaseTrack(data);
    renderStewardNote(data);

    // Group owned items by phase; anything without a phase (memberships,
    // the Journal, bonus items like the Infrastructure Roadmap) goes into
    // the "benefits" shelf instead.
    const byPhase = new Map();
    const benefits = [];

    data.owned.forEach((item) => {
      if (item.phase) {
        if (!byPhase.has(item.phase)) byPhase.set(item.phase, []);
        byPhase.get(item.phase).push(item);
      } else {
        benefits.push(item);
      }
    });

    const benefitsGroup = $('benefits-group');
    const benefitsList = $('benefits-list');
    benefitsList.innerHTML = '';
    if (benefits.length) {
      benefitsGroup.hidden = false;
      benefits.forEach((item) => {
        const actions = item.pdf_file
          ? `<a class="pill pill--solid" href="/.netlify/functions/download?product=${encodeURIComponent(item.key)}" target="_blank" rel="noopener">Download PDF <span class="arrow">→</span></a>`
          : `<span class="tag">Access included</span>`;
        benefitsList.appendChild(itemCard({ name: item.name, actionsHtml: actions, key: item.pdf_file ? item.key : null }));
      });
    }

    const phaseGroups = $('phase-groups');
    phaseGroups.innerHTML = '';
    PHASE_ORDER.forEach((phase) => {
      const items = byPhase.get(phase);
      if (!items || !items.length) return;
      const section = document.createElement('div');
      section.className = 'phase-group';
      const heading = document.createElement('h3');
      heading.textContent = BAY_NAME[phase] || phase;
      const grid = document.createElement('div');
      grid.className = 'grid grid-3';
      items.forEach((item) => {
        const actions = `<a class="pill pill--solid" href="/.netlify/functions/download?product=${encodeURIComponent(item.key)}" target="_blank" rel="noopener">Download PDF <span class="arrow">→</span></a>`;
        grid.appendChild(itemCard({ name: item.name, actionsHtml: actions, key: item.key }));
      });
      section.appendChild(heading);
      section.appendChild(grid);
      phaseGroups.appendChild(section);
    });

    const lockedGroup = $('locked-group');
    const lockedList = $('locked-list');
    lockedList.innerHTML = '';
    if (data.locked && data.locked.length) {
      lockedGroup.hidden = false;
      data.locked.forEach((item) => {
        const actions = `<a class="pill pill--accent" href="${item.payment_link}" target="_blank" rel="noopener">${item.price_display} <span class="arrow">→</span></a>`;
        lockedList.appendChild(itemCard({ name: item.name, actionsHtml: actions }));
      });
    } else {
      lockedGroup.hidden = true;
    }

    // Show the "save your access link" callout once per fresh sign-in
    // (tracked in sessionStorage so it doesn't nag on every visit).
    if (data.restoreToken && !sessionStorage.getItem('collab_link_seen')) {
      const link = `${location.origin}/pages/account.html?token=${data.restoreToken}`;
      $('save-link-input').value = link;
      $('save-link-callout').hidden = false;
      sessionStorage.setItem('collab_link_seen', '1');
    }

    show('account-dashboard');
  }

  async function boot() {
    show('account-loading');
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('session_id');
    const tokenParam = params.get('token');
    const seatInvite = params.get('seat_invite');
    if (seatInvite) {
      try { sessionStorage.setItem(SEAT_INVITE_KEY, seatInvite); } catch (e) { /* storage unavailable */ }
      history.replaceState({}, '', location.pathname);
    }

    if (sessionId) {
      show('account-confirming');
      let result = await verifySession(sessionId);
      // The webhook usually wins the race, but if Stripe hasn't finished
      // processing the payment yet, retry a couple of times with backoff
      // before giving up.
      let attempts = 0;
      while (!result.ok && result.status === 202 && attempts < 4) {
        await new Promise((r) => setTimeout(r, 1500 * (attempts + 1)));
        result = await verifySession(sessionId);
        attempts += 1;
      }
      // Strip session_id/product from the URL either way, so a refresh
      // doesn't re-run checkout verification.
      history.replaceState({}, '', location.pathname);

      if (!result.ok && result.status !== 202) {
        $('account-error-message').textContent = 'We could not confirm your purchase yet. If you were just charged, refresh this page in a minute — it usually resolves on its own.';
        show('account-error');
        return;
      }
    }

    const data = await fetchMe(tokenParam);
    if (tokenParam) history.replaceState({}, '', location.pathname);

    if (!data) {
      if (pendingInvite()) showSeatInvite(null);
      else show('account-signed-out');
      return;
    }
    afterSignIn(data);
  }

  document.addEventListener('DOMContentLoaded', () => {
    boot();

    const form = document.getElementById('restore-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const raw = document.getElementById('restore-input').value;
        if (!raw.trim()) return;
        const token = extractToken(raw);
        const data = await fetchMe(token);
        if (!data) {
          document.getElementById('restore-error').style.display = 'block';
          return;
        }
        history.replaceState({}, '', location.pathname);
        afterSignIn(data);
      });
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const memberId = document.getElementById('login-member-id').value.trim();
        const password = document.getElementById('login-password').value;
        if (!memberId || !password) return;
        const data = await loginWithMemberId(memberId, password);
        if (!data) {
          document.getElementById('login-error').style.display = 'block';
          return;
        }
        document.getElementById('login-error').style.display = 'none';
        afterSignIn(data);
      });
    }

    const createPasswordForm = document.getElementById('create-password-form');
    if (createPasswordForm) {
      createPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('create-password-input');
        const password = input.value;
        if (password.length < 8) return;
        const ok = await savePassword(password);
        if (ok) {
          input.value = '';
          document.getElementById('create-password-callout').hidden = true;
        }
      });
    }

    const seatForm = document.getElementById('seat-invite-form');
    if (seatForm) {
      seatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = pendingInvite();
        if (!code) return;
        const emailInput = document.getElementById('seat-invite-email');
        await claimSeat(code, emailInput.hidden ? null : emailInput.value.trim());
      });
    }

    document.addEventListener('click', async (e) => {
      const t = e.target && e.target.closest ? e.target.closest('button, a') : null;
      if (t && t.id === 'seat-invite-signin-link') { e.preventDefault(); show('account-signed-out'); return; }
      if (t && t.id === 'seat-invite-create') { await seatAction({ action: 'invite' }); return; }
      if (t && t.dataset && t.dataset.seatRevoke) { await seatAction({ action: 'revoke-invite', code: t.dataset.seatRevoke }); return; }
      if (t && t.dataset && (t.dataset.seatRemove !== undefined) && t.dataset.seatEmail) {
        if (!confirm(`Remove ${t.dataset.seatEmail} from this partnership? Their access ends immediately.`)) return;
        await seatAction(t.dataset.seatRemove ? { action: 'remove', memberId: t.dataset.seatRemove } : { action: 'remove', email: t.dataset.seatEmail });
        return;
      }
      if (t && t.dataset && t.dataset.seatCopy) {
        try { await navigator.clipboard.writeText(t.dataset.seatCopy); t.textContent = 'Copied'; } catch (err) { /* select manually */ }
        return;
      }

      if (e.target && e.target.id === 'steward-note-close') {
        sessionStorage.setItem(STEWARD_NOTE_DISMISS_KEY, '1');
        const note = document.getElementById('steward-note-wrap');
        if (note) note.innerHTML = '';
      }
    });

    document.addEventListener('change', async (e) => {
      const box = e.target.closest && e.target.closest('.mission-step');
      if (!box || !state.data) return;

      const itemKey = box.dataset.itemKey;
      const stepIndex = Number(box.dataset.stepIndex);
      const done = box.checked;

      const progress = state.data.activityProgress;
      const set = new Set(progress[itemKey] || []);
      if (done) set.add(stepIndex);
      else set.delete(stepIndex);
      progress[itemKey] = Array.from(set);

      const checklist = box.closest('.mission-checklist');
      const allDone = ACTIVITY_STEPS.every((_, i) => set.has(i));
      if (checklist) {
        checklist.classList.toggle('is-complete', allDone);
        const label = checklist.querySelector('.mission-label');
        if (label) label.textContent = allDone ? 'Refined' : 'Refinement';
      }

      renderPhaseTrack(state.data);
      renderStewardNote(state.data);

      const result = await postProgress(itemKey, stepIndex, done);
      if (!result) {
        // Save failed — revert the optimistic UI update.
        box.checked = !done;
        if (done) set.delete(stepIndex);
        else set.add(stepIndex);
        progress[itemKey] = Array.from(set);
        if (checklist) checklist.classList.toggle('is-complete', ACTIVITY_STEPS.every((_, i) => set.has(i)));
        renderPhaseTrack(state.data);
        renderStewardNote(state.data);
      }
    });

    const copyBtn = document.getElementById('save-link-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        const input = document.getElementById('save-link-input');
        input.select();
        try {
          await navigator.clipboard.writeText(input.value);
          copyBtn.textContent = 'Copied';
          setTimeout(() => (copyBtn.textContent = 'Copy'), 1800);
        } catch (e) {
          /* clipboard API unavailable — the input is already selected for manual copy */
        }
      });
    }
  });
})();
