// What Changed: adds notes the owner published from member feedback since the page was built.
// Only the owner's own note, the IP and the date are ever published. Text is set with textContent.
(function () {
  var list = document.getElementById('cl-list');
  if (!list) return;
  fetch('/.netlify/functions/changelog')
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d) return;
      var shown = {};
      list.querySelectorAll('.cl-entry h2').forEach(function (h) { shown[h.textContent] = true; });
      d.entries.filter(function (e) { return e.source === 'Member feedback' && !shown[e.title + e.date]; }).forEach(function (e) {
        var a = document.createElement('article'); a.className = 'cl-entry';
        var m = document.createElement('p'); m.className = 'cl-meta'; m.textContent = e.date + ' · ' + e.source + (e.ip ? ' · ' + e.ip : '');
        var h = document.createElement('h2'); h.textContent = e.title;
        var p = document.createElement('p'); p.textContent = e.text;
        a.append(m, h, p);
        list.insertBefore(a, list.firstChild);
      });
    })
    .catch(function () {});
})();
