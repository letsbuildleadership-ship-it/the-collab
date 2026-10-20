// The Home contents are the Navigate and More lists of the footer, as plain clickable links, so the
// contents always match the navigation. Run after changing either footer list on the Home page.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'index.html');
let s = fs.readFileSync(file, 'utf8');
const list = (heading) => {
  const m = new RegExp(`<h4>${heading}</h4>\\s*<ul>([\\s\\S]*?)</ul>`).exec(s);
  return [...m[1].matchAll(/<li><a href="([^"]+)"[^>]*>([^<]+)<\/a><\/li>/g)].map((x) => [x[1], x[2]]).filter(([h]) => h !== '/');
};
const group = (title, rows) => `<div class="toc-group">
        <p class="eyebrow">${title}</p>
        <ul class="toc-links">
${rows.map(([h, n]) => `          <li><a href="${h}">${n}<span class="arrow">→</span></a></li>`).join('\n')}
        </ul>
      </div>`;
const block = `<section class="band cover-toc" id="contents">
    <div class="wrap">
      <p class="eyebrow">Contents</p>
      <div class="toc-groups">
      ${group('Navigate', list('Navigate'))}
      ${group('More', list('More'))}
      </div>
    </div>
  </section>`;
s = s.replace(/<section class="band cover-toc" id="contents">[\s\S]*?<\/section>/, block);
fs.writeFileSync(file, s);
console.log('contents synced');
