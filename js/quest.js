// Guided quest page: steps open in sequence (The IV Phases progression), progress autosaves, finishing
// builds the outcome and the member's PDF report (all handled by
// /.netlify/functions/quest). User-written text is only ever set via
// textContent / .value.
(function () {
  var API = '/.netlify/functions/quest';
  var key = new URLSearchParams(location.search).get('key') || '';
  var quest = null;
  var answers = {};
  var notes = {};
  var saveTimer = null;
  var canAnalyze = true;
  var path = 'full';
  var carry = {};
  var comparison = null;

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function fail(msg) {
    $('q-title').textContent = 'Quest unavailable';
    var e = $('q-error');
    e.hidden = false;
    e.textContent = msg;
  }

  // Long quests offer a short path; the member's choice decides which steps count.
  function pathNodes() {
    if (path !== 'short' || !quest.shortPath) return quest.nodes;
    return quest.nodes.filter(function (n) { return quest.shortPath.indexOf(n.id) >= 0; });
  }
  function allNodes() { return pathNodes().concat([quest.closing]); }
  function answered(n) {
    var v = answers[n.id];
    return n.type === 'text' ? typeof v === 'string' && v.trim() !== '' : v !== undefined;
  }
  function requiredCount() { return Math.ceil((quest.minAnswered || 1) * pathNodes().length); }
  function canFinish() {
    return pathNodes().filter(answered).length >= requiredCount() && answered(quest.closing);
  }

  function feedback(n) {
    var v = answers[n.id];
    if (!answered(n)) return '';
    if (n.type === 'check') return v ? 'Locked in. A strength to protect.' : 'Added to your build list.';
    if (n.type === 'choose') return n.coverage ? (v.length ? v.length + ' in place. The rest go on your build list.' : 'Noted. All of it goes on your build list.') : 'Captured.';
    if (n.type === 'scale') return v >= 4 ? 'A real strength.' : v <= 2 ? 'Added to your build list.' : 'Steady. Room to grow.';
    return 'Captured.';
  }

  // Steps run in sequence. A group (a section, or each question when the quest
  // has no sections and needs every answer) opens once the one before it is met.
  function groups() {
    var out = [];
    var every = !(quest.minAnswered && quest.minAnswered < 1);
    pathNodes().forEach(function (n) {
      var last = out[out.length - 1];
      if (n.section && last && last.section === n.section) { last.nodes.push(n); return; }
      if (!n.section && !every && last && !last.section) { last.nodes.push(n); return; }
      out.push({ section: n.section || '', nodes: [n] });
    });
    out.forEach(function (g) { g.need = every ? g.nodes.length : Math.ceil(quest.minAnswered * g.nodes.length); });
    return out;
  }
  function applyLocks() {
    var gs = groups();
    var open = true;
    gs.forEach(function (g) {
      var count = g.nodes.filter(answered).length;
      var unlocked = open || count > 0;
      g.nodes.forEach(function (n) { setLocked(n.id, !unlocked); });
      if (count < g.need) open = false;
    });
    setLocked(quest.closing.id, !open);
    if (quest.omni) setLocked(quest.omni.id, !open);
  }
  function setLocked(id, locked) {
    var card = document.querySelector('[data-node="' + id + '"]');
    if (!card) return;
    card.classList.toggle('is-locked', locked);
    card.setAttribute('aria-disabled', locked ? 'true' : 'false');
    var note = card.querySelector('.q-lock');
    if (locked && !note) { note = el('p', 'q-meta q-lock', 'Opens when the step before it is complete.'); card.insertBefore(note, card.children[1]); }
    if (!locked && note) note.remove();
    card.querySelectorAll('button, textarea, input').forEach(function (c) { c.disabled = locked; });
  }

  function refresh() {
    var nodes = allNodes();
    var done = nodes.filter(answered).length;
    $('q-fill').style.width = Math.round((done / nodes.length) * 100) + '%';
    var need = requiredCount();
    $('q-count').textContent = done + ' of ' + nodes.length + ' steps logged' + (quest.minAnswered && quest.minAnswered < 1 ? ' (answer at least ' + need + ' plus your commitment)' : '');
    $('q-finish').disabled = !canFinish();
    applyLocks();
    nodes.concat(quest.extend || []).forEach(function (n) {
      var card = document.querySelector('[data-node="' + n.id + '"]');
      if (!card) return;
      card.classList.toggle('is-done', answered(n));
      card.querySelector('.q-feed').textContent = feedback(n);
      var dig = card.querySelector('.q-dig');
      if (dig) dig.hidden = !(answered(n) && ((n.type === 'check' && answers[n.id] === false) || (n.type === 'scale' && answers[n.id] <= 2)));
    });
  }

  function queueSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      fetch(API, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: key, answers: answers, notes: notes, path: path }) }).catch(function () {});
    }, 600);
  }

  function setAnswer(n, v) { answers[n.id] = v; refresh(); queueSave(); }

  function buildCard(n, isClosing) {
    var card = el('div', isClosing ? 'q-close' : 'q-node');
    card.setAttribute('data-node', n.id);
    card.appendChild(el('p', 'q-label', n.label || (isClosing ? 'Make it yours' : 'Step')));
    card.appendChild(el('p', 'q-prompt', n.prompt));
    if (n.type === 'check' || n.type === 'scale') {
      var row = el('div', 'q-choices');
      var opts = n.type === 'check' ? [[true, 'Yes'], [false, 'Not yet']] : [1, 2, 3, 4, 5].map(function (i) { return [i, String(i)]; });
      opts.forEach(function (o) {
        var b = el('button', 'q-choice', o[1]);
        b.type = 'button';
        b.setAttribute('aria-pressed', answers[n.id] === o[0] ? 'true' : 'false');
        b.addEventListener('click', function () {
          row.querySelectorAll('.q-choice').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
          b.setAttribute('aria-pressed', 'true');
          setAnswer(n, o[0]);
        });
        row.appendChild(b);
      });
      card.appendChild(row);
      card.appendChild(el('p', 'q-feed'));
      var dig = el('details', 'q-dig');
      dig.hidden = true;
      dig.appendChild(el('summary', null, 'Dig deeper (optional): what would the first small step be?'));
      var t = el('textarea', 'q-text');
      t.maxLength = 300;
      t.value = notes[n.id] || '';
      t.setAttribute('aria-label', 'Optional note');
      t.addEventListener('input', function () { notes[n.id] = t.value; queueSave(); });
      dig.appendChild(t);
      card.appendChild(dig);
    } else if (n.type === 'choose') {
      var picks = Array.isArray(answers[n.id]) ? answers[n.id].slice() : [];
      var crow = el('div', 'q-choices');
      var sync = function () {
        crow.querySelectorAll('.q-choice').forEach(function (b) { b.setAttribute('aria-pressed', picks.indexOf(b.getAttribute('data-opt')) >= 0 ? 'true' : 'false'); });
      };
      n.options.forEach(function (o) {
        var b = el('button', 'q-choice', o);
        b.type = 'button';
        b.setAttribute('data-opt', o);
        b.addEventListener('click', function () {
          var i = picks.indexOf(o);
          if (i >= 0) picks.splice(i, 1);
          else if (n.pickMax === 1) picks = [o];
          else if (picks.length < n.pickMax) picks.push(o);
          sync();
          setAnswer(n, picks.slice());
        });
        crow.appendChild(b);
      });
      if (n.coverage) {
        var none = el('button', 'q-choice', 'None of these yet');
        none.type = 'button';
        none.addEventListener('click', function () { picks = []; sync(); setAnswer(n, []); });
        crow.appendChild(none);
      } else if (n.pickMax > 1) {
        card.appendChild(el('p', 'q-meta', 'Choose ' + (n.pickMin === n.pickMax ? n.pickMin : n.pickMin + ' to ' + n.pickMax) + '.'));
      }
      card.appendChild(crow);
      card.appendChild(el('p', 'q-feed'));
      sync();
    } else {
      var ta = el('textarea', 'q-text');
      ta.maxLength = 1000;
      ta.value = answers[n.id] || '';
      ta.setAttribute('aria-label', n.label || 'Your answer');
      ta.addEventListener('input', function () { answers[n.id] = ta.value; refresh(); queueSave(); });
      card.appendChild(ta);
      // Carry-forward: their own earlier answer to the same question in another IP. Offered, never filled in for them.
      var c = carry[n.id];
      if (c && !(answers[n.id] || '').trim()) {
        var cb = el('div', 'q-carry');
        cb.appendChild(el('p', null, 'You already wrote your ' + c.label.toLowerCase() + ' in ' + c.fromTitle + ':'));
        cb.appendChild(el('q', null, c.value));
        var use = el('button', 'pill mini', 'Use this'); use.type = 'button';
        use.addEventListener('click', function () { ta.value = c.value; answers[n.id] = c.value; cb.remove(); refresh(); queueSave(); });
        var skip = el('button', 'pill mini', 'Write it fresh'); skip.type = 'button'; skip.style.marginLeft = '.4rem';
        skip.addEventListener('click', function () { cb.remove(); ta.focus(); });
        cb.append(use, skip);
        card.appendChild(cb);
      }
      card.appendChild(el('p', 'q-feed'));
    }
    return card;
  }

  function listInto(id, items) {
    var ul = $(id);
    ul.textContent = '';
    items.forEach(function (it) {
      var li = el('li');
      li.appendChild(el('strong', null, it.label));
      if (it.evidence) li.appendChild(el('em', null, it.evidence));
      li.appendChild(el('span', null, it.text));
      ul.appendChild(li);
    });
  }

  function showResult(saved) {
    var o = saved.outcome;
    $('q-run').hidden = true;
    $('q-result').hidden = false;
    $('r-score').textContent = o.score !== null && o.max ? o.score + ' of ' + o.max + (o.bandLabel ? '  (' + o.bandLabel + ')' : '') : 'Done. Well done.';
    $('r-summary').textContent = o.summary;
    $('r-s-title').textContent = quest.archetype === 'worksheet' || quest.archetype === 'starter' ? 'Where you are strongest' : "What's working";
    $('r-legacy').textContent = o.legacyRead || '';
    var pm = $('r-phases');
    pm.textContent = '';
    (o.phaseMap || []).forEach(function (p) {
      var li = el('li');
      li.appendChild(el('strong', null, p.name));
      li.appendChild(el('span', null, (p.total ? p.answered + ' of ' + p.total + ' answered · ' : '') + p.strengths + ' strong · ' + p.gaps + ' to build · ' + p.mentions + ' mention' + (p.mentions === 1 ? '' : 's') + ' in your words'));
      pm.appendChild(li);
    });
    listInto('r-strengths', o.strengths);
    listInto('r-improve', o.improvements);
    $('r-next').textContent = o.nextMove ? 'A next move: ' + o.nextMove : '';
    var omni = o.omni;
    $('r-omni-wrap').hidden = !omni;
    if (omni) {
      $('r-omni').textContent = omni.read;
      var ol = $('r-omni-nodes');
      ol.textContent = '';
      omni.nodes.forEach(function (n) {
        var li = el('li');
        li.appendChild(el('strong', null, n.name));
        li.appendChild(el('span', null, n.mentions ? n.mentions + ' mention' + (n.mentions === 1 ? '' : 's') : 'not yet'));
        ol.appendChild(li);
      });
    }
    $('r-pdf').href = API + '?key=' + encodeURIComponent(key) + '&pdf=1';
    renderHistory(comparison);
  }

  // Historical comparison with the run before this one (numbers from the two runs only).
  function renderHistory(c) {
    var box = $('r-history');
    if (!box) return;
    box.hidden = !c;
    if (!c) return;
    $('r-history-read').textContent = c.read;
    var ul = $('r-history-phases');
    ul.textContent = '';
    (c.phases || []).forEach(function (p) {
      if (p.from === null && p.to === null) return;
      var li = el('li');
      li.appendChild(el('span', null, p.name));
      li.appendChild(el('span', null, (p.from === null ? '—' : p.from + '%') + ' → ' + (p.to === null ? '—' : p.to + '%') + (p.change ? ' (' + (p.change > 0 ? '+' : '') + p.change + ')' : '')));
      ul.appendChild(li);
    });
  }

  function showRun() {
    $('q-result').hidden = true;
    $('q-run').hidden = false;
    var map = $('q-map');
    map.textContent = '';
    var lastSection = null;
    pathNodes().forEach(function (n) {
      if (n.section && n.section !== lastSection) {
        lastSection = n.section;
        map.appendChild(el('h2', 'q-section', n.section));
      }
      map.appendChild(buildCard(n, false));
    });
    renderPaths();
    // Optional steps that carry a scored tool through all four phases (not scored, never required).
    var ext = $('q-extend');
    ext.textContent = '';
    if ((quest.extend || []).length) {
      ext.appendChild(el('h2', 'q-section', 'Carry it through The IV Phases™ (optional)'));
      var grid = el('div', 'q-map');
      quest.extend.forEach(function (n) { grid.appendChild(buildCard(n, false)); });
      ext.appendChild(grid);
    }
    $('q-hint').textContent = quest.scaleHint || '';
    $('q-hint').hidden = !quest.scaleHint;
    var close = $('q-close');
    close.textContent = '';
    close.appendChild(buildCard(quest.closing, true));
    var omniWrap = $('q-omni');
    omniWrap.textContent = '';
    var oc = buildCard(quest.omni, true);
    oc.insertBefore(el('p', 'q-meta', 'Optional, and it makes your Legacy Read stronger.'), oc.children[2]);
    omniWrap.appendChild(oc);
    refresh();
  }

  function renderPaths() {
    var box = $('q-paths');
    box.textContent = '';
    if (!quest.shortPath) { box.hidden = true; return; }
    box.hidden = false;
    [['short', 'Short path · ' + quest.shortPath.length + ' steps'], ['full', 'Full path · ' + quest.nodes.length + ' steps']].forEach(function (p) {
      var b = el('button', 'q-choice', p[1]);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(path === p[0]));
      b.addEventListener('click', function () { if (path === p[0]) return; path = p[0]; showRun(); queueSave(); });
      box.appendChild(b);
    });
  }

  function renderGuide() {
    var wrap = $('q-guide-wrap');
    if (!quest.guide) { wrap.hidden = true; return; }
    var box = $('q-guide');
    box.textContent = '';
    ['I · Foundations', 'II · Infrastructure Planning & Management', 'III · Internal Operating Systems', 'IV · Preservation'].forEach(function (name, i) {
      var g = quest.guide[i];
      if (!g) return;
      var c = el('div');
      c.appendChild(el('h3', null, name));
      var d = el('p'); d.appendChild(el('strong', null, 'Deliverable: ')); d.appendChild(document.createTextNode(g[0]));
      var w = el('p'); w.appendChild(el('strong', null, 'Put it to work: ')); w.appendChild(document.createTextNode(g[1]));
      c.append(d, w);
      box.appendChild(c);
    });
    wrap.hidden = false;
  }

  // ---- Team mode ----
  var TEAM = '/.netlify/functions/team';
  function teamApi(method, body, qs) {
    return fetch(TEAM + (qs || ''), { method: method, credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); });
  }
  function renderComparison(box, c) {
    box.textContent = '';
    box.appendChild(el('p', 'q-meta', c.people.map(function (p) { return p.label + ': ' + (p.status === 'done' ? 'finished' : p.status === 'draft' ? p.answered + ' answers so far' : 'not started'); }).join(' · ')));
    box.appendChild(el('p', 'q-label', c.differences.length ? 'Where you differ (' + c.differences.length + ')' : 'No differences yet on the scored steps'));
    var rows = c.differences.length ? c.differences : [];
    var wrap = el('div', 'q-team-wrap');
    var table = el('table', 'q-team-table');
    var head = el('tr');
    head.appendChild(el('th', null, 'Step'));
    c.people.forEach(function (p) { head.appendChild(el('th', null, p.label)); });
    table.appendChild(head);
    function addRow(n) {
      var tr = el('tr');
      tr.appendChild(el('td', null, n.prompt));
      n.answers.forEach(function (a) { tr.appendChild(el('td', null, a.value === null ? '—' : a.value)); });
      table.appendChild(tr);
    }
    rows.forEach(addRow);
    wrap.appendChild(table);
    box.appendChild(wrap);
    var all = el('details');
    all.appendChild(el('summary', 'q-meta', 'See every answer side by side'));
    var wrap2 = el('div', 'q-team-wrap');
    var t2 = el('table', 'q-team-table');
    var h2 = el('tr'); h2.appendChild(el('th', null, 'Step')); c.people.forEach(function (p) { h2.appendChild(el('th', null, p.label)); }); t2.appendChild(h2);
    c.nodes.forEach(function (n) { var tr = el('tr'); tr.appendChild(el('td', null, n.prompt)); n.answers.forEach(function (a) { tr.appendChild(el('td', null, a.value === null ? '—' : a.value)); }); t2.appendChild(tr); });
    wrap2.appendChild(t2); all.appendChild(wrap2); box.appendChild(all);
  }
  function renderTeams(teams) {
    var body = $('team-body');
    body.textContent = '';
    var msg = el('p', 'q-meta'); msg.setAttribute('role', 'status');
    function act(payload) {
      msg.textContent = 'Saving…';
      return teamApi('POST', payload).then(function (res) { if (!res.ok) { msg.textContent = res.d.error || 'Could not save.'; return; } msg.textContent = ''; loadTeams(); });
    }
    teams.forEach(function (t) {
      var card = el('div', 'q-node');
      card.style.marginTop = '1rem';
      card.appendChild(el('p', 'q-label', t.name));
      card.appendChild(el('p', 'q-meta', 'Led by ' + t.lead));
      var actions = el('div', 'q-actions');
      if (t.myStatus === 'invited') {
        card.appendChild(el('p', 'q-prompt', 'You are invited. Accepting shares your answers to this quest with this team only. You can leave at any time.'));
        var a = el('button', 'pill pill--solid', 'Accept'); a.type = 'button'; a.onclick = function () { act({ action: 'accept', teamId: t.id }); };
        var d = el('button', 'pill', 'Decline'); d.type = 'button'; d.onclick = function () { act({ action: 'decline', teamId: t.id }); };
        actions.append(a, d);
        card.appendChild(actions);
        body.appendChild(card);
        return;
      }
      var ul = el('ul');
      t.members.forEach(function (m) {
        var li = el('li', null, m.label + (m.status === 'invited' ? ' (invited)' : '') + (m.me ? ' (you)' : ''));
        if (t.isLead && !m.me) {
          var rm = el('button', 'pill mini', 'Remove'); rm.type = 'button'; rm.style.marginLeft = '.5rem';
          rm.onclick = function () { if (confirm('Remove from the team?')) act({ action: 'remove', teamId: t.id, memberRef: m.id }); };
          li.appendChild(rm);
        }
        ul.appendChild(li);
      });
      card.appendChild(ul);
      if (t.isLead) {
        var inv = el('input', 'q-text'); inv.type = 'email'; inv.placeholder = 'Colleague’s email'; inv.style.minHeight = '0'; inv.setAttribute('aria-label', 'Invite a colleague by email');
        var ib = el('button', 'pill', 'Invite'); ib.type = 'button';
        ib.onclick = function () { if (inv.value.trim()) act({ action: 'invite', teamId: t.id, email: inv.value.trim() }); };
        card.appendChild(inv);
        actions.appendChild(ib);
      }
      var cmp = el('button', 'pill pill--solid', 'Compare our answers'); cmp.type = 'button';
      var out = el('div');
      cmp.onclick = function () {
        out.textContent = 'Loading…';
        teamApi('GET', null, '?team=' + encodeURIComponent(t.id)).then(function (res) { if (!res.ok) { out.textContent = res.d.error || 'Could not load.'; return; } renderComparison(out, res.d.comparison); });
      };
      var leave = el('button', 'pill', t.isLead ? 'Close the team' : 'Leave the team'); leave.type = 'button';
      leave.onclick = function () { if (confirm(t.isLead ? 'Close this team for everyone?' : 'Leave this team? Your answers will no longer be shown to it.')) act({ action: 'leave', teamId: t.id }); };
      actions.prepend(cmp);
      actions.appendChild(leave);
      card.appendChild(actions);
      card.appendChild(out);
      body.appendChild(card);
    });
    var start = el('div', 'q-actions');
    var name = el('input', 'q-text'); name.type = 'text'; name.maxLength = 80; name.placeholder = 'Team name (optional)'; name.style.minHeight = '0'; name.setAttribute('aria-label', 'Team name');
    var sb = el('button', 'pill', teams.length ? 'Start another team' : 'Start a team on this quest'); sb.type = 'button';
    sb.onclick = function () { act({ action: 'create', questKey: key, name: name.value }); };
    body.appendChild(name);
    start.appendChild(sb);
    body.appendChild(start);
    body.appendChild(msg);
  }
  function loadTeams() {
    teamApi('GET', null, '?key=' + encodeURIComponent(key)).then(function (res) {
      if (!res.ok) return;
      $('team').hidden = false;
      renderTeams(res.d.teams || []);
      if (location.hash === '#team') $('team').scrollIntoView();
    }).catch(function () {});
  }

  function setTier() {
    var t = $('q-tier');
    if (t) {
      t.hidden = canAnalyze;
      t.textContent = 'Finish this quest free for your Infrastructure Snapshot™. Membership gives you the full Infrastructure Analysis™ and your outcomes.';
    }
    $('q-finish').firstChild.textContent = canAnalyze ? 'Run my Infrastructure Analysis™ ' : 'Get my Infrastructure Snapshot™ ';
  }

  function showLocked(p) {
    p = p || {};
    $('lk-score').textContent = p.score !== null && p.score !== undefined && p.max ? p.score + ' of ' + p.max + (p.bandLabel ? '  (' + p.bandLabel + ')' : '') : 'Done. Well done.';
    $('lk-summary').textContent = p.summary || '';
    $('lk-counts').textContent = (p.working || 0) + ' working · ' + (p.toBuild || 0) + ' to build';
    var one = $('lk-one');
    one.hidden = !p.oneStrength;
    one.textContent = p.oneStrength ? 'Working: ' + p.oneStrength : '';
    $('q-run').hidden = true;
    $('q-locked').hidden = false;
    window.scrollTo(0, 0);
  }

  function init() {
    if (!key) { fail('No quest selected. Pick one from your portal.'); return; }
    fetch(API + '?key=' + encodeURIComponent(key), { credentials: 'same-origin' })
      .then(function (r) {
        if (r.status === 401) { location.href = 'login.html'; return null; }
        return r.json().then(function (d) { return { ok: r.ok, d: d }; });
      })
      .then(function (res) {
        if (!res) return;
        if (!res.ok) { fail(res.d.error || 'Could not load this quest.'); return; }
        quest = res.d.quest;
        var saved = res.d.saved;
        canAnalyze = res.d.canAnalyze !== false;
        carry = res.d.carry || {};
        comparison = res.d.comparison || null;
        $('q-phase').textContent = quest.phase;
        $('q-title').textContent = quest.title;
        $('q-intro').textContent = quest.intro;
        document.title = quest.title + ' | The Co.LLab™';
        if (saved && saved.answers) answers = saved.answers;
        if (saved && saved.notes) notes = saved.notes;
        path = saved && saved.path === 'short' && quest.shortPath ? 'short' : 'full';
        renderGuide();
        loadTeams();
        if (saved && saved.status === 'done') { showResult(saved); return; }
        showRun();
        setTier();
        if (!canAnalyze && saved && saved.readyForAnalysis && saved.preview) showLocked(saved.preview);
      })
      .catch(function () { fail('Could not reach the site. Please try again.'); });
  }

  $('q-finish').addEventListener('click', function () {
    var btn = $('q-finish');
    btn.disabled = true;
    $('q-finish-err').textContent = '';
    fetch(API, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: key, answers: answers, notes: notes, path: path, complete: true }) })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (!res.ok) { $('q-finish-err').textContent = res.d.error || 'Could not finish.'; btn.disabled = false; return; }
        if (res.d.analysisLocked) { showLocked(res.d.preview); return; }
        comparison = res.d.comparison || null;
        showResult(res.d.saved);
        window.scrollTo(0, 0);
      })
      .catch(function () { $('q-finish-err').textContent = 'Could not reach the site.'; btn.disabled = false; });
  });

  $('fb-send').addEventListener('click', function () {
    var msg = $('fb-msg');
    msg.textContent = 'Sending…';
    fetch('/.netlify/functions/ip-feedback', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questKey: key, unclear: $('fb-unclear').value, support: $('fb-support').value, ecosystem: $('fb-eco').value }) })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (res.ok) { msg.textContent = 'Thank you. It is with us; what we change is published on What Changed, without your name.'; ['fb-unclear', 'fb-support', 'fb-eco'].forEach(function (i) { $(i).value = ''; }); } else msg.textContent = res.d.error || 'Could not send.';
      })
      .catch(function () { msg.textContent = 'Could not reach the site.'; });
  });

  $('lk-edit').addEventListener('click', function () { $('q-locked').hidden = true; $('q-run').hidden = false; btnReset(); window.scrollTo(0, 0); });
  function btnReset() { $('q-finish').disabled = !canFinish(); }

  $('r-retake').addEventListener('click', function () { showRun(); window.scrollTo(0, 0); });

  init();
})();
