const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const toml = fs.readFileSync(path.join(root, 'netlify.toml'), 'utf8');
const pricing = JSON.parse(fs.readFileSync(path.join(root, 'content', 'pricing.json'), 'utf8'));

function paidFiles() {
  const files = new Set();
  for (const list of ['products', 'blueprint_series', 'partner_ip', 'bonus_products', 'memberships']) {
    for (const item of pricing[list] || []) if (item.pdf_file) files.add(item.pdf_file);
  }
  return [...files];
}
const blocked = (from) => new RegExp(`from = "${from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\n  to = "/404"\\n  status = 404\\n  force = true`).test(toml);

test('every paid PDF is blocked from the public web (forced 404), so it is reachable only through the download function', () => {
  const files = paidFiles();
  assert.ok(files.length >= 30, 'found the paid files');
  for (const f of files) assert.ok(blocked(`/content/library/${f}`), `${f} must be blocked in netlify.toml (run node scripts/block-paid-files.mjs)`);
});

test('function source and the server-only .LLab Legacy Library content are not public', () => {
  assert.ok(blocked('/netlify/*'), '/netlify/* blocked');
  assert.ok(blocked('/content/library.json'), '/content/library.json blocked');
});

test('free PDFs stay public: anything in content/library that is not a registered paid file is not blocked', () => {
  const paid = new Set(paidFiles());
  for (const f of fs.readdirSync(path.join(root, 'content', 'library')).filter((n) => n.endsWith('.pdf') && !paid.has(n))) {
    assert.ok(!blocked(`/content/library/${f}`), `${f} is free and must stay downloadable`);
  }
});

test('no page, script or content file links straight to a paid PDF', () => {
  const walk = (dir, out = []) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', '.git', 'photos', 'docs', 'scripts', 'test', 'netlify'].includes(e.name)) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p, out); else if (/\.(html|js|json|css)$/.test(e.name) && e.name !== 'pricing.json') out.push(p);
    }
    return out;
  };
  for (const file of walk(root)) {
    const text = fs.readFileSync(file, 'utf8');
    for (const f of paidFiles()) assert.ok(!text.includes(`/content/library/${f}`), `${path.relative(root, file)} links directly to paid file ${f}`);
  }
});

test('the download function checks the signed-in customer owns the product before sending a file', () => {
  const src = fs.readFileSync(path.join(root, 'netlify', 'functions', 'download.js'), 'utf8');
  assert.match(src, /getCustomerByToken\(token\)/);
  assert.match(src, /if \(!entitled\) return json\(403/);
  assert.ok(src.indexOf('if (!entitled)') < src.indexOf('readFileSync'), 'entitlement check comes before the file is read');
});
