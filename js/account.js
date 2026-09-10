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

  // Console-facing "bay" names for the same phase keys used everywhere
  // else (pricing.json, buildAccountView). Display-only — never sent
  // anywhere, so the underlying phase strings stay the source of truth.
  const BAY_NAME = {
    'Phase I · Foundations': 'Foundations Bay',
    'Phase II · Infrastructure Planning & Management': 'Planning Deck',
    'Phase III · Internal Operating Systems': 'Operating Core',
    'Phase IV · Preservation': 'Preservation Vault',
    'Build · Founders Organization': 'Founders Bay',
  };

  // The flight-path track shown above the dashboard: Welcome, the four
  // numbered phases, then Preservation as the final leg. Founders
  // Organization is a parallel track (not a phase), so it isn't a node
  // here — it still renders as its own phase-group below the track.
  const TRACK_PHASES = [
    'Phase I · Foundations',
    'Phase II · Infrastructure Planning & Management',
    'Phase III · Internal Operating Systems',
    'Phase IV · Preservation',
  ];
  const TRACK_LABEL = {
    'Phase I · Foundations': 'Foundations',
    'Phase II · Infrastructure Planning & Management': 'Planning',
    'Phase III · Internal Operating Systems': 'Operating',
    'Phase IV · Preservation': 'Preservation',
  };

  const $ = (id) => document.getElementById(id);

  function show(id) {
    ['account-loading', 'account-confirming', 'account-signed-out', 'account-dashboard', 'account-error'].forEach((sec) => {
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

  function membershipLabel(m) {
    if (!m) return 'Not active';
    if (m.status === 'active') return `Active · billed ${m.interval === 'year' ? 'annually' : 'monthly'}`;
    return 'Canceled';
  }

  function itemCard({ name, actionsHtml }) {
    const div = document.createElement('div');
    div.className = 'card item-card';
    div.innerHTML = `<h3 class="item-name">${name}</h3><div class="item-actions">${actionsHtml}</div>`;
    return div;
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

    const nodes = [{ key: '__welcome', label: 'Welcome', unlocked: true }].concat(
      TRACK_PHASES.map((phase) => ({ key: phase, label: TRACK_LABEL[phase], unlocked: data.hasFullCatalog || unlockedPhases.has(phase) }))
    );

    let currentAssigned = false;
    nodes.forEach((node) => {
      const el = document.createElement('div');
      const isCurrent = !node.unlocked && !currentAssigned;
      if (isCurrent) currentAssigned = true;
      el.className = 'phase-node' + (node.unlocked ? ' is-unlocked' : isCurrent ? ' is-current' : ' is-locked');
      el.innerHTML = `<span class="node-connector"></span><span class="node-dot"></span><span class="node-label">${node.label}</span>`;
      rail.appendChild(el);
    });
  }

  const PILOT_DISMISS_KEY = 'collab_pilot_dismissed';

  function pilotMessage(data) {
    const ownedCount = data.owned.length;
    const lockedCount = (data.locked || []).length;
    if (data.hasFullCatalog && lockedCount === 0) {
      return `All four phases are charted, <strong>${(data.memberId || 'Commander')}</strong>. Preservation Vault is fully stocked — welcome to the full infrastructure.`;
    }
    if (ownedCount === 0) {
      return `Welcome aboard, <strong>${data.memberId || 'Commander'}</strong>. Foundations Bay is your first stop — everything else charts from there.`;
    }
    if (lockedCount > 0) {
      return `Good progress. ${lockedCount} more module${lockedCount === 1 ? '' : 's'} left to bring online across the flight path.`;
    }
    return `Systems nominal, <strong>${data.memberId || 'Commander'}</strong>. Your console is up to date.`;
  }

  function renderPilot(data) {
    const wrap = $('pilot-companion');
    if (!wrap) return;
    $('pilot-message').innerHTML = pilotMessage(data);
    wrap.hidden = false;
    if (sessionStorage.getItem(PILOT_DISMISS_KEY)) {
      wrap.classList.add('pilot--dismissed');
    }
  }

  function renderDashboard(data) {
    $('account-email').textContent = data.email;
    $('account-member-id').textContent = `Member ID: ${data.memberId || '—'}`;

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

    renderPhaseTrack(data);
    renderPilot(data);

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
        grid.appendChild(itemCard({ name: item.name, actionsHtml: actions }));
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
      show('account-signed-out');
      return;
    }
    renderDashboard(data);
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
        renderDashboard(data);
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
        renderDashboard(data);
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

    const pilotAvatar = document.getElementById('pilot-avatar');
    const pilotClose = document.getElementById('pilot-close');
    const pilotWrap = document.getElementById('pilot-companion');
    if (pilotAvatar && pilotWrap) {
      const toggle = () => {
        pilotWrap.classList.toggle('pilot--dismissed');
        if (pilotWrap.classList.contains('pilot--dismissed')) {
          sessionStorage.setItem(PILOT_DISMISS_KEY, '1');
        } else {
          sessionStorage.removeItem(PILOT_DISMISS_KEY);
        }
      };
      pilotAvatar.addEventListener('click', toggle);
      pilotAvatar.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      });
    }
    if (pilotClose && pilotWrap) {
      pilotClose.addEventListener('click', () => {
        pilotWrap.classList.add('pilot--dismissed');
        sessionStorage.setItem(PILOT_DISMISS_KEY, '1');
      });
    }

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
