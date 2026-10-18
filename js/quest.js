// Guided quest page: answer in any order, progress autosaves, finishing
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

  function allNodes() { return quest.nodes.concat([quest.closing]); }
  function answered(n) {
    var v = answers[n.id];
    return n.type === 'text' ? typeof v === 'string' && v.trim() !== '' : v !== undefined;
  }
  function requiredCount() { return Math.ceil((quest.minAnswered || 1) * quest.nodes.length); }
  function canFinish() {
    return quest.nodes.filter(answered).length >= requiredCount() && answered(quest.closing);
  }

  function feedback(n) {
    var v = answers[n.id];
    if (!answered(n)) return '';
    if (n.type === 'check') return v ? 'Locked in. A strength to protect.' : 'Added to your build list.';
    if (n.type === 'choose') return n.coverage ? (v.length ? v.length + ' in place. The rest go on your build list.' : 'Noted. All of it goes on your build list.') : 'Captured.';
    if (n.type === 'scale') return v >= 4 ? 'A real strength.' : v <= 2 ? 'Added to your build list.' : 'Steady. Room to grow.';
    return 'Captured.';
  }

  function refresh() {
    var nodes = allNodes();
    var done = nodes.filter(answered).length;
    $('q-fill').style.width = Math.round((done / nodes.length) * 100) + '%';
    var need = requiredCount();
    $('q-count').textContent = done + ' of ' + nodes.length + ' steps logged' + (quest.minAnswered && quest.minAnswered < 1 ? ' (answer at least ' + need + ' plus your commitment)' : '');
    $('q-finish').disabled = !canFinish();
    nodes.forEach(function (n) {
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
      fetch(API, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: key, answers: answers, notes: notes }) }).catch(function () {});
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
  }

  function showRun() {
    $('q-result').hidden = true;
    $('q-run').hidden = false;
    var map = $('q-map');
    map.textContent = '';
    var lastSection = null;
    quest.nodes.forEach(function (n) {
      if (n.section && n.section !== lastSection) {
        lastSection = n.section;
        map.appendChild(el('h2', 'q-section', n.section));
      }
      map.appendChild(buildCard(n, false));
    });
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
        $('q-phase').textContent = quest.phase;
        $('q-title').textContent = quest.title;
        $('q-intro').textContent = quest.intro;
        document.title = quest.title + ' | The Co.LLab™';
        if (saved && saved.answers) answers = saved.answers;
        if (saved && saved.notes) notes = saved.notes;
        if (saved && saved.status === 'done') { showResult(saved); return; }
        showRun();
      })
      .catch(function () { fail('Could not reach the site. Please try again.'); });
  }

  $('q-finish').addEventListener('click', function () {
    var btn = $('q-finish');
    btn.disabled = true;
    $('q-finish-err').textContent = '';
    fetch(API, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: key, answers: answers, notes: notes, complete: true }) })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (!res.ok) { $('q-finish-err').textContent = res.d.error || 'Could not finish.'; btn.disabled = false; return; }
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
        if (res.ok) { msg.textContent = 'Thank you. It is with us and we will decide on it.'; ['fb-unclear', 'fb-support', 'fb-eco'].forEach(function (i) { $(i).value = ''; }); } else msg.textContent = res.d.error || 'Could not send.';
      })
      .catch(function () { msg.textContent = 'Could not reach the site.'; });
  });

  $('r-retake').addEventListener('click', function () { showRun(); window.scrollTo(0, 0); });

  init();
})();
