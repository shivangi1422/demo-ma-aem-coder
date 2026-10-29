/* eslint-disable */
// Side-by-side box + key style comparison of source vs ours for paired selectors.
// Usage: node compare-boxes.mjs <srcUrl> <oursUrl> <pairs.json> [widths=1440,1024,768,390]
//   pairs.json: [[label, srcSelector, oursSelector], ...] — every match of each selector is compared
//   Prints only differences (box > 2px off, or a differing style); y is relative to the first pair's first box.
import { createRequire } from 'module';
import fs from 'fs';

const require = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-navigation-orchestrator/scripts/package.json');
const { chromium } = require('playwright');
const [, , srcUrl, oursUrl, pairsFile, widthsArg = '1440,1024,768,390'] = process.argv;
const pairs = JSON.parse(fs.readFileSync(pairsFile, 'utf8'));
const PROPS = ['font-size', 'font-weight', 'line-height', 'color', 'background-color', 'padding', 'margin', 'border-top', 'border-bottom', 'border-left', 'text-align', 'letter-spacing', 'text-transform'];

async function collect(browser, url, w, idx) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } });
  page.setDefaultTimeout(15000);
  await page.goto(url, { waitUntil: 'load', timeout: 45000 });
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1200);
  const res = await page.evaluate(({ sels, PROPS }) => sels.map((s) => [...document.querySelectorAll(s)].map((e) => {
    const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
    return { box: [r.x, r.y + window.scrollY, r.width, r.height].map((v) => Math.round(v * 10) / 10), st: Object.fromEntries(PROPS.map((p) => [p, cs.getPropertyValue(p)])), text: e.textContent.trim().replace(/\s+/g, ' ').slice(0, 30) };
  })), { sels: pairs.map((p) => p[idx]), PROPS });
  await page.close();
  return res;
}

const browser = await chromium.launch();
for (const w of widthsArg.split(',').map(Number)) {
  const S = await collect(browser, srcUrl, w, 1);
  const O = await collect(browser, oursUrl, w, 2);
  const s0 = S[0][0]?.box[1] || 0; const o0 = O[0][0]?.box[1] || 0;
  let n = 0;
  console.log(`===== ${w}  (y relative: src-${s0} ours-${o0})`);
  pairs.forEach(([label], i) => {
    const a = S[i]; const b = O[i];
    if (a.length !== b.length) { console.log(`  ${label}: count ${a.length} vs ${b.length}`); n += 1; }
    for (let k = 0; k < Math.min(a.length, b.length); k += 1) {
      const ba = [a[k].box[0], a[k].box[1] - s0, a[k].box[2], a[k].box[3]].map((v) => Math.round(v));
      const bb = [b[k].box[0], b[k].box[1] - o0, b[k].box[2], b[k].box[3]].map((v) => Math.round(v));
      const boxDiff = ba.some((v, j) => Math.abs(v - bb[j]) > 2);
      const stDiff = PROPS.filter((p) => a[k].st[p] !== b[k].st[p] && !(p.startsWith('border') && a[k].st[p].startsWith('0px') && b[k].st[p].startsWith('0px')));
      if (boxDiff || stDiff.length) {
        n += 1;
        console.log(`  ${label}[${k}] "${a[k].text}"${boxDiff ? `  box src ${ba.join(',')} | ours ${bb.join(',')}` : ''}`);
        stDiff.forEach((p) => console.log(`      ${p}: ${a[k].st[p]} | ${b[k].st[p]}`));
      }
    }
  });
  console.log(`  -> ${n} differing items`);
}
await browser.close();
