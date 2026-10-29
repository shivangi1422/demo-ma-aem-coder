/* eslint-disable */
// Hover / focus styles of links and buttons, source vs ours.
// Usage: node hover-check.mjs <url> <selector;;selector...> [width=1440]
import { createRequire } from 'module';

const require = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-navigation-orchestrator/scripts/package.json');
const { chromium } = require('playwright');
const [, , url, selArg, w = '1440'] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(w), height: 900 } });
page.setDefaultTimeout(15000);
await page.goto(url, { waitUntil: 'load', timeout: 45000 });
await page.waitForTimeout(1500);
const read = (sel) => page.$eval(sel, (e) => { const c = getComputedStyle(e); return `color ${c.color} | bg ${c.backgroundColor} | border ${c.borderTopColor} ${c.borderTopWidth} | deco ${c.textDecorationLine} | outline ${c.outlineStyle} ${c.outlineWidth}`; });
for (const sel of selArg.split(';;')) {
  const el = await page.$(sel);
  if (!el) { console.log(`${sel}: not found`); continue; }
  await el.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(400);
  const base = await read(sel);
  await el.hover();
  await page.waitForTimeout(600);
  const hover = await read(sel);
  await page.mouse.move(0, 0);
  await el.focus();
  await page.waitForTimeout(600);
  const focus = await read(sel);
  console.log(`${sel}\n   base  ${base}\n   hover ${hover}\n   focus ${focus}`);
}
console.log('breadcrumb:', await page.evaluate(() => [...document.querySelectorAll('nav.breadcrumbs li, .breadcrumb-mybeckman li')].map((l) => l.textContent.trim()).join(' > ')));
await browser.close();
