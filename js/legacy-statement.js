// Phase Readiness and the Legacy Statement: every line is the member's own words from
// their finished quests, set with textContent only.
(function () {
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; }
  $('ls-print').addEventListener('click', function () { window.print(); });

  function fail(msg) { var e = $('ls-error'); e.hidden = false; e.textContent = msg; }

  fetch('/.netlify/functions/legacy', { credentials: 'same-origin' })
    .then(function (r) { if (r.status === 401) { location.href = 'login.html'; return null; } return r.json(); })
    .then(function (d) {
      if (!d) return;
      if (d.name) $('ls-title').textContent = d.name + ': Legacy Statement';
      var r = d.readiness;
      if (!r.quests) {
        $('ls-readiness-note').textContent = 'Finish your first quest and your Phase Readiness and Legacy Statement begin here.';
        return;
      }
      $('ls-readiness-note').textContent = 'Every phase map from your ' + r.quests + ' finished quest' + (r.quests === 1 ? '' : 's') + ', added together.';
      r.phases.forEach(function (p) {
        var box = el('div', 'ls-phase');
        box.appendChild(el('strong', null, p.name));
        if (p.strongest) box.appendChild(el('span', 'ls-tag', 'Strongest'));
        if (p.thinnest) box.appendChild(el('span', 'ls-tag', 'Thinnest'));
        var bar = el('div', 'ls-bar'); var fill = el('span'); fill.style.width = (p.level === null ? 0 : p.level) + '%'; bar.appendChild(fill); box.appendChild(bar);
        box.appendChild(el('p', 'x-meta', p.strengths + ' strong · ' + p.gaps + ' to build · ' + p.mentions + ' mention' + (p.mentions === 1 ? '' : 's') + ' in your words'));
        $('ls-phases').appendChild(box);
      });

      var st = d.statement;
      st.sections.forEach(function (s) {
        var card = el('div', 'x-card');
        card.appendChild(el('p', 'x-meta', s.phase));
        card.appendChild(el('h3', null, s.heading));
        if (!s.lines.length) card.appendChild(el('p', null, 'Not yet in your words. A quest in ' + s.phase + ' will fill this part of your statement.'));
        s.lines.forEach(function (l) {
          var p = el('p', 'ls-line');
          p.appendChild(el('q', null, l.text));
          p.appendChild(el('span', null, l.from + ' · ' + l.prompt));
          card.appendChild(p);
        });
        $('ls-statement').appendChild(card);
      });
      if (st.commitments.length) {
        $('ls-commit-card').hidden = false;
        st.commitments.forEach(function (c) { var li = el('li', null, c.text); li.appendChild(el('span', 'x-meta', '  ' + c.from + (c.date ? ' · ' + c.date : ''))); $('ls-commit').appendChild(li); });
      }
      if (st.outward.length) {
        $('ls-out-card').hidden = false;
        st.outward.forEach(function (o) { var p = el('p', 'ls-line'); p.appendChild(el('q', null, o.text)); p.appendChild(el('span', null, o.from)); $('ls-out').appendChild(p); });
      }
      $('ls-sources').textContent = 'Built from: ' + d.sources.map(function (s) { return s.title; }).join(' · ');
    })
    .catch(function () { fail('Could not load your Legacy Statement. Please try again.'); });
})();
