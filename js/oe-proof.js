// Live proof under the Omnidirectional Enterprise™ "Follow one path" strip:
// Founder count + total directed to partner nonprofits. Stays hidden unless both load.
(function () {
  var box = document.querySelector('[data-oe-proof]');
  if (!box) return;
  Promise.all([
    fetch('/.netlify/functions/founders-recognition').then(function (r) { return r.ok ? r.json() : null; }),
    fetch('/.netlify/functions/impact-summary').then(function (r) { return r.ok ? r.json() : null; })
  ]).then(function (res) {
    var f = res[0], i = res[1];
    if (!f || !i || typeof f.total !== 'number' || !Array.isArray(i.partners)) return;
    var cents = i.partners.reduce(function (t, p) { return t + (p.allocatedCents || 0); }, 0);
    if (f.total < 1) return;
    box.querySelector('[data-oe-founders]').textContent = f.total.toLocaleString('en-US');
    box.querySelector('[data-oe-impact]').textContent =
      (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: cents % 100 ? 2 : 0 });
    box.hidden = false;
  }).catch(function () {});
})();
