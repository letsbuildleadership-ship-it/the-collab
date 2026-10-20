// Bakes a soft red glow behind the bold title words into each page's background as an OPAQUE image,
// so no blur/shadow/transparency reaches the PDF (iPhone viewers draw those as boxes).
export async function bakeGlow(browser, page, { sectionSel, titleSel, w, h, scale = 2, base = '#0f1d13', grid = 'rgba(255,106,46,.10)', noGridSel = '.cv, .cover' }) {
  const data = await page.evaluate(({ sectionSel, titleSel, noGridSel }) => {
    return [...document.querySelectorAll(sectionSel)].map((sec) => {
      const sr = sec.getBoundingClientRect();
      const lines = new Map();
      sec.querySelectorAll(titleSel).forEach((b) => {
        const r = document.createRange(); r.selectNodeContents(b);
        [...r.getClientRects()].forEach((q) => {
          if (q.width < 2) return;
          const key = Math.round(q.top / 6);
          const x1 = q.left - sr.left, x2 = q.right - sr.left, y1 = q.top - sr.top, y2 = q.bottom - sr.top;
          const e = lines.get(key);
          if (e) { e.x1 = Math.min(e.x1, x1); e.x2 = Math.max(e.x2, x2); e.y1 = Math.min(e.y1, y1); e.y2 = Math.max(e.y2, y2); } else lines.set(key, { x1, x2, y1, y2 });
        });
      });
      return { rects: [...lines.values()], noGrid: sec.matches(noGridSel) };
    });
  }, { sectionSel, titleSel, noGridSel });
  const bg = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
  const urls = [];
  for (const d of data) {
    const gridCss = d.noGrid ? '' : `background-image:linear-gradient(${grid} 1px,transparent 1px),linear-gradient(90deg,${grid} 1px,transparent 1px);background-size:64px 64px;`;
    const glows = d.rects.map((r) => {
      const padX = 10, padY = 4;
      return `<div style="position:absolute;left:${r.x1 - padX}px;top:${r.y1 + 4 - padY}px;width:${r.x2 - r.x1 + padX * 2}px;height:${Math.max(8, r.y2 - r.y1 - 8) + padY * 2}px;border-radius:40px;background:rgba(255,34,20,.5);filter:blur(16px)"></div><div style="position:absolute;left:${r.x1 - 26}px;top:${r.y1 - 8}px;width:${r.x2 - r.x1 + 52}px;height:${r.y2 - r.y1 + 16}px;border-radius:60px;background:rgba(255,80,30,.22);filter:blur(34px)"></div>`;
    }).join('');
    await bg.setContent(`<body style="margin:0"><div style="position:relative;width:${w}px;height:${h}px;overflow:hidden;background-color:${base};${gridCss}">${glows}</div></body>`);
    const buf = await bg.screenshot({ type: 'png' });
    urls.push(`data:image/png;base64,${buf.toString('base64')}`);
  }
  await bg.close();
  await page.evaluate(({ sectionSel, urls }) => {
    [...document.querySelectorAll(sectionSel)].forEach((sec, i) => { sec.style.backgroundImage = `url(${urls[i]})`; sec.style.backgroundSize = '100% 100%'; sec.style.backgroundRepeat = 'no-repeat'; });
  }, { sectionSel, urls });
}
