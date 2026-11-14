/* The Membership Legacy Wall on pages/login.html: names only, by highest standing ever held. */
(function () {
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  document.addEventListener('DOMContentLoaded', async () => {
    const box = document.getElementById('member-wall-lists');
    if (!box) return;
    try {
      const res = await fetch('/.netlify/functions/members-wall');
      if (!res.ok) return;
      const data = await res.json();
      if (!data.total) return;
      box.innerHTML = data.groups
        .filter((g) => g.members.length)
        .map((g) => `<div class="wall-level"><h3 class="wall-level-title">${esc(g.label)}</h3><ul class="wall-grid">${g.members
          .map((m) => `<li class="wall-plaque"><strong class="wall-name">${esc(m.displayName)}</strong></li>`)
          .join('')}</ul></div>`)
        .join('');
    } catch (err) {
      /* non-fatal */
    }
  });
})();
