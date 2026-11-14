/* The Omnidirectional Legacy Wall: one wall, organized by Omnidirectional Enterprise(TM) area. */
(function () {
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  const name = (m) => (m.url ? `<a class="wall-link" href="${esc(m.url)}" target="_blank" rel="sponsored noopener">${esc(m.displayName)} <span aria-hidden="true">↗</span></a>` : esc(m.displayName));
  document.addEventListener('DOMContentLoaded', async () => {
    const box = document.getElementById('legacy-wall-nodes');
    if (!box) return;
    try {
      const res = await fetch('/.netlify/functions/legacy-wall');
      if (!res.ok) return;
      const data = await res.json();
      box.innerHTML = data.nodes
        .map((n) => `<div class="wall-node" id="wall-${esc(n.node.toLowerCase().replace(/[^a-z]+/g, '-'))}">
          <h3 class="wall-node-title"><a href="${esc(n.page)}">${esc(n.node)}</a> <span>${esc(n.where)}</span></h3>
          ${n.groups.length ? n.groups.map((g) => `<div class="wall-level"><h4 class="wall-level-title">${esc(g.label)}</h4><ul class="wall-grid">${g.members.map((m) => `<li class="wall-plaque"><strong class="wall-name">${name(m)}</strong></li>`).join('')}</ul></div>`).join('') : '<p class="wall-open">The door is open. Names go up as people take part here.</p>'}
        </div>`)
        .join('');
    } catch (err) {
      /* non-fatal */
    }
  });
})();
