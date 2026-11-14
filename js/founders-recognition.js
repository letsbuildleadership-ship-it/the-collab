/* The Founders Wall on pages/founders.html — every recognized Founder,
 * shown permanently by name under their Founder level (highest level
 * first), ordered within a level by permanent sequential Founder Number.
 * Read-only, no sign-in required. */
(function () {
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function year(iso) {
    const d = iso ? new Date(iso) : null;
    return d && !isNaN(d) ? d.getFullYear() : '';
  }

  function renderGroups(data) {
    const container = document.getElementById('founder-recognition-lists');
    if (!container) return;

    if (!data || !data.total) {
      container.innerHTML = '<p class="subhead">The wall is ready. The first Founder Number is issued the moment the first founding purchase completes.</p>';
      return;
    }

    const groups = data.groups.filter((g) => g.founders.length).reverse();
    container.innerHTML = `
      <p class="wall-count"><strong>${data.total}</strong> ${data.total === 1 ? 'Founder' : 'Founders'} and counting</p>
      ${groups
        .map(
          (group) => `
        <div class="wall-level wall-level--${escapeHtml(group.level)}">
          <h3 class="wall-level-title">${escapeHtml(group.levelLabel)}</h3>
          <ul class="wall-grid">
            ${group.founders
              .map(
                (f) => `
              <li class="wall-plaque">
                <span class="wall-num">${escapeHtml(f.founderNumber)}</span>
                <strong class="wall-name">${escapeHtml(f.displayName)}</strong>
                <span class="wall-meta">${escapeHtml(group.levelLabel)}${year(f.recognizedAt) ? ` · Since ${year(f.recognizedAt)}` : ''}</span>
              </li>`
              )
              .join('')}
          </ul>
        </div>`
        )
        .join('')}`;
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
