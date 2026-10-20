// .LLab Collaborating Companies: public list, plus the signed-in
// member's own listing form. All member-written text is set with textContent
// or .value, and outbound links are https only (re-checked here).
(function () {
  var API = '/.netlify/functions/directory';
  var DIRS = [];
  var listings = [];
  var active = null;

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; }
  function safeUrl(u) { try { var x = new URL(u); return x.protocol === 'https:' ? x.toString() : null; } catch (e) { return null; } }
  function link(url, label) {
    var href = safeUrl(url);
    if (!href) return document.createTextNode(label);
    var a = el('a', null, label);
    a.href = href; a.target = '_blank'; a.rel = 'noopener nofollow ugc';
    return a;
  }

  function renderFilters() {
    var box = $('d-filters');
    box.textContent = '';
    [null].concat(DIRS).forEach(function (d) {
      var b = el('button', 'd-chip', d || 'All');
      b.type = 'button';
      b.setAttribute('aria-pressed', String(active === d));
      b.addEventListener('click', function () { active = d; renderFilters(); renderGrid(); });
      box.appendChild(b);
    });
  }

  function renderGrid() {
    var grid = $('d-grid');
    grid.textContent = '';
    var shown = listings.filter(function (l) { return !active || l.directions.indexOf(active) >= 0; });
    $('d-empty').hidden = shown.length > 0;
    if (!shown.length && listings.length) $('d-empty').textContent = 'No listed company serves that direction yet.';
    shown.forEach(function (l) {
      var c = el('article', 'd-card');
      c.appendChild(el('h3', null, l.companyName));
      if (l.tagline) c.appendChild(el('p', 'd-tag', l.tagline));
      var dir = el('div', 'd-dir');
      l.directions.forEach(function (d) { dir.appendChild(el('span', null, d)); });
      c.appendChild(dir);
      c.appendChild(el('p', 'd-desc', l.description));
      var ul = el('ul', 'd-off');
      l.offerings.forEach(function (o) {
        var li = el('li');
        li.appendChild(el('span', 'd-kind', o.kind));
        var name = el('strong');
        name.appendChild(o.url ? link(o.url, o.name) : document.createTextNode(o.name));
        li.appendChild(name);
        if (o.description) li.appendChild(document.createTextNode(' — ' + o.description));
        ul.appendChild(li);
      });
      c.appendChild(ul);
      var foot = el('p', 'd-desc');
      var bits = [];
      if (l.website) bits.push(link(l.website, 'Website'));
      if (l.contactEmail) { var m = el('a', null, l.contactEmail); m.href = 'mailto:' + l.contactEmail; bits.push(m); }
      if (l.location) bits.push(document.createTextNode(l.location));
      bits.forEach(function (b, i) { if (i) foot.appendChild(document.createTextNode('  ·  ')); foot.appendChild(b); });
      c.appendChild(foot);
      grid.appendChild(c);
    });
  }

  // ---- member's own listing ----
  var offRows = [];

  function offeringRow(o) {
    var row = el('div', 'd-off-row');
    var kind = el('select');
    ['product', 'service'].forEach(function (k) { var op = el('option', null, k === 'product' ? 'Product' : 'Service'); op.value = k; if (o.kind === k) op.selected = true; kind.appendChild(op); });
    var name = el('input'); name.type = 'text'; name.maxLength = 60; name.placeholder = 'Name'; name.value = o.name || '';
    var desc = el('input'); desc.type = 'text'; desc.maxLength = 200; desc.placeholder = 'One line on what it is'; desc.value = o.description || '';
    var url = el('input'); url.type = 'url'; url.placeholder = 'https:// link to buy or learn more'; url.value = o.url || '';
    var rm = el('button', 'pill', 'Remove'); rm.type = 'button';
    rm.addEventListener('click', function () { offRows.splice(offRows.indexOf(row), 1); row.remove(); });
    row.append(kind, name, desc, url, rm);
    row.read = function () { return { kind: kind.value, name: name.value, description: desc.value, url: url.value }; };
    offRows.push(row);
    return row;
  }

  function labeled(text, node, forId) { var l = el('label', null, text); if (forId) l.setAttribute('for', forId); var w = el('div'); w.append(l, node); return w; }

  function renderMine(state) {
    var box = $('d-mine');
    box.textContent = '';
    if (state.signedOut) {
      box.appendChild(el('p', 'd-desc', 'Sign in to join. Open to companies that license Co.LLab™ IP or hold a Membership.'));
      var a = el('a', 'pill pill--solid', 'Sign in'); a.href = 'login.html'; box.appendChild(a);
      return;
    }
    if (!state.eligible) {
      box.appendChild(el('p', 'd-desc', 'Open to companies that license Co.LLab™ IP (any .LLab™ product) or hold a Membership. You can browse the .LLab Collaborating Companies now.'));
      var p = el('a', 'pill pill--solid', 'See the .LLab™ products'); p.href = 'products.html'; box.appendChild(p);
      return;
    }
    var l = state.listing;
    if (l) {
      var s = el('p', 'd-desc');
      s.appendChild(document.createTextNode('Your company page: '));
      s.appendChild(el('span', 'd-status ' + l.status, l.status === 'approved' ? 'Live' : l.status === 'rejected' ? 'Needs a change' : 'Waiting for review'));
      box.appendChild(s);
      if (l.status === 'rejected' && l.note) box.appendChild(el('p', 'd-err', l.note));
    }
    var form = el('form', 'd-form');
    var company = el('input'); company.type = 'text'; company.id = 'f-company'; company.maxLength = 80; company.value = (l && l.companyName) || '';
    var tagline = el('input'); tagline.type = 'text'; tagline.id = 'f-tagline'; tagline.maxLength = 140; tagline.value = (l && l.tagline) || '';
    var desc = el('textarea'); desc.id = 'f-desc'; desc.maxLength = 600; desc.value = (l && l.description) || '';
    var loc = el('input'); loc.type = 'text'; loc.id = 'f-loc'; loc.maxLength = 60; loc.value = (l && l.location) || '';
    var web = el('input'); web.type = 'url'; web.id = 'f-web'; web.placeholder = 'https://'; web.value = (l && l.website) || '';
    var mail = el('input'); mail.type = 'email'; mail.id = 'f-mail'; mail.maxLength = 120; mail.value = (l && l.contactEmail) || '';
    form.append(labeled('Company name', company, 'f-company'), labeled('One-line tagline (optional)', tagline, 'f-tagline'), labeled('What your company does', desc, 'f-desc'), labeled('Location (optional)', loc, 'f-loc'), labeled('Website', web, 'f-web'), labeled('Public contact email (optional, shown to everyone)', mail, 'f-mail'));

    var dl = el('label', null, 'Directions your company serves (choose up to 3)');
    var dirBox = el('div', 'd-filters');
    var picked = ((l && l.directions) || []).slice();
    DIRS.forEach(function (d) {
      var b = el('button', 'd-chip', d); b.type = 'button';
      b.setAttribute('aria-pressed', String(picked.indexOf(d) >= 0));
      b.addEventListener('click', function () {
        var i = picked.indexOf(d);
        if (i >= 0) picked.splice(i, 1); else if (picked.length < 3) picked.push(d);
        dirBox.querySelectorAll('.d-chip').forEach(function (x) { x.setAttribute('aria-pressed', String(picked.indexOf(x.textContent) >= 0)); });
      });
      dirBox.appendChild(b);
    });
    form.append(dl, dirBox);

    form.appendChild(el('label', null, 'What you offer (products and services, up to 6)'));
    var offBox = el('div');
    offRows = [];
    ((l && l.offerings) || [{}]).forEach(function (o) { offBox.appendChild(offeringRow(o)); });
    form.appendChild(offBox);
    var add = el('button', 'pill', 'Add another'); add.type = 'button'; add.style.marginTop = '.8rem';
    add.addEventListener('click', function () { if (offRows.length < 6) offBox.appendChild(offeringRow({})); });
    form.appendChild(add);

    var actions = el('div'); actions.style.cssText = 'margin-top:1.5rem; display:flex; gap:1rem; align-items:center; flex-wrap:wrap;';
    var save = el('button', 'pill pill--solid', 'Send for review'); save.type = 'submit';
    var msg = el('span', 'd-err'); msg.setAttribute('aria-live', 'polite');
    actions.append(save, msg);
    if (l) {
      var rem = el('button', 'pill', 'Remove my company'); rem.type = 'button';
      rem.addEventListener('click', function () {
        if (!confirm('Remove your company from the .LLab Collaborating Companies?')) return;
        fetch(API, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'remove' }) }).then(function () { loadMine(); loadPublic(); });
      });
      actions.appendChild(rem);
    }
    form.appendChild(actions);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      msg.textContent = 'Sending…';
      var payload = { companyName: company.value, tagline: tagline.value, description: desc.value, location: loc.value, website: web.value, contactEmail: mail.value, directions: picked, offerings: offRows.map(function (r) { return r.read(); }) };
      fetch(API, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (res) {
          if (!res.ok) { msg.textContent = res.d.error || 'Could not save.'; return; }
          loadMine();
        })
        .catch(function () { msg.textContent = 'Could not reach the site.'; });
    });
    box.appendChild(form);
  }

  function loadMine() {
    fetch(API + '?mine=1', { credentials: 'same-origin' })
      .then(function (r) { if (r.status === 401) { renderMine({ signedOut: true }); return null; } return r.json(); })
      .then(function (d) { if (d) { DIRS = d.directions; renderMine(d); } })
      .catch(function () { $('d-mine').textContent = 'Could not load your company page.'; });
  }

  function loadPublic() {
    fetch(API)
      .then(function (r) { return r.json(); })
      .then(function (d) { DIRS = d.directions; listings = d.listings; renderFilters(); renderGrid(); })
      .catch(function () { $('d-empty').hidden = false; $('d-empty').textContent = 'Could not load the .LLab Collaborating Companies. Please try again.'; });
  }

  loadPublic();
  loadMine();
})();
