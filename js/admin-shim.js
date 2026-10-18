// Runs on the owner pages (which are only served after owner sign-in). The session
// cookie does the authenticating; this just marks requests as coming from the
// page itself and lets the pages' own sign-in box step aside.
(function () {
  try { sessionStorage.setItem('collab_admin_token', 'session'); } catch (e) { /* ignore */ }
  var orig = window.fetch;
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    if (url.indexOf('/.netlify/functions/admin-') === 0) {
      init = Object.assign({}, init, { credentials: 'same-origin' });
      init.headers = Object.assign({}, init.headers, { 'X-Requested-With': 'collab-admin' });
    }
    return orig.call(this, input, init);
  };
})();
