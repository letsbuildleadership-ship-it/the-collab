// Renders every content/library/*.pdf from the branded HTML templates in
// scripts/pdf-src/. Run with: node scripts/generate-pdfs.mjs [key ...]
// (pass one or more doc keys to render a subset while iterating).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { renderCover, wrapDocument } from './pdf-src/render.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'content', 'library');

const ALL_DOCS = [
  'strength-map',
  'alignment-map',
  'build-plan',
  'legacy-profile',
  'operating-system',
  'legacy-map',
  'diagnostic',
  'blueprint',
  'legacy-architecture',
  'founders-organization',
  'membership-handbook',
  'library-card-welcome',
  'journal-vol-1',
  'infrastructure-roadmap',
  'creator-quick-start',
  'creator-diagnostic',
  'creator-practical-tool',
  'creator-product-preview',
  'creator-pathway-guide',
  'creator-identity-map',
  'creator-alignment-map',
  'creator-venture-build-plan',
  'creator-operating-system',
  'creative-estate-mapping',
  'creator-legacy-architecture',
];

async function main() {
  const requested = process.argv.slice(2);
  const keys = requested.length ? requested : ALL_DOCS;

  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROMIUM_PATH || undefined,
  });

  try {
    for (const key of keys) {
      const mod = await import(`./pdf-src/docs/${key}.mjs`);
      const { meta, contentHtml } = mod;
      const coverHtml = renderCover(meta.cover);
      const html = wrapDocument({ docTitle: meta.docTitle, coverHtml, contentHtml });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load' });
      await page.evaluate((title) => {
        const pages = document.querySelectorAll('.page');
        pages.forEach((el, i) => {
          const footer = document.createElement('div');
          footer.className = 'auto-footer';
          footer.innerHTML = `<span>The Co.LLab™ — ${title}</span><span>Page ${i + 1} of ${pages.length}</span>`;
          el.appendChild(footer);
        });
      }, meta.docTitle.replace(/<[^>]+>/g, ''));
      const outPath = path.join(outDir, meta.outFile);
      await page.pdf({ path: outPath, printBackground: true, preferCSSPageSize: true });
      await page.close();

      console.log(`✓ ${meta.outFile}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
