/* Public Founder Recognition list on pages/founders.html — every
 * recognized Founder, grouped under their correct Founder level, ordered
 * by permanent sequential Founder Number. Read-only, no sign-in required. */
(function () {
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function renderGroups(data) {
    const container = document.getElementById('founder-recognition-lists');
    if (!container) return;

    if (!data || !data.total) {
      container.innerHTML = '<p class="subhead">Founder Numbers are issued the moment a Founder purchase completes — check back soon.</p>';
      return;
    }

    container.innerHTML = data.groups
      .filter((g) => g.founders.length)
      .map(
        (group) => `
        <div style="margin-bottom:2rem;">
          <h3 style="font-size:0.78rem; letter-spacing:0.14em; text-transform:uppercase; color:var(--filament-1); font-weight:600; margin-bottom:1rem;">${escapeHtml(group.levelLabel)}</h3>
          <div class="grid grid-3">
            ${group.founders
              .map(
                (f) => `
              <div class="card" style="text-align:left;">
                <span class="num">${escapeHtml(f.founderNumber)}</span>
                <h3 style="font-size:1.05rem;">${escapeHtml(f.displayName)}</h3>
              </div>`
              )
              .join('')}
          </div>
        </div>`
      )
      .join('');
  }

  document.addEventListener('DOMContentLoaded', async () => {
    try {
      const res = await fetch('/.netlify/functions/founders-recognition');
      if (!res.ok) return;
      renderGroups(await res.json());
    } catch (err) {
      /* non-fatal — the rest of the page already works */
    }
  });
})();
