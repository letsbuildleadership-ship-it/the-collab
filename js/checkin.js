// Commitment check-in: the member records what happened with a quest commitment, or
// turns check-in emails off. Member text is only ever set via textContent / .value.
(function () {
  var API = '/.netlify/functions/quest-checkin';
  var p = new URLSearchParams(location.search);
  var key = p.get('key');
  var d = Number(p.get('d'));
  var status = null;
  var off = false;
  function $(id) { return document.getElementById(id); }
  function post(body) {
    return fetch(API, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { if (r.status === 401) { location.href = 'login.html'; return null; } return r.json().then(function (x) { return { ok: r.ok, d: x }; }); });
  }
  function showOff() {
    $('ci-off').textContent = off ? 'Turn check-ins back on' : 'Turn check-ins off';
    $('ci-off-text').textContent = off ? 'Check-in emails are off. Your finished quests and their reports stay in your portal.' : 'Check-ins arrive 30, 90 and 365 days after you finish a quest.';
  }
  document.querySelectorAll('.ci-choice').forEach(function (b) {
    b.addEventListener('click', function () {
      status = b.getAttribute('data-status');
      document.querySelectorAll('.ci-choice').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    });
  });
  $('ci-save').addEventListener('click', function () {
    if (!status) { $('ci-msg').textContent = 'Choose what happened first.'; return; }
    $('ci-msg').textContent = 'Saving…';
    post({ key: key, d: d, status: status, note: $('ci-note').value }).then(function (res) {
      if (!res) return;
      $('ci-msg').textContent = res.ok ? 'Saved. Thank you. It stays with your quest in your portal.' : res.d.error || 'Could not save.';
    }).catch(function () { $('ci-msg').textContent = 'Could not reach the site.'; });
  });
  $('ci-off').addEventListener('click', function () {
    post({ off: !off }).then(function (res) { if (res && res.ok) { off = res.d.off; showOff(); $('ci-off-msg').textContent = 'Saved.'; } });
  });

  var url = API + (key ? '?key=' + encodeURIComponent(key) + '&d=' + d : '');
  fetch(url, { credentials: 'same-origin' })
    .then(function (r) { if (r.status === 401) { location.href = 'login.html'; return null; } return r.json().then(function (x) { return { ok: r.ok, d: x }; }); })
    .then(function (res) {
      if (!res) return;
      if (!res.ok) { $('ci-error').hidden = false; $('ci-error').textContent = res.d.error || 'Could not load this check-in.'; return; }
      off = !!res.d.off;
      showOff();
      if (p.get('off') === '1' && !off) $('ci-off').focus();
      if (!key) return;
      $('ci-card').hidden = false;
      $('ci-title').textContent = 'What happened?';
      $('ci-sub').textContent = res.d.title;
      $('ci-when').textContent = (d === 365 ? 'One year' : d + ' days') + ' ago, you committed:';
      $('ci-commit').textContent = res.d.commitment || '';
      var c = res.d.checkin;
      if (c && c.status) {
        status = c.status;
        document.querySelectorAll('.ci-choice').forEach(function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-status') === c.status ? 'true' : 'false'); });
        $('ci-note').value = c.note || '';
      }
    })
    .catch(function () { $('ci-error').hidden = false; $('ci-error').textContent = 'Could not reach the site.'; });
})();
