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

  // Display-only ™ on the TRIARCH™ level names (data keeps the plain names).
  const tm = (n) => (/^(CROWN|SCEPTER|SIGNET|HEIRLOOM)$/.test(n) ? n + '™' : n);

  // Console-facing TRIARCH™ names for the same phase keys used everywhere
  // else (pricing.json, buildAccountView). Display-only — never sent
  // anywhere, so the underlying phase strings stay the source of truth.
  const BAY_NAME = {
    'Phase I · Foundations': '👑 CROWN™ — Foundations',
    'Phase II · Infrastructure Planning & Management': '⚜️ SCEPTER™ — Infrastructure Planning & Management',
    'Phase III · Internal Operating Systems': '💍 SIGNET™ — Internal Operating Systems',
    'Phase IV · Preservation': '🏛️ HEIRLOOM™ — Preservation',
    'Build · Founders Organization': 'Founders Organization™',
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
    'Phase I · Foundations': 'CROWN™',
    'Phase II · Infrastructure Planning & Management': 'SCEPTER™',
    'Phase III · Internal Operating Systems': 'SIGNET™',
    'Phase IV · Preservation': 'HEIRLOOM™',
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
      body: JSON.stringify({ identifier: memberId, password }),
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
      <p class="mission-label">${allDone ? 'Quest complete ✓' : 'Quest steps'}</p>
      ${rows}
    </div>`;
  }

  function itemCard({ name, actionsHtml, key }) {
    const div = document.createElement('div');
    div.className = 'card item-card';
    if (key) div.id = `item-${key}`;
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
      return `Welcome, <strong>${memberId}</strong>. CROWN™ is your first phase — everything else is built on it.`;
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
      else location.replace('login.html');
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
    if (p.lifetime) {
      heading = 'Lifetime memberships';
      copy = 'Your Partnership includes every membership for life. Nothing to renew.';
    } else if (r.status === 'ended') {
      heading = 'Your Partnership membership term has ended';
      copy = `Thank you for partnering with The Co.LLab™. Every product and Blueprint™ issue from your Partnership is still yours. Continue any or all of our memberships at their regular prices:`;
    } else if (r.status === 'ending-soon') {
      heading = `Your memberships are included through ${end}`;
      copy = `${r.daysLeft} day${r.daysLeft === 1 ? '' : 's'} left in your Partnership term. To keep going without a gap, continue any or all of our memberships at their regular prices:`;
    } else {
      heading = `Memberships included through ${end}`;
      copy = 'Your one-time Partnership includes every membership for its term. Nothing renews automatically. Near the end of your term, you can continue any or all memberships at their regular prices.';
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


  function snapshotCard(item, buyLabel) {
    const actions = `<a class="pill pill--accent" href="${item.payment_link}" target="_blank" rel="noopener">${buyLabel || 'Buy'} · ${esc(item.price_display)} <span class="arrow">→</span></a>`;
    const card = itemCard({ name: esc(item.name), actionsHtml: actions });
    if (item.description) {
      const desc = document.createElement('p');
      desc.className = 'item-desc';
      desc.textContent = item.description;
      card.insertBefore(desc, card.querySelector('.item-actions'));
    }
    return card;
  }

  /* Founders Organization: what they have (Yours) or the offer (Explore). */
  function renderFoundersSection(data, ownedFounders) {
    const ownedList = $('founders-owned-list');
    ownedList.innerHTML = '';
    ownedFounders.forEach((item) => {
      const actions = `<a class="pill pill--solid" href="/.netlify/functions/download?product=${encodeURIComponent(item.key)}" target="_blank" rel="noopener">Download PDF <span class="arrow">→</span></a>`;
      ownedList.appendChild(itemCard({ name: item.name, actionsHtml: actions }));
    });
    $('founders-owned').hidden = !ownedFounders.length;
    $('portal-founders').hidden = !(data.founder || ownedFounders.length);

    const joinList = $('founders-join-list');
    joinList.innerHTML = '';
    const tiers = data.founderSnapshots || [];
    tiers.forEach((item) => joinList.appendChild(snapshotCard({ ...item, name: item.name.replace(/^The Co\.LLab™ Founders Organization — /, '') }, 'Join')));
    $('founders-join').hidden = !!data.founder || !tiers.length;
  }

  /* Partnership: their panel (Yours) or the four tiers (Explore). */
  function renderPartnershipJoin(data) {
    const has = !!(data.partnership || data.seat);
    $('portal-partnerships').hidden = !has;
    const list = $('partnership-join-list');
    list.innerHTML = '';
    (data.partnershipOffers || []).forEach((t) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `<span class="num">${esc(t.tier)}</span>
        <p class="tier-price">${esc(t.price_display)}</p>
        <p class="item-desc" style="color:#fdf6ec;">${esc(t.tagline || '')}</p>
        <p class="item-desc">${t.seats} seat${t.seats === 1 ? '' : 's'} · ${t.lifetime ? 'Lifetime memberships' : `${(t.term_months || 12) / 12} year${(t.term_months || 12) === 12 ? '' : 's'} of every membership`}</p>
        ${t.payment_link ? `<div class="item-actions"><a class="pill pill--accent" href="${t.payment_link}" target="_blank" rel="noopener">Choose ${esc(t.tier)} <span class="arrow">→</span></a></div>` : ''}`;
      list.appendChild(card);
    });
    $('partnership-join').hidden = has || !(data.partnershipOffers || []).length;
    // Overlap: a Partnership includes every membership, so a paying member
    // is told it replaces their subscription rather than doubling it.
    const mem = (data.memberships || {}).membership;
    const note = $('partnership-member-note');
    if (note) note.hidden = !(mem && mem.status === 'active' && mem.subscriptionId);
  }

  /* .LLab Membership offer, for anyone without an active Membership. */
  function renderMembershipOffer(data) {
    const el = $('offer-membership');
    const offer = data.membershipOffer;
    if (!offer) { el.hidden = true; el.innerHTML = ''; return; }
    const plans = (offer.plans || [])
      .filter((p) => p.payment_link)
      .map((p, i) => `<a class="pill ${i === 0 ? 'pill--solid' : 'pill--accent'}" href="${p.payment_link}" target="_blank" rel="noopener">${esc(p.price_display)} <span class="arrow">→</span></a>`)
      .join('');
    el.innerHTML = `<p class="offer-eyebrow">.LLab Membership™</p>
      <h3 class="offer-title">Unlock all 9 quests</h3>
      <p class="offer-body">${esc(offer.description)}</p>
      <ul class="offer-points">
        <li>All 9 Four Phases products, open while you're a member</li>
        <li>Clear a TRIARCH™ level, win free loot: one product to keep, per level</li>
        <li>Your progress, XP, and levels tracked right here</li>
      </ul>
      <div class="offer-plans">${plans}</div>`;
    el.hidden = false;
  }

  const SHOP_GROUPS = [
    { line: 'four-phases', title: 'Four Phases products', lead: 'The core Leadership Infrastructure™ products. All nine come with .LLab Membership™, or buy one to keep.' },
    { line: 'creator', title: 'Creator Infrastructure™', lead: 'For creators turning a body of work into a lasting venture. Buy one, or win it as level loot.' },
    { line: 'blueprint', title: 'The Blueprint™ series', lead: 'The magazine series behind The Co.LLab™: mission, vision, and the architecture of leadership. Buy an issue, or win it as level loot.' },
    { line: 'other', title: 'More from The Co.LLab™', lead: '' },
  ];

  /* Shop: every product they don't own yet, grouped, with a short pitch. */
  function renderShop(data) {
    const group = $('locked-group');
    const list = $('locked-list');
    list.innerHTML = '';
    const items = data.locked || [];
    SHOP_GROUPS.forEach((g) => {
      const inGroup = items.filter((i) => (i.line || 'other') === g.line);
      if (!inGroup.length) return;
      const wrap = document.createElement('div');
      wrap.className = 'shop-group';
      wrap.innerHTML = `<h4>${esc(g.title)}</h4>${g.lead ? `<p>${esc(g.lead)}</p>` : ''}`;
      const grid = document.createElement('div');
      grid.className = 'grid grid-3';
      inGroup.forEach((item, i) => {
        const card = snapshotCard(item);
        if (i >= 3) card.classList.add('is-extra');
        grid.appendChild(card);
      });
      wrap.appendChild(grid);
      if (inGroup.length > 3) {
        const more = document.createElement('button');
        more.type = 'button';
        more.className = 'pill shop-more';
        more.textContent = `See all ${inGroup.length}`;
        more.addEventListener('click', () => { wrap.classList.add('show-all'); more.remove(); });
        wrap.appendChild(more);
      }
      list.appendChild(wrap);
    });
    $('locked-count').textContent = items.length ? `${items.length} available.` : '';
    group.hidden = !items.length;
  }

  /* The three programs at a glance, at the top of the portal. */
  function renderProgramTiles(data) {
    const el = $('program-tiles');
    if (!el) return;
    const cfg = (state.cfg && state.cfg.sections) || [];
    const name = (type, fallback) => ((cfg.find((s) => s.type === type) || {}).eyebrow) || fallback;
    const rw = data.membershipRewards;
    const tiles = [];
    const f = data.founder;
    tiles.push(f
      ? { type: 'founders', on: true, status: esc(f.levelLabel || 'Founder'), sub: f.founderNumber ? `Founder Number ${esc(f.founderNumber)}` : 'Recognized Founder', cta: 'Your Founder card', href: '#portal-founders' }
      : { type: 'founders', on: false, status: 'Not a Founder yet', sub: 'Founding options from $20', cta: 'See Founder options', href: '#founders-join' });
    const p = data.partnership;
    tiles.push(p
      ? { type: 'partnerships', on: true, status: esc(p.tierLabel), sub: `${p.seats || 1} seat${(p.seats || 1) === 1 ? '' : 's'}${p.lifetime ? ' · Lifetime' : p.expiresAt ? ` · through ${formatShortDate(p.expiresAt)}` : ''}`, cta: 'Your Partnership', href: '#portal-partnerships' }
      : data.seat
        ? { type: 'partnerships', on: true, status: `${esc(data.seat.tierLabel || '')} seat`, sub: 'Through your organization', cta: 'Your seat', href: '#portal-partnerships' }
        : { type: 'partnerships', on: false, status: 'No Partnership yet', sub: 'For organizations and teams', cta: 'See Partnership tiers', href: '#partnership-join' });
    const active = !!(rw && rw.active);
    const mem = (data.memberships || {}).membership;
    const viaPartnership = !!(mem && /^partnership/.test(mem.source || ''));
    const cleared = rw ? rw.tiers.filter((t) => t.completed) : [];
    const top = cleared[cleared.length - 1];
    tiles.push(active
      ? { type: 'llab', on: true, status: 'Active', sub: `${viaPartnership ? 'Included with your Partnership · ' : ''}${top ? `Level ${top.tier} · ${tm(top.name)}` : 'Level 0 · start your first quest'}`, cta: 'Play your quests', href: '#journey-panel' }
      : { type: 'llab', on: false, status: data.memberType === 'free' ? 'Free member' : 'Not active', sub: 'Quests included · analysis with Membership', cta: 'Add Membership for analysis', href: '#offer-membership' });
    const label = { founders: name('founders', 'Founders Organization™'), partnerships: name('partnerships', 'Partnerships'), llab: name('llab', '.LLab Membership™') };
    el.innerHTML = tiles
      .map((t) => `<a class="program-tile${t.on ? ' is-active' : ''}" href="${t.href}"><span class="pt-name">${esc(label[t.type])}</span><span class="pt-status">${t.status}</span><span class="pt-sub">${t.sub}</span><span class="pt-cta">${t.cta} →</span></a>`)
      .join('');
  }

  /* The portal as a game: Four Phases products are quests, TRIARCH™ tiers
   * are levels, and each level cleared unlocks free loot (a product to keep). */
  const LEVEL_ICON = { CROWN: '👑', SCEPTER: '⚜️', SIGNET: '💍', HEIRLOOM: '🏛️' };
  const XP_PER_STEP = 10;

  function shortName(name) {
    return String(name || '').replace(/^\.LLab\s+/, '').replace(/^Leadership Infrastructure\s+/, '');
  }

  function renderJourney(data) {
    const panel = $('journey-panel');
    if (!panel) return;
    const rw = data.membershipRewards;
    const active = !!(rw && rw.active);
    const tiers = (rw && rw.tiers) || [];
    const steps = tiers.reduce((n, t) => n + t.products.reduce((m, p) => m + p.stepsDone, 0), 0);
    const totalSteps = tiers.reduce((n, t) => n + t.products.reduce((m, p) => m + p.stepsTotal, 0), 0);
    const cleared = tiers.filter((t) => t.completed);
    const top = cleared[cleared.length - 1];

    // Player card
    $('game-rank').textContent = top ? `Level ${top.tier} · ${LEVEL_ICON[top.name] || ''} ${tm(top.name)}` : 'Level 0 · Initiate';
    const pct = totalSteps ? Math.round((steps / totalSteps) * 100) : 0;
    $('xp-fill').style.width = `${pct}%`;
    $('xp-text').textContent = `${steps * XP_PER_STEP} / ${totalSteps * XP_PER_STEP} XP`;
    const badge = (on, icon, label) => `<span class="game-badge${on ? ' is-on' : ''}" title="${esc(label)}">${icon}<small>${esc(label)}</small></span>`;
    $('game-badges').innerHTML = [
      badge(active, '★', 'Member'),
      badge(!!data.founder, '◆', 'Founder'),
      badge(!!(data.partnership || data.seat), '⬢', 'Partner'),
      ...tiers.map((t) => badge(t.completed, LEVEL_ICON[t.name] || '•', tm(t.name))),
    ].join('');

    // Current quest
    let q;
    const loot = tiers.find((t) => t.options && t.options.length);
    if (loot) {
      q = { label: 'Loot unlocked', title: `🎁 ${loot.name} loot`, body: `Pick 1 free product (up to $${loot.maxPrice.toLocaleString()}). Yours to keep.`, cta: `<a class="pill pill--solid" href="#rewards-group">Claim loot <span class="arrow">→</span></a>` };
    } else if (active) {
      const level = tiers.find((t) => !t.completed);
      const quest = level && level.products.find((p) => p.stepsDone < p.stepsTotal);
      if (level && quest) {
        q = {
          label: `Current quest · Level ${level.tier} ${tm(level.name)}`,
          title: shortName(quest.name),
          body: `${quest.stepsDone}/${quest.stepsTotal} steps done. Clear every ${tm(level.name)} quest to unlock free loot (up to $${level.maxPrice.toLocaleString()}).`,
          cta: `<a class="pill pill--solid" href="#item-${esc(quest.key)}" data-jump="${esc(quest.key)}">Play quest <span class="arrow">→</span></a>`,
        };
      } else {
        q = { label: 'Game complete', title: '🏆 All 4 levels cleared', body: 'Every quest done. Check the shop below for what to add next.', cta: '' };
      }
    } else {
      const plan = data.membershipOffer && (data.membershipOffer.plans || []).find((p) => p.payment_link);
      const game = (data.gameQuests || []).map((g) => {
        const qs = (data.quests || {})[g.key];
        const label = qs && qs.status === 'done' ? '✓' : qs ? '◐' : '○';
        return `<a class="pill" href="quest.html?key=${encodeURIComponent(g.key)}">${label} ${esc(shortName(g.name))}</a>`;
      }).join(' ');
      q = {
        label: 'Start the game',
        title: 'Work the 9 quests, free',
        body: 'Free members work through every quest across The IV Phases™. Membership analyzes your answers and delivers your outcomes, and opens the levels and loot.',
        cta: `${game} ${plan ? `<a class="pill pill--solid" href="${plan.payment_link}" target="_blank" rel="noopener">Join Membership · ${esc(plan.price_display)} <span class="arrow">→</span></a>` : ''}`,
      };
    }
    $('quest-label').textContent = q.label;
    $('journey-next-title').textContent = q.title;
    $('journey-next-body').textContent = q.body;
    $('journey-next-cta').innerHTML = q.cta;
    panel.hidden = false;
  }

  function jumpTo(key) {
    const el = $(`item-${key}`);
    if (!el) return false;
    const drawer = el.closest('details');
    if (drawer) drawer.open = true;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('is-target');
    setTimeout(() => el.classList.remove('is-target'), 2400);
    return true;
  }

  /* Levels & Loot: one card per TRIARCH™ level. */
  function renderRewards(data) {
    const group = $('rewards-group');
    const list = $('rewards-list');
    const rw = data.membershipRewards;
    list.innerHTML = '';
    if (!rw) { group.hidden = true; return; }
    group.hidden = false;
    rw.tiers.forEach((t) => {
      const done = t.products.reduce((n, p) => n + p.stepsDone, 0);
      const total = t.products.reduce((n, p) => n + p.stepsTotal, 0) || 1;
      const quests = t.products
        .map((p) => {
          const ok = p.stepsDone >= p.stepsTotal;
          return `<li class="${ok ? 'done' : ''}"><a href="#item-${esc(p.key)}" data-jump="${esc(p.key)}">${ok ? '✓' : '○'} ${esc(shortName(p.name))}</a><span>${p.stepsDone}/${p.stepsTotal}</span></li>`;
        })
        .join('');
      let lootHtml;
      if (t.pick) {
        lootHtml = `<p class="loot-state is-won">🎁 Won: ${esc(shortName(t.pick.name))}</p>`;
      } else if (t.options && t.options.length) {
        const opts = t.options.map((o) => `<option value="${esc(o.key)}">${esc(o.name)} (${esc(o.price_display)})</option>`).join('');
        lootHtml = `<p class="loot-state is-ready">🎁 Loot ready: pick 1</p>
          <select data-reward-select="${t.tier}" aria-label="${esc(tm(t.name))} loot">${opts}</select>
          <button type="button" class="pill pill--solid" data-reward-claim="${t.tier}">Claim <span class="arrow">→</span></button>
          <p class="login-error" data-reward-error="${t.tier}" hidden></p>`;
      } else if (t.completed && !rw.active) {
        lootHtml = '<p class="loot-state">🔒 Renew Membership to claim</p>';
      } else if (t.completed) {
        lootHtml = '<p class="loot-state">You own everything in this loot range</p>';
      } else {
        lootHtml = `<p class="loot-state">🔒 Loot: free pick up to $${t.maxPrice.toLocaleString()}</p>`;
      }
      const card = document.createElement('div');
      card.className = `card reward-card${t.completed ? ' is-cleared' : ''}`;
      card.innerHTML = `<div class="level-head"><span class="level-icon">${LEVEL_ICON[t.name] || ''}</span><div><span class="num">Level ${t.tier}</span><h4>${esc(tm(t.name))}${t.completed ? ' · Cleared' : ''}</h4></div></div>
        <div class="xp-bar xp-bar--sm"><span style="width:${Math.round((done / total) * 100)}%"></span></div>
        <ul class="reward-products">${quests}</ul>${lootHtml}`;
      list.appendChild(card);
    });
  }

  async function claimReward(tier) {
    const select = document.querySelector(`[data-reward-select="${tier}"]`);
    const err = document.querySelector(`[data-reward-error="${tier}"]`);
    if (!select) return;
    const res = await fetch('/.netlify/functions/membership-pick', {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier: Number(tier), key: select.value }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { if (err) { err.textContent = data.error || 'Could not claim that reward.'; err.hidden = false; } return; }
    renderDashboard(data);
  }


  function renderDashboard(data) {
    data.activityProgress = data.activityProgress || {};
    state.data = data;

    $('account-email').textContent = data.email;
    const freeNote = $('free-member-note');
    if (freeNote) freeNote.hidden = data.memberType !== 'free';
    const verifyNote = $('email-verify-note');
    if (verifyNote) verifyNote.hidden = data.emailVerified !== false || data.emailEnabled === false;
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
        benefitsList.appendChild(itemCard({ name: item.name, actionsHtml: actions }));
      });
    }

    const freeByPhase = new Map();
    (data.freeTools || []).forEach((tool) => {
      if (!freeByPhase.has(tool.phase)) freeByPhase.set(tool.phase, []);
      freeByPhase.get(tool.phase).push(tool);
    });

    const phaseGroups = $('phase-groups');
    phaseGroups.innerHTML = '';
    const FOUNDERS_PHASE = 'Build · Founders Organization';
    renderFoundersSection(data, byPhase.get(FOUNDERS_PHASE) || []);
    renderPartnershipJoin(data);
    renderRewards(data);

    let openedLevel = false;
    PHASE_ORDER.forEach((phase) => {
      if (phase === FOUNDERS_PHASE) return;
      const items = byPhase.get(phase) || [];
      if (!items.length) return;
      // One drawer per level; the level with the first unfinished quest opens.
      const progress = data.activityProgress || {};
      const doneCount = items.filter((i) => new Set(progress[i.key] || []).size >= ACTIVITY_STEPS.length).length;
      const section = document.createElement('details');
      section.className = 'phase-group drawer level-drawer';
      if (!openedLevel && doneCount < items.length) { section.open = true; openedLevel = true; }
      const heading = document.createElement('summary');
      heading.innerHTML = `${esc(BAY_NAME[phase] || phase)} <span class="drawer-count">${doneCount}/${items.length} done</span>`;
      const grid = document.createElement('div');
      grid.className = 'grid grid-3';
      items.forEach((item) => {
        const qs = (data.quests || {})[item.key];
        const hasQuest = (data.questKeys || []).includes(item.key);
        const questLabel = qs && qs.status === 'done' ? 'View my report' : qs ? 'Continue quest' : 'Start guided quest';
        const questPill = hasQuest ? `<a class="pill pill--solid" href="quest.html?key=${encodeURIComponent(item.key)}">${questLabel} <span class="arrow">→</span></a> ` : '';
        const actions = `${questPill}<a class="pill" href="/.netlify/functions/download?product=${encodeURIComponent(item.key)}" target="_blank" rel="noopener">Download PDF <span class="arrow">→</span></a>`;
        grid.appendChild(itemCard({ name: item.name, actionsHtml: actions, key: item.key }));
      });
      section.appendChild(heading);
      section.appendChild(grid);
      phaseGroups.appendChild(section);
    });

    $('quests-heading').hidden = !phaseGroups.children.length;

    // Free tools drawer, grouped by phase (open by default for free members).
    const toolsGroup = $('free-tools-group');
    const toolsList = $('free-tools-list');
    toolsList.innerHTML = '';
    const toolCount = (data.freeTools || []).length + (data.openQuests || []).length;
    if ((data.openQuests || []).length) {
      const h = document.createElement('h4');
      h.className = 'tool-phase';
      h.textContent = 'Event infrastructure';
      const grid = document.createElement('div');
      grid.className = 'grid grid-3';
      data.openQuests.forEach((oq) => {
        const qs = (data.quests || {})[oq.key];
        const label = qs && qs.status === 'done' ? 'View my report' : qs ? 'Continue quest' : 'Start quest';
        const card = itemCard({ name: esc(oq.name), actionsHtml: `<a class="pill pill--solid" href="quest.html?key=${encodeURIComponent(oq.key)}">${label} <span class="arrow">→</span></a>` });
        const desc = document.createElement('p');
        desc.className = 'item-desc';
        desc.textContent = oq.description;
        card.insertBefore(desc, card.querySelector('.item-actions'));
        grid.appendChild(card);
      });
      toolsList.appendChild(h);
      toolsList.appendChild(grid);
    }
    PHASE_ORDER.forEach((phase) => {
      const tools = freeByPhase.get(phase) || [];
      if (!tools.length) return;
      const h = document.createElement('h4');
      h.className = 'tool-phase';
      h.textContent = BAY_NAME[phase] || phase;
      const grid = document.createElement('div');
      grid.className = 'grid grid-3';
      tools.forEach((tool) => {
        const qs = (data.quests || {})[tool.key];
        const questLabel = qs && qs.status === 'done' ? 'View my report' : qs ? 'Continue quest' : 'Start quest';
        const actions = `<a class="pill pill--solid" href="quest.html?key=${encodeURIComponent(tool.key)}">${questLabel} <span class="arrow">→</span></a> <a class="pill" href="${tool.file}" target="_blank" rel="noopener">Blank PDF <span class="arrow">→</span></a>`;
        const card = itemCard({ name: esc(tool.name), actionsHtml: actions });
        const desc = document.createElement('p');
        desc.className = 'item-desc';
        desc.textContent = tool.description;
        card.insertBefore(desc, card.querySelector('.item-actions'));
        grid.appendChild(card);
      });
      toolsList.appendChild(h);
      toolsList.appendChild(grid);
    });
    toolsGroup.hidden = !toolCount;

    // Completed quest reports live here for good.
    const nameFor = new Map([...(data.freeTools || []), ...(data.openQuests || []), ...(data.owned || [])].map((t) => [t.key, t.name]));
    const reports = Object.keys(data.quests || {}).filter((k) => data.quests[k].status === 'done' && nameFor.has(k)).map((k) => ({ key: k, name: nameFor.get(k) }));
    const reportList = $('quest-reports-list');
    reportList.innerHTML = '';
    reports.forEach((tool) => {
      const when = String(data.quests[tool.key].completedAt || '').slice(0, 10);
      const actions = `<a class="pill pill--solid" href="/.netlify/functions/quest?key=${encodeURIComponent(tool.key)}&pdf=1">Download report (PDF) <span class="arrow">→</span></a> <a class="pill" href="quest.html?key=${encodeURIComponent(tool.key)}">View <span class="arrow">→</span></a>`;
      const card = itemCard({ name: esc(tool.name), actionsHtml: actions });
      const desc = document.createElement('p');
      desc.className = 'item-desc';
      desc.textContent = when ? `Completed ${when}` : 'Completed';
      card.insertBefore(desc, card.querySelector('.item-actions'));
      reportList.appendChild(card);
    });
    $('quest-reports-group').hidden = !reports.length;
    $('directory-link').hidden = !data.directoryEligible;
    $('quest-reports-count').textContent = reports.length ? `${reports.length}` : '';
    $('free-tools-count').textContent = toolCount ? `${toolCount}` : '';

    renderMembershipOffer(data);
    renderShop(data);
    renderProgramTiles(data);

    // Show the "save your access link" callout once per fresh sign-in
    // (tracked in sessionStorage so it doesn't nag on every visit).
    if (data.restoreToken && !sessionStorage.getItem('collab_link_seen')) {
      const link = `${location.origin}/pages/account.html?token=${data.restoreToken}`;
      $('save-link-input').value = link;
      $('save-link-callout').hidden = false;
      sessionStorage.setItem('collab_link_seen', '1');
    }

    renderJourney(data);
    show('account-dashboard');
  }


  /* Member Portal™ sections come from content/portal.json, so new parts of
   * The Co.LLab™ can be added (type "program"), reordered, renamed, or
   * hidden without code changes. The static page is the fallback. */
  /* Member Portal™ settings (content/portal.json): hero text, program
   * names, offer wording, and extra programs added later (type "program"),
   * which appear under Explore more. */
  async function applyPortalConfig() {
    let cfg;
    try {
      const res = await fetch('/content/portal.json', { cache: 'no-cache' });
      if (!res.ok) return;
      cfg = await res.json();
    } catch (e) {
      return;
    }
    state.cfg = cfg;
    if (cfg.eyebrow && $('portal-eyebrow')) $('portal-eyebrow').textContent = cfg.eyebrow;
    if (cfg.intro && $('portal-intro')) $('portal-intro').textContent = cfg.intro;
    const sections = Array.isArray(cfg.sections) ? cfg.sections : [];
    ['founders', 'partnerships'].forEach((type) => {
      const sec = sections.find((x) => x.type === type);
      if (!sec) return;
      const set = (k, v) => { const el = document.querySelector(`[data-offer="${type}-${k}"]`); if (el && v) el.textContent = v; };
      set('eyebrow', sec.eyebrow);
      set('body', sec.description);
      const link = document.querySelector(`[data-offer="${type}-link"]`);
      if (link && sec.link) { link.href = sec.link; link.textContent = `${sec.link_label || 'Learn more'} →`; }
    });
    const programs = $('portal-programs');
    if (programs) {
      programs.innerHTML = sections
        .filter((x) => x.type === 'program' && x.enabled !== false)
        .map((x) => `<div class="offer-block" id="portal-${esc(x.id)}"><p class="offer-eyebrow">${esc(x.eyebrow || '')}</p><h3 class="offer-title">${esc([x.title, x.title_highlight].filter(Boolean).join(' '))}</h3><p class="offer-body">${esc(x.description || '')}</p>${x.link ? `<p class="offer-more"><a href="${esc(x.link)}">${esc(x.link_label || 'Learn more')} →</a></p>` : ''}</div>`)
        .join('');
    }
    if (state.data) renderProgramTiles(state.data);
  }

  async function boot() {
    applyPortalConfig();
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
      else location.replace('login.html');
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
      if (t && t.dataset && t.dataset.jump) { if (jumpTo(t.dataset.jump)) { e.preventDefault(); } return; }
      if (t && t.dataset && t.dataset.rewardClaim) { e.preventDefault(); await claimReward(t.dataset.rewardClaim); return; }
      if (t && t.id === 'seat-invite-signin-link') { e.preventDefault(); location.href = 'login.html'; return; }
      if (t && t.id === 'account-sign-out') {
        e.preventDefault();
        await fetch('/.netlify/functions/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
        location.replace('login.html');
        return;
      }
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
        if (label) label.textContent = allDone ? 'Quest complete ✓' : 'Quest steps';
      }

      renderPhaseTrack(state.data);
      renderStewardNote(state.data);

      const result = await postProgress(itemKey, stepIndex, done);
      if (result && state.data) {
        const fresh = await fetchMe(null);
        if (fresh) { state.data.membershipRewards = fresh.membershipRewards; renderRewards(state.data); renderJourney(state.data); }
      }
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

  // "Send it again" for an unconfirmed free sign-up
  document.addEventListener('click', (e) => {
    const link = e.target.closest && e.target.closest('#email-verify-resend');
    if (!link) return;
    e.preventDefault();
    const status = $('email-verify-status');
    fetch('/.netlify/functions/verify-email', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'resend' }) })
      .then((r) => r.json().catch(() => ({})).then((d) => { status.textContent = r.ok ? ' Sent. Check your inbox.' : ` ${d.error || 'Could not send. Try again later.'}`; }))
      .catch(() => { status.textContent = ' Could not send. Try again later.'; });
  });
})();
