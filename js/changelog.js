// Public changelog of changes made because of member feedback.
(function () {
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; }
  fetch('/.netlify/functions/changelog')
    .then(function (r) { return r.json(); })
    .then(function (d) {
      var list = document.getElementById('cl-list');
      if (!d.entries || !d.entries.length) { document.getElementById('cl-empty').hidden = false; return; }
      d.entries.forEach(function (e) {
        var li = el('li');
        li.appendChild(el('span', 'cl-date', e.date));
        li.appendChild(el('strong', null, e.ip + ': '));
        li.appendChild(document.createTextNode(e.change));
        list.appendChild(li);
      });
    })
    .catch(function () { document.getElementById('cl-empty').hidden = false; });
})();
