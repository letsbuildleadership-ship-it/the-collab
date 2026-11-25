// Member Portal™: what a member's IP adds up to across The IV Phases™. Phase Readiness, the
// 30/90/365-day commitment check-ins, one Legacy Statement and team quests. Everything here is
// the member's own and private. Member-written text is only ever set with textContent / .value.
(function () {
  var PHASES = ['Foundations', 'Infrastructure Planning & Management', 'Internal Operating Systems', 'Preservation'];
  var STATUS = [['kept', 'Kept'], ['in-progress', 'In progress'], ['changed', 'Changed'], ['not-yet', 'Not yet']];
  var loadedLegacy = false;
  var loadedTeams = false;

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; }
  function api(path, method, body) {
    return fetch('/.netlify/functions/' + path, { method: method || 'GET', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); });
  }
  function day(iso) { return String(iso || '').slice(0, 10); }

  function renderReadiness(r) {
    var box = $('readiness-bars');
    box.textContent = '';
    (r.phases || []).forEach(function (p, i) {
      var row = el('div', 'readiness-row');
      row.appendChild(el('span', 'readiness-name', ['I', 'II', 'III', 'IV'][i] + ' · ' + p.name));
      var bar = el('span', 'readiness-bar');
      var fill = el('span', 'readiness-fill');
      fill.style.width = (p.readiness === null ? 0 : p.readiness) + '%';
      bar.appendChild(fill);
      row.appendChild(bar);
      row.appendChild(el('span', 'readiness-val', p.readiness === null ? 'Not yet read' : p.readiness + '% · ' + p.strengths + ' strong, ' + p.gaps + ' to build'));
      box.appendChild(row);
    });
    $('readiness-read').textContent = r.read || '';
  }

  function renderCheckins(list) {
    var box = $('checkins-list');
    box.textContent = '';
    var due = list.filter(function (c) { return c.due && !c.reply; });
    $('checkins-count').textContent = due.length ? due.length + ' due' : list.length ? '' : '';
    if (due.length) $('checkins').open = true;
    if (!list.length) { box.appendChild(el('p', 'ip-note', 'Finish a quest and your commitment will appear here.')); return; }
    list.forEach(function (c) {
      var card = el('div', 'ip-card');
      card.appendChild(el('p', 'ip-label', c.day + '-day check-in · ' + c.quest));
      card.appendChild(el('p', 'ip-quote', '“' + c.commitment + '”'));
      if (c.reply) {
        var label = (STATUS.filter(function (s) { return s[0] === c.reply.status; })[0] || [0, c.reply.status])[1];
        card.appendChild(el('p', 'ip-note', 'You answered on ' + day(c.reply.at) + ': ' + label + (c.reply.note ? '. ' + c.reply.note : '')));
      } else if (!c.due) {
        card.appendChild(el('p', 'ip-note', 'Opens on ' + day(c.dueAt) + '.'));
      } else {
        var note = el('textarea', 'ip-input');
        note.maxLength = 800;
        note.placeholder = 'What happened? (optional)';
        note.setAttribute('aria-label', 'What happened with this commitment');
        var row = el('div', 'ip-actions');
        var msg = el('span', 'ip-note');
        msg.setAttribute('role', 'status');
        STATUS.forEach(function (s) {
          var b = el('button', 'pill mini', s[1]);
          b.type = 'button';
          b.addEventListener('click', function () {
            msg.textContent = 'Saving…';
            api('checkin', 'POST', { questKey: c.questKey, day: c.day, status: s[0], note: note.value }).then(function (res) {
              if (!res.ok) { msg.textContent = res.d.error || 'Could not save.'; return; }
              renderCheckins(res.d.checkins);
            }).catch(function () { msg.textContent = 'Could not reach the site.'; });
          });
          row.appendChild(b);
        });
        row.appendChild(msg);
        card.appendChild(note);
        card.appendChild(row);
      }
      box.appendChild(card);
    });
  }

  function fillLegacy(st) {
    $('ls-title').value = st.title || '';
    [0, 1, 2, 3].forEach(function (i) { $('ls-p' + i).value = (st.phases || [])[i] || ''; });
    $('ls-closing').value = st.closing || '';
  }

  function loadLegacy() {
    if (loadedLegacy) return;
    loadedLegacy = true;
    api('legacy-statement').then(function (res) {
      if (!res.ok) return;
      var d = res.d;
      if (d.saved) { fillLegacy(d.saved); $('ls-pdf').hidden = false; $('legacy-status').textContent = 'Saved ' + day(d.saved.updatedAt); }
      else if (d.suggested && d.suggested.some(Boolean)) { fillLegacy({ phases: d.suggested }); $('legacy-status').textContent = 'Draft from your answers'; }
      else $('legacy-status').textContent = 'Finish a quest to start it';
      $('ls-draft').onclick = function () {
        if (!d.suggested || !d.suggested.some(Boolean)) { $('ls-msg').textContent = 'Finish a quest first; your answers become the draft.'; return; }
        if (PHASES.some(function (_, i) { return $('ls-p' + i).value.trim(); }) && !confirm('Replace what is in the four phases with a draft from your answers?')) return;
        fillLegacy({ title: $('ls-title').value, phases: d.suggested, closing: $('ls-closing').value });
        $('ls-msg').textContent = 'Drafted from your answers. Edit it, then save.';
      };
    });
  }

  function teamCard(t) {
    var card = el('div', 'ip-card');
    card.appendChild(el('p', 'ip-label', t.questTitle));
    card.appendChild(el('p', null, t.name + ' · led by ' + t.lead + (t.myStatus === 'accepted' ? ' · ' + t.acceptedCount + ' in the team' : '')));
    var row = el('div', 'ip-actions');
    var msg = el('span', 'ip-note');
    function act(action) {
      return api('team', 'POST', { action: action, teamId: t.id }).then(function (res) {
        if (!res.ok) { msg.textContent = res.d.error || 'Could not save.'; return; }
        loadedTeams = false; loadTeams();
      });
    }
    if (t.myStatus === 'invited') {
      card.appendChild(el('p', 'ip-note', 'Accepting shares your answers to this quest with this team only. You can leave at any time.'));
      var a = el('button', 'pill pill--solid mini', 'Accept'); a.type = 'button'; a.onclick = function () { act('accept'); };
      var d = el('button', 'pill mini', 'Decline'); d.type = 'button'; d.onclick = function () { act('decline'); };
      row.append(a, d);
    } else {
      var open = el('a', 'pill pill--solid mini', 'Open the quest');
      open.href = 'quest.html?key=' + encodeURIComponent(t.questKey) + '#team';
      var leave = el('button', 'pill mini', t.isLead ? 'Close the team' : 'Leave the team'); leave.type = 'button';
      leave.onclick = function () { if (confirm(t.isLead ? 'Close this team for everyone?' : 'Leave this team? Your answers will no longer be shown to it.')) act('leave'); };
      row.append(open, leave);
    }
    row.appendChild(msg);
    card.appendChild(row);
    return card;
  }

  function loadTeams() {
    if (loadedTeams) return;
    loadedTeams = true;
    api('team').then(function (res) {
      var box = $('teams-list');
      box.textContent = '';
      if (!res.ok) return;
      var teams = res.d.teams || [];
      var invites = teams.filter(function (t) { return t.myStatus === 'invited'; }).length;
      $('teams-count').textContent = invites ? invites + ' invitation' + (invites === 1 ? '' : 's') : teams.length ? String(teams.length) : '';
      if (invites) $('teams').open = true;
      if (!teams.length) box.appendChild(el('p', 'ip-note', 'No team quests yet.'));
      teams.forEach(function (t) { box.appendChild(teamCard(t)); });
    });
  }

  document.addEventListener('collab:dashboard', function (e) {
    var data = e.detail || {};
    $('ip-work').hidden = false;
    renderReadiness(data.phaseReadiness || { phases: PHASES.map(function (n) { return { name: n, readiness: null }; }) });
    renderCheckins(data.checkins || []);
    loadTeams();
    if (data.hasLegacyStatement) loadLegacy();
    if (!$('legacy-statement').dataset.wired) {
      $('legacy-statement').dataset.wired = '1';
      $('legacy-statement').addEventListener('toggle', function () { if ($('legacy-statement').open) loadLegacy(); });
    }
    if (location.hash === '#checkins') $('checkins').open = true;
    if (location.hash === '#legacy-statement') { $('legacy-statement').open = true; loadLegacy(); }
  });

  var form = $('legacy-form');
  if (form) form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    $('ls-msg').textContent = 'Saving…';
    var body = { title: $('ls-title').value, phases: [0, 1, 2, 3].map(function (i) { return $('ls-p' + i).value; }), closing: $('ls-closing').value };
    api('legacy-statement', 'POST', body).then(function (res) {
      if (!res.ok) { $('ls-msg').textContent = res.d.error || 'Could not save.'; return; }
      $('ls-msg').textContent = 'Saved. It is yours, and private.';
      $('ls-pdf').hidden = false;
      $('legacy-status').textContent = 'Saved ' + day(res.d.saved.updatedAt);
    }).catch(function () { $('ls-msg').textContent = 'Could not reach the site.'; });
  });
})();
