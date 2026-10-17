// Builds pages/lookbook.html from assets/img/editorial/manifest.json (every photo, filterable by phase, with lightbox).
//   node scripts/build-gallery.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const partnership = fs.readFileSync(path.join(root, 'pages/partnership.html'), 'utf8');
const slice = (a, b) => partnership.slice(partnership.indexOf(a), partnership.indexOf(b) + b.length);
const header = slice('<header class="site-header">', '</header>').replace(' aria-current="page"', '');
const footer = slice('<footer class="site-footer">', '</footer>');
const cta = partnership.match(/  <section class="band llab-cta">[\s\S]*?<\/section>/)[0];
const photos = JSON.parse(fs.readFileSync(path.join(root, 'assets/img/editorial/manifest.json'), 'utf8')).filter((p) => p.gallery !== false);
const PH = { 1: 'I · Foundations', 2: 'II · Planning', 3: 'III · Operating Systems', 4: 'IV · Preservation' };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const phases = [1, 2, 3, 4].filter((n) => photos.some((p) => p.phase === n));

const shots = photos.map((p) => `      <a class="shot" href="../assets/img/editorial/${p.file}" data-phase="${p.phase ?? ''}" data-alt="${esc(p.alt || 'Photograph by The Co.LLab™')}">
        <img src="../assets/img/editorial/${p.file}" width="${p.width}" height="${p.height}" loading="lazy" alt="${esc(p.alt || 'Photograph by The Co.LLab™')}" />${p.phase ? `\n        <span class="shot-label">${PH[p.phase]}</span>` : ''}
      </a>`).join('\n');
const chips = phases.length ? `      <div class="chips" role="group" aria-label="Filter by phase">
        <button class="chip" type="button" aria-pressed="true" data-filter="">All</button>
${phases.map((n) => `        <button class="chip" type="button" aria-pressed="false" data-filter="${n}">${PH[n]}</button>`).join('\n')}
      </div>` : '';

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Lookbook — Photographs | The Co.LLab™</title>
<meta name="description" content="Photographs from The Co.LLab™ — infrastructure, craft, and the places legacy is built, organized by The IV Phases™." />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="https://wearethellab.netlify.app/pages/lookbook.html" />
<meta property="og:title" content="Lookbook — Photographs | The Co.LLab™" />
<meta property="og:image" content="https://wearethellab.netlify.app/assets/img/og-cover.png" />
<link rel="stylesheet" href="../css/base.css" />
<link rel="icon" type="image/png" sizes="32x32" href="../assets/img/favicon-32.png" />
<link rel="apple-touch-icon" href="../assets/img/favicon-180.png" />
</head>
<body data-page="lookbook">

${header}

<main>
  <section style="padding-top: clamp(4rem, 8vw, 7rem);">
    <div class="wrap">
      <p class="eyebrow">Lookbook</p>
      <h1 class="headline" style="margin-top:1.5rem;">Where legacy <strong>is built.</strong></h1>
      <p class="subhead" style="margin-top:1.25rem;">Photographs from The Co.LLab™, organized by The IV Phases™.</p>
${chips}
      <div class="shots">
${shots}
      </div>
    </div>
  </section>

  <hr class="hairline" />

${cta}
</main>

<dialog class="lightbox" aria-label="Photograph"><button type="button" class="lb-close" aria-label="Close">×</button><button type="button" class="lb-prev" aria-label="Previous">‹</button><img alt="" /><button type="button" class="lb-next" aria-label="Next">›</button><p class="lb-cap"></p></dialog>

${footer}

<script src="../js/main.js"></script>
<script>
(function () {
  var shots = [].slice.call(document.querySelectorAll('.shot')), dlg = document.querySelector('.lightbox'), img = dlg.querySelector('img'), cap = dlg.querySelector('.lb-cap'), cur = 0;
  function visible() { return shots.filter(function (s) { return !s.hidden; }); }
  function show(i) { var v = visible(); cur = (i + v.length) % v.length; img.src = v[cur].href; img.alt = v[cur].dataset.alt; cap.textContent = v[cur].dataset.alt; }
  shots.forEach(function (s) { s.addEventListener('click', function (e) { e.preventDefault(); show(visible().indexOf(s)); dlg.showModal(); }); });
  dlg.querySelector('.lb-close').onclick = function () { dlg.close(); };
  dlg.querySelector('.lb-prev').onclick = function () { show(cur - 1); };
  dlg.querySelector('.lb-next').onclick = function () { show(cur + 1); };
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') show(cur - 1); if (e.key === 'ArrowRight') show(cur + 1); });
  [].forEach.call(document.querySelectorAll('.chip'), function (c) { c.addEventListener('click', function () {
    [].forEach.call(document.querySelectorAll('.chip'), function (x) { x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); });
    shots.forEach(function (s) { s.hidden = !!c.dataset.filter && s.dataset.phase !== c.dataset.filter; });
  }); });
})();
</script>
<script>document.getElementById('year').textContent = new Date().getFullYear();</script>
</body>
</html>
`;
fs.writeFileSync(path.join(root, 'pages/lookbook.html'), html);
console.log(`wrote pages/lookbook.html (${photos.length} photos)`);
