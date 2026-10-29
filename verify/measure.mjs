/* eslint-disable */
// Box + key computed styles for selectors on a page, at several widths.
// Usage: node measure.mjs <url> <selectors.json|'sel1;;sel2'> [widths=1440,390] [--all]
//   --all: every match of each selector (default: first 6 matches)
import { createRequire } from 'module';
import fs from 'fs';

const require = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-navigation-orchestrator/scripts/package.json');
const { chromium } = require('playwright');
const [, , url, selArg, widthsArg = '1440,390', flag] = process.argv;
const selectors = fs.existsSync(selArg) ? JSON.parse(fs.readFileSync(selArg, 'utf8')) : selArg.split(';;');
const PROPS = ['font-family', 'font-size', 'font-weight', 'line-height', 'color', 'background-color', 'padding', 'margin', 'border-top', 'border-right', 'border-bottom', 'border-left', 'text-align', 'width', 'letter-spacing', 'text-transform'];
const browser = await chromium.launch();
for (const w of widthsArg.split(',').map(Number)) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } });
  page.setDefaultTimeout(15000);
  await page.goto(url, { waitUntil: 'load', timeout: 45000 });
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1200);
  const res = await page.evaluate(({ selectors, PROPS, all }) => selectors.map((s) => {
    const els = [...document.querySelectorAll(s)].slice(0, all ? 999 : 6);
    return { s, n: document.querySelectorAll(s).length, els: els.map((e) => {
      const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
      const st = {}; PROPS.forEach((p) => { st[p] = cs.getPropertyValue(p); });
      st['font-family'] = st['font-family'].split(',')[0];
      return { box: [Math.round(r.x), Math.round(r.y + window.scrollY), Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10], text: e.textContent.trim().replace(/\s+/g, ' ').slice(0, 40), st };
    }) };
  }), { selectors, PROPS, all: flag === '--all' });
  console.log(`===== ${w}`);
  res.forEach(({ s, n, els }) => {
    console.log(`-- ${s} (${n})`);
    els.forEach((e) => console.log(`   [${e.box.join(',')}] "${e.text}"\n     ${Object.entries(e.st).map(([k, v]) => `${k}:${v}`).join('; ')}`));
  });
  await page.close();
}
await browser.close();
