/* eslint-disable */
// Regression check for migrated pages: dumps box + key computed styles of every visible element in
// header/main/footer at several widths, or diffs two dumps.
// Usage: node style-dump.mjs dump <url> <out.json> [widths]   |   node style-dump.mjs diff <a.json> <b.json>
import { createRequire } from 'module';
import fs from 'fs';

const require = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-navigation-orchestrator/scripts/package.json');
const [, , mode, a, b, widthsArg = '1440,1024,768,390'] = process.argv;

if (mode === 'diff') {
  const A = JSON.parse(fs.readFileSync(a, 'utf8'));
  const B = JSON.parse(fs.readFileSync(b, 'utf8'));
  let total = 0;
  Object.keys(A).forEach((w) => {
    const diffs = [];
    const n = Math.max(A[w].length, (B[w] || []).length);
    for (let i = 0; i < n; i += 1) {
      const x = A[w][i]; const y = (B[w] || [])[i];
      if (!x || !y || x.p !== y.p) { diffs.push(`structure differs at ${i}: ${x && x.p} vs ${y && y.p}`); break; }
      if (x.v !== y.v) diffs.push(`${x.p}\n    - ${x.v}\n    + ${y.v}`);
    }
    total += diffs.length;
    console.log(`== ${w}: ${diffs.length} differences (of ${A[w].length} elements)`);
    diffs.slice(0, 12).forEach((d) => console.log(`  ${d}`));
  });
  process.exit(total ? 1 : 0);
}

const { chromium } = require('playwright');
const browser = await chromium.launch();
const out = {};
for (const w of widthsArg.split(',').map(Number)) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } });
  page.setDefaultTimeout(15000);
  await page.goto(a, { waitUntil: 'load', timeout: 45000 });
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => { setTimeout(r, 60); });
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(2500);
  out[w] = await page.evaluate(() => {
    const P = ['display', 'position', 'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'color', 'backgroundColor', 'margin', 'padding', 'border', 'borderRadius', 'textAlign', 'gap', 'flexDirection', 'gridTemplateColumns', 'boxShadow', 'opacity', 'textDecorationLine', 'letterSpacing'];
    const res = [];
    const path = (el) => {
      const parts = [];
      let e = el;
      while (e && e !== document.body) {
        const i = e.parentElement ? [...e.parentElement.children].indexOf(e) : 0;
        parts.unshift(`${e.tagName.toLowerCase()}${e.classList[0] ? `.${e.classList[0]}` : ''}[${i}]`);
        e = e.parentElement;
      }
      return parts.join('>');
    };
    document.querySelectorAll('header *, main *, footer *').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height) return;
      const s = getComputedStyle(el);
      res.push({ p: path(el), v: `${Math.round(r.x)},${Math.round(r.y + window.scrollY)},${Math.round(r.width)},${Math.round(r.height)} ${P.map((k) => s[k]).join('|')}` });
    });
    return res;
  });
  await page.close();
}
fs.writeFileSync(b, JSON.stringify(out));
console.log('dumped', Object.entries(out).map(([w, v]) => `${w}:${v.length}`).join(' '));
await browser.close();
