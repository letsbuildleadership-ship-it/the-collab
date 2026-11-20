'use strict';

// The mission and vision in the pitch PDF and deck must always read exactly as on the About page.
// Both are built from content/about.json through scripts/pitch/data.mjs (P.mission, P.vision), and
// content/about.json is a pitch input, so pitch-fresh.test.js fails until the PDFs are rebuilt after a change.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const about = JSON.parse(fs.readFileSync(path.join(root, 'content/about.json'), 'utf8'));

test('the pitch reads the mission and vision from the About page copy', async () => {
  const { P } = await import('../scripts/pitch/data.mjs');
  assert.equal(P.mission, about.mission_quote.map((x) => x.text).join('').trim());
  assert.equal(P.vision, `${about.vision_body_prefix} ${about.vision_body_glow}`.trim());
  for (const f of ['scripts/pitch/pitch.mjs', 'scripts/pitch/deck.mjs']) {
    const src = fs.readFileSync(path.join(root, f), 'utf8');
    assert.ok(src.includes('${P.mission}') && src.includes('${P.vision}'), `${f} must use P.mission and P.vision`);
    assert.ok(!/To build leadership infrastructure that/.test(src), `${f} must not retype the mission`);
    assert.ok(!/A world where infrastructure is built around/.test(src), `${f} must not retype the vision`);
  }
  const { INPUTS } = await import('../scripts/pitch/stamp.mjs');
  assert.ok(INPUTS.includes('content/about.json'), 'content/about.json must be a pitch input');
});
