'use strict';

// The pitch PDF and deck are built from content/pricing.json and the templates in scripts/pitch/.
// If an input changed and they were not rebuilt, this fails: run `npm run pitch` (the "Rebuild pitch"
// workflow does this automatically after a change lands on main).

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

test('the pitch and deck are built from the current pricing and templates', async () => {
  const { sourceHash } = await import('../scripts/pitch/stamp.mjs');
  const stamp = fs.readFileSync(path.join(root, 'assets/pitch/source.sha'), 'utf8').trim();
  assert.equal(stamp, sourceHash(), 'pitch inputs changed since the last build: run `npm run pitch`');
});

test('the pitch states the registry prices (tiers, memberships, range)', async () => {
  const { P } = await import('../scripts/pitch/data.mjs');
  const pricing = require('../netlify/functions/lib/pricing');
  assert.deepEqual(P.tiers.map((t) => t.price), pricing.registry.partnerships.map((t) => t.price_display));
  assert.deepEqual(P.tiers.map((t) => t.seats), pricing.registry.partnerships.map((t) => t.seats));
  assert.match(P.memMo, /^\$[\d,]+\/mo$/);
  assert.match(P.range, /^\$[\d,]+–\$[\d,]+$/);
});
