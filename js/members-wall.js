/* Legacy Walls (.LLab Membership on products.html, Partnership on partnership.html): names only, by highest standing ever held. */
(function () {
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  document.addEventListener('DOMContentLoaded', async () => {
    const box = document.getElementById('member-wall-lists');
    if (!box) return;
    try {
      const res = await fetch('/.netlify/functions/members-wall?wall=' + encodeURIComponent(box.dataset.wall || 'llab'));
      if (!res.ok) return;
      const data = await res.json();
      if (!data.total) return;
      box.innerHTML = data.groups
        .filter((g) => g.members.length)
        .map((g) => `<div class="wall-level"><h3 class="wall-level-title">${esc(g.label)}</h3><ul class="wall-grid">${g.members
          .map((m) => `<li class="wall-plaque"><strong class="wall-name">${(m.url ? `<a class="wall-link" href="${esc(m.url)}" target="_blank" rel="sponsored noopener">${esc(m.displayName)} <span aria-hidden="true">↗</span></a>` : esc(m.displayName))}</strong></li>`)
          .join('')}</ul></div>`)
        .join('');
    } catch (err) {
      /* non-fatal */
    }
  });
})();
