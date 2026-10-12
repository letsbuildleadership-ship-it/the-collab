const test = require('node:test');
const assert = require('node:assert/strict');
const portal = require('../content/portal.json');
const pricing = require('../netlify/functions/lib/pricing');
const { TIERS } = require('../netlify/functions/lib/membership-rewards');

test('portal sections are well formed and include the three built-in programs', () => {
  const ids = new Set();
  for (const s of portal.sections) {
    assert.ok(s.id && /^[a-z0-9-]+$/.test(s.id), `bad id ${s.id}`);
    assert.ok(!ids.has(s.id), `duplicate id ${s.id}`);
    ids.add(s.id);
    assert.ok(['program', 'founders', 'partnerships', 'llab'].includes(s.type), `bad type ${s.type}`);
    assert.ok(s.eyebrow, `section ${s.id} needs an eyebrow`);
  }
  for (const t of ['founders', 'partnerships', 'llab']) assert.ok(portal.sections.some((s) => s.type === t && s.enabled !== false));
});

test('reward tiers come from portal.json, rise in price, and match real phases', () => {
  assert.equal(TIERS.length, portal.reward_tiers.length);
  for (let i = 1; i < TIERS.length; i++) assert.ok(TIERS[i].maxPrice > TIERS[i - 1].maxPrice);
  for (const t of TIERS) assert.ok(pricing.FOUR_PHASES.includes(t.phase), `unknown phase ${t.phase}`);
});
