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

  function feedback(n) {
    var v = answers[n.id];
    if (!answered(n)) return '';
    if (n.type === 'check') return v ? 'Locked in. A strength to protect.' : 'Added to your build list.';
    if (n.type === 'scale') return v >= 4 ? 'A real strength.' : v <= 2 ? 'Added to your build list.' : 'Steady. Room to grow.';
    return 'Captured.';
  }

  function refresh() {
    var nodes = allNodes();
    var done = nodes.filter(answered).length;
    $('q-fill').style.width = Math.round((done / nodes.length) * 100) + '%';
    $('q-count').textContent = done + ' of ' + nodes.length + ' steps logged';
    $('q-finish').disabled = done < nodes.length;
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
      li.appendChild(document.createTextNode(it.text));
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
    listInto('r-strengths', o.strengths);
    listInto('r-improve', o.improvements);
    $('r-next').textContent = o.nextMove ? 'A next move: ' + o.nextMove : '';
    $('r-pdf').href = API + '?key=' + encodeURIComponent(key) + '&pdf=1';
  }

  function showRun() {
    $('q-result').hidden = true;
    $('q-run').hidden = false;
    var map = $('q-map');
    map.textContent = '';
    quest.nodes.forEach(function (n) { map.appendChild(buildCard(n, false)); });
    var close = $('q-close');
    close.textContent = '';
    close.appendChild(buildCard(quest.closing, true));
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

  $('r-retake').addEventListener('click', function () { showRun(); window.scrollTo(0, 0); });

  init();
})();
