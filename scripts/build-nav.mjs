// One source for the site header menu and the footer menu: rewrites both on
// every page so they always match. Run after adding or renaming a page:
//   node scripts/build-nav.mjs
// The top menu is the site index; the footer holds secondary, contact, legal and social links.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

// Top menu. A group is a dropdown; an item is [page, exact page title, optional short menu label];
// a string item is a section heading inside a dropdown. `cls` keeps the classes main.js and the tests expect.
// Every page of the site is reachable from this menu; the footer only carries secondary links.
export const MENU = [
  { label: 'Home', href: '/' },
  { label: 'The Co.LLab™', id: 'nav-menu-about', cls: 'nav-more nav-group', items: [
    'The enterprise',
    ['about', 'About The Co.LLab™'],
    ['glossary', 'The Co.LLab™ Glossary'],
    'The Co.LLab+™',
    ['community', 'The Co.LLab+ Marketplace™'],
    ['agriculture', 'The Co.LLab+™ Agriculture'],
  ] },
  { label: 'Omnidirectional Enterprise™', id: 'nav-menu-oe', cls: 'nav-more nav-group', items: [
    ['omnidirectional-enterprise', 'Omnidirectional Enterprise Systems™', 'The Models'],
    ['oe-business-model', 'Omnidirectional Enterprise Systems™ · The Enterprise System Model', 'The Enterprise System Model'],
    ['oe-goal', 'Omnidirectional Enterprise Systems™ · Goal and Measures', 'Goal and Measures'],
    ['oe-research', 'Omnidirectional Enterprise Systems™ · Research', 'Research'],
  ] },
  { label: 'The .LLab™', id: 'nav-more-menu', cls: 'nav-more', items: [
    'Ecosystem & membership',
    ['products', 'The .LLab™', 'The .LLab™ Home'],
    ['all-products', 'The .LLab Products™'],
    ['collaborating-companies', 'The .LLab Collaborating Companies'],
    'Research, theory & Intelligence Infrastructure™',
    ['think', 'The .LLab R.A.T.™ · Research And Theory'],
    ['journal', 'The .LLab Journal™'],
    ['library', 'The .LLab Library™'],
    ['legacy-library', 'The .LLab Legacy Library™'],
    'Creator Infrastructure™ & ventures',
    ['creator', 'The .LLab Creators™'],
    ['atelier', 'The .LLab Atelier™'],
    ['efficiency-architecture', 'The .LLab Efficiency Architecture™'],
    ['commercial-transport', 'The .LLab Transport™'],
    ['technology', 'Technology · The .LLab Legacy Ventures™'],
    ['impact', 'The .LLab Impact™'],
  ] },
  { label: 'Partnership™', id: 'nav-menu-partnership', cls: 'nav-more nav-group', items: [
    ['partnership', 'Partnership™'],
    ['partnership#tiers', 'The four Partnership levels', 'The Four Levels'],
    ['partnership#partner-ip', 'Partnership IP', 'Partnership IP'],
    ['partnership#included', "What's included", "What's Included"],
    ['partnership#terms', 'Clear Terms', 'Clear Terms'],
    ['partnership#partner-wall', 'Every Partner, permanently', 'Partner Wall'],
  ] },
  { label: 'Founders Organization™', id: 'nav-menu-founders', cls: 'nav-more nav-group', items: [
    ['founders', 'The Co.LLab Founders Organization™', 'The Co.LLab Founders Organization™'],
    ['founders-purpose', 'The Co.LLab Founders Organization™ · Purpose', 'Purpose'],
    ['founders-strategy', 'The Co.LLab Founders Organization™ · Investment Strategy', 'Investment Strategy'],
  ] },
  { label: 'Get in touch', id: 'nav-menu-contact', cls: 'nav-more nav-group', items: [
    ['contact', 'Contact Us'],
    ['contact#founder', 'Meet the Founder'],
  ] },
];

// Footer: secondary links only (the full site index is the top menu).
// [page(#hash), label]; a page starting with mailto:/https: is used as-is.
export const FOOTER = [
  { label: 'Explore', items: [
    ['all-products', 'The .LLab Products™'],
    ['journal-preview', 'The .LLab Journal™ · Free Preview'],
    ['omnidirectional-enterprise#legacy-wall', 'Omnidirectional Legacy Wall'],
    ['glossary', 'The Co.LLab™ Glossary'],
  ] },
  { label: 'Members', items: [
    ['login', 'Member Login'],
    ['login#join', 'Join free'],
    ['login#forgot-password', 'Forgot password?'],
    ['account', 'Member Portal™'],
  ] },
  { label: 'Contact', items: [
    ['contact', 'Contact Us'],
    ['mailto:hello@wearethellab.com', 'hello@wearethellab.com'],
    ['mailto:support@wearethellab.com', 'support@wearethellab.com'],
    ['contact#card', 'Digital business card'],
  ] },
  { label: 'Legal', items: [
    ['ip-license', 'IP License & Terms of Use'],
    ['partnership#terms', 'Clear Terms'],
  ] },
  { label: 'Follow', items: [
    ['https://www.instagram.com/theco.llab_/', 'Instagram · @theco.llab_'],
  ] },
];

const esc = (s) => s.replace(/&(?!amp;)/g, '&amp;');

function hrefFor(page, isRoot) {
  return isRoot ? `pages/${page}.html` : `${page}.html`;
}

function link(page, label, here, isRoot, hash = '') {
  if (/^(mailto:|https?:)/.test(page)) {
    const ext = page.startsWith('http') ? ' rel="noopener" target="_blank"' : '';
    return `<a href="${page}"${ext}>${esc(label)}</a>`;
  }
  if (page.includes('#')) { [page, hash] = [page.split('#')[0], '#' + page.split('#')[1]]; }
  const cur = page === here && !hash ? ' aria-current="page"' : '';
  return `<a href="${hrefFor(page, isRoot)}${hash}"${cur}>${esc(label)}</a>`;
}

function homeLink(here) {
  return `<a href="/"${here === 'index' ? ' aria-current="page"' : ''}>Home</a>`;
}

// Language menu (Google Website Translator, loaded by js/main.js only when a language is chosen).
export const LANGS = [['en', 'English'], ['es', 'Español'], ['fr', 'Français'], ['pt', 'Português'], ['de', 'Deutsch'], ['it', 'Italiano'],
  ['zh-CN', '中文'], ['ja', '日本語'], ['ko', '한국어'], ['ar', 'العربية'], ['hi', 'हिन्दी'], ['vi', 'Tiếng Việt'], ['tl', 'Tagalog'], ['ht', 'Kreyòl'], ['sw', 'Kiswahili'], ['ru', 'Русский']];

export function navHtml(here, isRoot) {
  const out = ['      <ul class="nav-links">'];
  for (const m of MENU) {
    if (m.href === '/') out.push(`        <li>${homeLink(here)}</li>`);
    else if (m.page) out.push(`        <li>${link(m.page, m.label, here, isRoot)}</li>`);
    else {
      const inGroup = m.items.some((it) => typeof it !== 'string' && it[0].split('#')[0] === here);
      out.push(`        <li class="${m.cls}">`);
      out.push(`          <button type="button" class="nav-more-toggle" aria-expanded="false" aria-controls="${m.id}"${inGroup ? ' data-current' : ''}>${esc(m.label)}</button>`);
      out.push(`          <ul class="nav-more-menu" id="${m.id}">`);
      for (const it of m.items) {
        if (typeof it === 'string') { out.push(`            <li class="nav-more-head" aria-hidden="true">${esc(it)}</li>`); continue; }
        const [p, l, short] = it;
        out.push(`            <li>${link(p, short || l, here, isRoot)}</li>`);
      }
      out.push('          </ul>');
      out.push('        </li>');
    }
  }
  out.push('        <li class="nav-more nav-lang notranslate" translate="no">');
  out.push('          <button type="button" class="nav-more-toggle" aria-expanded="false" aria-controls="nav-menu-lang" aria-label="Language"><span aria-hidden="true">🌐</span> <span class="lang-current">EN</span></button>');
  out.push('          <ul class="nav-more-menu" id="nav-menu-lang">');
  for (const [code, name] of LANGS) out.push(`            <li><button type="button" class="lang-opt" data-lang="${code}" lang="${code}">${name}</button></li>`);
  out.push('          </ul>');
  out.push('        </li>');
  out.push(`        <li class="nav-signin">${link('login', 'Sign in', here, isRoot)}</li>`);
  out.push('      </ul>');
  return out.join('\n');
}

export function footerHtml(here, isRoot, brandCol) {
  const cols = [brandCol];
  const col = (h, lis) => `      <div class="footer-col">\n        <h4>${esc(h)}</h4>\n        <ul>\n${lis.map((l) => `          <li>${l}</li>`).join('\n')}\n        </ul>\n      </div>`;
  for (const c of FOOTER) cols.push(col(c.label, c.items.map(([p, l]) => link(p, l, here, isRoot))));
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
