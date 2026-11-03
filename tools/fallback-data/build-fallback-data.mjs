/*
 * Builds the saved-data fallback files for a product page from recorded API
 * traffic (a JSON array of { url, postData, body } entries captured on the
 * source page, e.g. migration-work/cytobank/inpage-test-calls.json with full
 * response bodies).
 *
 *   node tools/fallback-data/build-fallback-data.mjs <calls.json> <out-dir> <source-url>
 *
 * Writes <out-dir>/licenses.json (every Product Table result, in the live
 * relevancy order, trimmed to the fields the coveo-products block renders and
 * filters on) and <out-dir>/resources.json (the resource controller's complete
 * list). The blocks only use these files when the live API is unreachable.
 */
/* eslint-disable no-console -- command-line tool */
import fs from 'fs';
import path from 'path';

const [callsFile, outDir, sourceUrl] = process.argv.slice(2);
if (!callsFile || !outDir) {
  console.error('usage: build-fallback-data.mjs <calls.json> <out-dir> <source-url>');
  process.exit(1);
}

const calls = JSON.parse(fs.readFileSync(callsFile, 'utf8'));
const form = (c) => Object.fromEntries(new URLSearchParams(c.postData || ''));
const json = (c) => {
  try { return JSON.parse(c.body || c.responseBody || ''); } catch { return null; }
};

// ---- licenses: unfiltered Product Table pages, merged by firstResult ----
const RESULT_FIELDS = ['title', 'clickUri', 'uniqueId', 'imageUrl', 'imageAlt', 'requestQuoteLink',
  'productRfqLink', 'isSalable', 'showBuyingOptions', 'showPriceSection', 'showLoginForPrice',
  'showAddToCartDirect', 'productRfq', 'listPrice', 'productPrice'];
const RAW_FIELDS = ['itemtitle', 'z95xname', 'partz32xnumber', 'imageurl', 'urllink'];
const pages = new Map();
let facetFields = [];
let total = 0;
calls.filter((c) => /coveo\/rest\/search\/v2/.test(c.url)).forEach((c) => {
  const params = form(c);
  if (params.searchHub !== 'Product Table') return;
  const groupBy = JSON.parse(params.groupBy || '[]');
  // unfiltered = no facet selection prepended to the advanced query
  if (groupBy.some((g) => (g.allowedValues || []).length)) return;
  const data = json(c);
  if (!data) return;
  facetFields = groupBy.map((g) => g.field.replace(/^@/, ''));
  total = data.totalCount;
  pages.set(Number(params.firstResult), data.results);
});
const results = [...pages.keys()].sort((a, b) => a - b).flatMap((first) => pages.get(first))
  .filter((r, i, all) => all.findIndex((x) => x.uniqueId === r.uniqueId) === i)
  .map((r) => {
    const out = Object.fromEntries(RESULT_FIELDS
      .filter((f) => r[f] !== undefined)
      .map((f) => [f, r[f]]));
    out.raw = Object.fromEntries([...RAW_FIELDS, ...facetFields]
      .filter((f) => r.raw && r.raw[f] !== undefined).map((f) => [f, r.raw[f]]));
    return out;
  });
if (results.length !== total) {
  console.error(`licenses: recorded ${results.length} of ${total} results; record every page first`);
  process.exit(1);
}

// ---- resources: the controller returns the complete list with every page ----
const resourceCall = calls.find((c) => /GetContentResources/.test(c.url) && json(c)?.completelist);
const resources = resourceCall ? json(resourceCall).completelist : [];

const capturedAt = new Date().toISOString().slice(0, 10);
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'licenses.json'), `${JSON.stringify({
  source: sourceUrl, capturedAt, searchHub: 'Product Table', totalCount: total, results,
}, null, 1)}\n`);
fs.writeFileSync(path.join(outDir, 'resources.json'), `${JSON.stringify({
  source: sourceUrl, capturedAt, pageSize: 5, items: resources,
}, null, 1)}\n`);
console.log(`licenses: ${results.length}, resources: ${resources.length} -> ${outDir}`);
