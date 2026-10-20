const test = require('node:test');
const assert = require('node:assert/strict');

test('the .LLab Creator Website Blueprint™ starter site has the nine-part pattern and only working in-page links', async () => {
  const { STARTER_SITE: html } = await import('../scripts/pdf-src/docs/_starter-site.mjs');
  for (const part of ['<header>', 'class="ribbon"', 'class="hero"', 'id="problem"', 'id="offer"', 'id="paths"', '<table>', 'class="next"', '<footer>']) {
    assert.ok(html.includes(part), `starter has ${part}`);
  }
  assert.match(html, /<meta name="viewport"/);
  const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
  for (const [, href] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.has(href), `link #${href} points to a real section`);
  assert.ok(!/promise|guarantee/i.test(html), 'no promises in the starter copy');
});
