// Builds pages/ip-license.html from the single source of the Co.LLab IP
// license (scripts/pdf-src/docs/_license.mjs), so the web copy is word for
// word the license printed in every product. Re-run after editing the
// license:  node scripts/build-ip-license.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { licenseHtml } from './pdf-src/docs/_license.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const partnership = fs.readFileSync(path.join(root, 'pages/partnership.html'), 'utf8');

// Reuse the live site header and footer so nav and branding stay identical.
const header = partnership.slice(partnership.indexOf('<header class="site-header">'), partnership.indexOf('</header>') + '</header>'.length)
  .replace(' aria-current="page"', '');
const footer = partnership.slice(partnership.indexOf('<footer class="site-footer">'), partnership.indexOf('</footer>') + '</footer>'.length);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>IP License &amp; Terms of Use | The Co.LLab™</title>
<meta name="description" content="The Co.LLab IP™ Intellectual Property License &amp; Terms of Use — the license that applies to every Co.LLab™ product, membership, and partnership." />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="https://wearethellab.netlify.app/pages/ip-license.html" />
<link rel="stylesheet" href="../css/base.css" />
<link rel="icon" type="image/png" sizes="32x32" href="../assets/img/favicon-32.png" />
<link rel="apple-touch-icon" href="../assets/img/favicon-180.png" />
<style>
  .license { max-width: 76ch; }
  .license h2 { font-size: clamp(1.1rem, 2.2vw, 1.4rem); margin: 0 0 0.4rem; letter-spacing: 0.02em; }
  .license h3 { font-size: 1.05rem; margin: 2rem 0 0.6rem; }
  .license p, .license li { color: var(--white-dim); line-height: 1.65; }
  .license p { margin: 0 0 0.9rem; }
  .license ul { margin: 0 0 1rem 1.2rem; }
  .license strong { color: var(--white); }
</style>
</head>
<body data-page="ip-license">

${header}

<main>
  <section>
    <div class="wrap">
      <p class="eyebrow">Legal</p>
      <h1 class="headline" style="margin-top:1.5rem;">IP License &amp; Terms of Use</h1>
      <p class="subhead" style="margin-top:1.25rem;">This is the license printed in every Co.LLab™ product. It applies to every product, membership, and partnership tier.</p>
      <div class="license" style="margin-top:2.5rem;">
<!-- BEGIN LICENSE (generated from scripts/pdf-src/docs/_license.mjs) -->
${licenseHtml}
<!-- END LICENSE -->
      </div>
    </div>
  </section>
</main>

${footer}

<script src="../js/main.js"></script>
<script>document.getElementById('year').textContent = new Date().getFullYear();</script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, 'pages/ip-license.html'), html);
console.log('wrote pages/ip-license.html');
