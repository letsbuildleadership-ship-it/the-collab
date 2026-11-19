// One source for the site header menu and the footer menu: rewrites both on
// every page so they always match. Run after adding or renaming a page:
//   node scripts/build-nav.mjs
// Footer columns follow the top menu, in the same order and with the same labels.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

// Top menu. A group is a dropdown; an item is [page, exact page title (footer), optional short menu label]; `cls` keeps the classes main.js and the tests expect.
export const MENU = [
  { label: 'Home', href: '/' },
  { label: 'The Co.LLab+™', id: 'nav-menu-plus', cls: 'nav-more nav-group', items: [
    ['community', 'The Co.LLab+ Marketplace™'],
    ['agriculture', 'The Co.LLab+™ Agriculture'],
  ] },
  { label: 'The .LLab™', id: 'nav-more-menu', cls: 'nav-more', items: [
    ['products', 'The .LLab™'],
    ['all-products', 'The .LLab Products™'],
    ['think', 'The .LLab R.A.T.™ · Research And Theory'],
    ['journal', 'The .LLab Journal™'],
    ['journal-preview', 'The .LLab Journal™ · Free Preview'],
    ['library', 'The .LLab Library™'],
    ['legacy-library', 'The .LLab Legacy Library™'],
    ['collaborating-companies', 'The .LLab Collaborating Companies'],
    ['atelier', 'The .LLab Atelier™'],
    ['efficiency-architecture', 'The .LLab Efficiency Architecture™'],
    ['creator', 'The .LLab Creators™'],
    ['commercial-transport', 'The .LLab Transport™'],
    ['technology', 'Technology · The .LLab Legacy Ventures™'],
    ['impact', 'The .LLab Impact™'],
  ] },
  { label: 'Partnership™', page: 'partnership' },
  { label: 'The Co.LLab Founders Organization™', id: 'nav-menu-founders', cls: 'nav-more nav-group', items: [
    ['founders', 'The Co.LLab Founders Organization™'],
    ['founders-purpose', 'The Co.LLab Founders Organization™ · Purpose', 'Purpose'],
    ['founders-strategy', 'The Co.LLab Founders Organization™ · Investment Strategy', 'Investment Strategy'],
  ] },
  { label: 'Omnidirectional Enterprise Systems™', id: 'nav-menu-oe', cls: 'nav-more nav-group', items: [
    ['omnidirectional-enterprise', 'Omnidirectional Enterprise Systems™', 'The Models'],
    ['oe-business-model', 'Omnidirectional Enterprise Systems™ · The Enterprise System Model', 'The Enterprise System Model'],
    ['oe-goal', 'Omnidirectional Enterprise Systems™ · Goal and Measures', 'Goal and Measures'],
    ['oe-research', 'Omnidirectional Enterprise Systems™ · Research', 'Research'],
  ] },
  { label: 'About Us', id: 'nav-menu-about', cls: 'nav-more nav-group', items: [
    ['about', 'About The Co.LLab™'],
    ['glossary', 'Glossary'],
  ] },
  { label: 'Contact Us', id: 'nav-menu-contact', cls: 'nav-more nav-group', items: [
    ['contact', 'Contact Us'],
    ['contact#founder', 'Meet the Founder'],
  ] },
];

// Extra footer-only links under the Contact Us column.
const CONTACT_EXTRA = [['login', 'Member Login'], ['account', 'Member Portal™'], ['contact', 'Digital business card', '#card']];

const esc = (s) => s.replace(/&(?!amp;)/g, '&amp;');

function hrefFor(page, isRoot) {
  return isRoot ? `pages/${page}.html` : `${page}.html`;
}

function link(page, label, here, isRoot, hash = '') {
  if (page.includes('#')) { [page, hash] = [page.split('#')[0], '#' + page.split('#')[1]]; }
  const cur = page === here && !hash ? ' aria-current="page"' : '';
  return `<a href="${hrefFor(page, isRoot)}${hash}"${cur}>${esc(label)}</a>`;
}

function homeLink(here) {
  return `<a href="/"${here === 'index' ? ' aria-current="page"' : ''}>Home</a>`;
}

export function navHtml(here, isRoot) {
  const out = ['      <ul class="nav-links">'];
  for (const m of MENU) {
    if (m.href === '/') out.push(`        <li>${homeLink(here)}</li>`);
    else if (m.page) out.push(`        <li>${link(m.page, m.label, here, isRoot)}</li>`);
    else {
      out.push(`        <li class="${m.cls}">`);
      out.push(`          <button type="button" class="nav-more-toggle" aria-expanded="false" aria-controls="${m.id}">${esc(m.label)}</button>`);
      out.push(`          <ul class="nav-more-menu" id="${m.id}">`);
      for (const [p, l, short] of m.items) out.push(`            <li>${link(p, short || l, here, isRoot)}</li>`);
      out.push('          </ul>');
      out.push('        </li>');
    }
  }
  out.push(`        <li class="nav-signin">${link('login', 'Sign in', here, isRoot)}</li>`);
  out.push('      </ul>');
  return out.join('\n');
}

export function footerHtml(here, isRoot, brandCol) {
  const cols = [brandCol];
  const col = (h, lis) => `      <div class="footer-col">\n        <h4>${esc(h)}</h4>\n        <ul>\n${lis.map((l) => `          <li>${l}</li>`).join('\n')}\n        </ul>\n      </div>`;
  for (const m of MENU) {
    if (m.href === '/') continue;
    if (m.page) {
      cols.push(col(m.label, [link(m.page, m.label, here, isRoot)]));
    } else {
      const lis = m.items.map(([p, l]) => link(p, l, here, isRoot));
      if (m.label === 'About Us') lis.unshift(homeLink(here));
      if (m.label === 'Contact Us') lis.push(...CONTACT_EXTRA.map(([p, l, h]) => link(p, l, here, isRoot, h || '')));
      cols.push(col(m.label, lis));
    }
  }
  return `<div class="footer-grid footer-grid--menu">\n${cols.join('\n')}\n    </div>\n    `;
}

export function rebuild(html, here, isRoot) {
  html = html.replace(/ {6}<ul class="nav-links">[\s\S]*?<li class="nav-signin">[\s\S]*?<\/li>\s*<\/ul>/, navHtml(here, isRoot));
  const fStart = html.indexOf('<div class="footer-grid');
  const fEnd = html.indexOf('<p class="tax-note">', fStart);
  if (fStart < 0 || fEnd < 0) throw new Error(`${here}: footer not found`);
  const footer = html.slice(fStart, fEnd);
  const brand = /<div class="footer-col">\s*<a href="[^"]*" class="wordmark">[\s\S]*?<\/div>/.exec(footer);
  if (!brand) throw new Error(`${here}: footer brand column not found`);
  return html.slice(0, fStart) + footerHtml(here, isRoot, `      ${brand[0]}`) + html.slice(fEnd);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const files = ['index.html', ...fs.readdirSync(path.join(root, 'pages')).filter((n) => n.endsWith('.html')).map((n) => `pages/${n}`)];
  let n = 0;
  for (const f of files) {
    const p = path.join(root, f);
    const html = fs.readFileSync(p, 'utf8');
    if (!html.includes('<ul class="nav-links">')) continue;
    const here = f === 'index.html' ? 'index' : path.basename(f, '.html');
    const next = rebuild(html, here, f === 'index.html');
    if (next !== html) { fs.writeFileSync(p, next); n++; }
  }
  console.log(`menus rebuilt on ${n} pages`);
}
