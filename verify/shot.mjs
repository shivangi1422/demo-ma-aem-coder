/* eslint-disable */
// Full-page (or clipped) screenshot of a page at a width.
// Usage: node shot.mjs <url> <out.png> [width=1440] [clipY0,clipY1]
import { createRequire } from 'module';

const require = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-navigation-orchestrator/scripts/package.json');
const { chromium } = require('playwright');
const [, , url, out, w = '1440', clip] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(w), height: 900 } });
page.setDefaultTimeout(15000);
await page.goto(url, { waitUntil: 'load', timeout: 45000 });
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
  window.scrollTo(0, 0);
});
await page.waitForTimeout(1500);
// clipped to the viewport width (fullPage alone can widen the shot to scrolled-overflow content)
const h = await page.evaluate(() => document.documentElement.scrollHeight);
const opts = { path: out, fullPage: true, clip: { x: 0, y: 0, width: Number(w), height: h } };
if (clip) { const [a, b] = clip.split(',').map(Number); opts.clip = { x: 0, y: a, width: Number(w), height: b - a }; }
await page.screenshot(opts);
await browser.close();
