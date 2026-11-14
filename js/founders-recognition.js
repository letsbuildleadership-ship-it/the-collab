/* The Co.LLab Founders Organization™ Legacy Wall on pages/founders.html — every recognized Founder,
 * shown permanently by name under their Founder level (highest level
 * first), in the order they joined. No numbers are shown.
 * Read-only, no sign-in required. */
(function () {
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function renderGroups(data) {
    const container = document.getElementById('founder-recognition-lists');
    if (!container) return;

    if (!data || !data.total) {
      container.innerHTML = '<p class="subhead">The Co.LLab Founders Organization™ Legacy Wall is ready. The first name goes up the moment the first founding purchase completes.</p>';
      return;
    }

    const groups = data.groups.filter((g) => g.founders.length).reverse();
    container.innerHTML = `
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
                <strong class="wall-name">${escapeHtml(f.displayName)}</strong>
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
