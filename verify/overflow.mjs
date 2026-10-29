/* eslint-disable */
// Lists elements whose right edge is past the viewport (horizontal overflow) at a width.
// Usage: node overflow.mjs <url> [width=390]
import { createRequire } from 'module';

const require = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-navigation-orchestrator/scripts/package.json');
const { chromium } = require('playwright');
const [, , url, w = '390'] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(w), height: 900 } });
page.setDefaultTimeout(15000);
await page.goto(url, { waitUntil: 'load', timeout: 45000 });
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
});
await page.waitForTimeout(1200);
console.log(await page.evaluate(() => {
  const vw = document.documentElement.clientWidth;
  const out = [`scrollWidth ${document.documentElement.scrollWidth} / ${vw}`];
  document.querySelectorAll('body *').forEach((e) => {
    const r = e.getBoundingClientRect();
    if (r.right > vw + 1 && r.width > 0) {
      // only the outermost overflowing element of each branch
      let p = e.parentElement; let inner = false;
      while (p) { const pr = p.getBoundingClientRect(); if (pr.right > vw + 1) { inner = true; break; } p = p.parentElement; }
      if (!inner) out.push(`${e.tagName.toLowerCase()}.${[...e.classList].join('.')} right=${Math.round(r.right)} w=${Math.round(r.width)}`);
    }
  });
  return out.join('\n');
}));
await browser.close();
