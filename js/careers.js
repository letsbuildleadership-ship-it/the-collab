// Careers application form (pages/careers.html) -> netlify/functions/career-apply.js
(function () {
  var form = document.getElementById('careers-form');
  if (!form) return;
  var status = document.getElementById('cr-status');
  var submit = document.getElementById('cr-submit');
  var done = document.getElementById('cr-done');
  var EMAIL_RE = /^[^\s@<>()]+@[^\s@<>()]+\.[^\s@<>()]{2,}$/;

  var fields = {
    fullName: { el: form.fullName, check: function (v) { return v.trim().length >= 2 ? '' : 'Enter your full legal name.'; } },
    email: { el: form.email, check: function (v) { return EMAIL_RE.test(v.trim()) ? '' : 'Enter a valid email address.'; } },
    country: { el: form.country, check: function (v) { return v.trim().length >= 2 ? '' : 'Enter your country of residence.'; } },
    area: { el: form.area, check: function (v) { return v ? '' : 'Choose an area of interest.'; } },
    experience: { el: form.experience, check: function (v) { return v.trim().length >= 20 ? '' : 'Describe your relevant experience (at least 20 characters).'; } },
    website: { el: form.website, check: function (v) {
      v = v.trim(); if (!v) return '';
      try { var u = new URL(/^https?:\/\//i.test(v) ? v : 'https://' + v); return u.hostname.indexOf('.') > 0 ? '' : 'Enter a valid web address, or leave it blank.'; }
      catch (e) { return 'Enter a valid web address, or leave it blank.'; }
    } },
    introduction: { el: form.introduction, check: function (v) { return v.trim().length >= 20 ? '' : 'Write a short introduction (at least 20 characters).'; } },
    consent: { el: form.consent, check: function () { return form.consent.checked ? '' : 'Please agree to be contacted about your application.'; } },
  };

  function show(name, msg) {
    var f = fields[name]; if (!f) return;
    var err = document.getElementById('cr-' + name + '-err');
    f.el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) { err.textContent = msg || ''; err.hidden = !msg; }
  }
  function value(name) { return name === 'consent' ? form.consent.checked : fields[name].el.value; }

  Object.keys(fields).forEach(function (name) {
    var el = fields[name].el;
    el.addEventListener(name === 'consent' || name === 'area' ? 'change' : 'blur', function () {
      if (el.getAttribute('aria-invalid') || el.value) show(name, fields[name].check(el.value));
    });
  });

  // "Express interest" buttons preselect the area.
  document.querySelectorAll('[data-area]').forEach(function (a) {
    a.addEventListener('click', function () { form.area.value = a.getAttribute('data-area'); show('area', ''); });
  });
  var hash = (location.hash || '').replace('#', '');
  if (hash && form.area.querySelector('option[value="' + hash + '"]')) form.area.value = hash;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    status.hidden = true;
    var first = null;
    Object.keys(fields).forEach(function (name) {
      var msg = fields[name].check(fields[name].el.value);
      show(name, msg);
      if (msg && !first) first = fields[name].el;
    });
    if (first) { first.focus(); status.textContent = 'Please correct the highlighted fields.'; status.hidden = false; return; }

    var payload = { org_url: form.org_url.value };
    Object.keys(fields).forEach(function (name) { payload[name] = value(name); });

    submit.disabled = true;
    submit.firstChild.nodeValue = 'Submitting… ';
    fetch('/.netlify/functions/career-apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) { return { ok: res.ok, data: data }; });
    }).then(function (r) {
      if (!r.ok) {
        if (r.data.fields) Object.keys(r.data.fields).forEach(function (n) { show(n, r.data.fields[n]); });
        throw new Error(r.data.error || 'Something went wrong. Please try again.');
      }
      form.hidden = true;
      document.getElementById('cr-ref').textContent = r.data.reference || '—';
      done.hidden = false;
      done.focus();
    }).catch(function (err) {
      status.textContent = err.message && err.message !== 'Failed to fetch' ? err.message : 'We could not reach the server. Please check your connection and try again.';
      status.hidden = false;
    }).then(function () {
      submit.disabled = false;
      submit.firstChild.nodeValue = 'Submit application ';
    });
  });
})();
