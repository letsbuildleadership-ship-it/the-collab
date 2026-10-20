import { licensePageHtml } from './_license.mjs';
import { GLOSSARY_GROUPS, GLOSSARY_COUNT } from './_website-glossary.mjs';

export const meta = {
  key: 'creator-website-glossary',
  outFile: 'creator-website-glossary.pdf',
  docTitle: 'The Website Glossary™',
  cover: {
    eyebrow: '.LLab Creators™ — Free Infographic',
    title: 'The Website <strong>Glossary</strong>™',
    subtitle: `${GLOSSARY_COUNT} words, in plain English: the terms behind a luxury-style, ad-style website.`,
    phase: 'II · Infrastructure Planning & Management',
    price: 'Free',
    footerRight: '.LLab Creators™',
  },
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const group = (g, i) => `
<div class="gx-group">
  <h3 class="gx-head"><span class="gx-n">${String(i + 1).padStart(2, '0')}</span>${esc(g.name)}</h3>
  <div class="gx-grid">${g.terms.map(([t, d]) => `<div class="gx-card"><span class="gx-tag">${esc(t)}</span><p>${esc(d)}</p></div>`).join('')}</div>
</div>`;

const style = `<style>
.gx-group { margin: 0 0 18px; }
.gx-head { margin: 0 0 8px; font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink); border-bottom: 2px solid var(--orange); padding-bottom: 5px; display: flex; align-items: center; gap: 8px; }
.gx-n { background: var(--orange-deep); color: #fff; padding: 2px 6px; border-radius: 3px; font-size: 10px; }
.gx-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 7px; }
.gx-card { break-inside: avoid; background: var(--paper-soft); border-left: 3px solid var(--orange); padding: 7px 9px; }
.gx-tag { display: inline-block; background: var(--hunter); color: rgb(255, 150, 90); font-size: 9.5px; font-weight: 700; padding: 2px 7px; border-radius: 3px; letter-spacing: 0.02em; }
.gx-card p { margin: 5px 0 0; font-size: 9.5px; line-height: 1.4; }
</style>`;

const pageOf = (idx, title, groups, extra = '') => `
<section class="page">
  <div class="content-header">
    <span class="page-index">${idx}</span>
    <h2 class="section-title">${title}</h2>
  </div>
  ${groups}
  ${extra}
</section>`;

export const contentHtml = `
${licensePageHtml}
${style}
${pageOf('01 · The Words', `${GLOSSARY_COUNT} words.<br/><strong>In plain English.</strong>`, GLOSSARY_GROUPS.slice(0, 2).map(group).join(''))}
${pageOf('02 · The Words, Continued', 'Make the system<br/><strong>readable.</strong>', GLOSSARY_GROUPS.slice(2, 4).map((g, i) => group(g, i + 2)).join(''))}
${pageOf('03 · The Words, Continued', 'Name every piece<br/><strong>correctly.</strong>', GLOSSARY_GROUPS.slice(4).map((g, i) => group(g, i + 4)).join(''), `
  <div class="callout">
    <p class="callout-label">What's Next</p>
    <p>These words are the vocabulary. <strong>Creator Website Blueprint™</strong> ($100) puts them to work: a page pattern, a starter site you can put online, and a manual for building with Composio, GitHub, Netlify, Claude and ChatGPT, with an iPhone edition and a computer edition.</p>
  </div>
  <p style="margin-top:24px;"><strong>Build the infrastructure. Strengthen the practice. Create the legacy.</strong><br/>The Co.LLab: Building Leadership Infrastructure™<br/><a href="https://wearethellab.netlify.app/pages/creator.html">Explore .LLab Creators™</a></p>`)}
`;
