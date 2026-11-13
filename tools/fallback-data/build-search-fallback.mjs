/*
 * Builds the saved-data fallback for the coveo-search block from recorded search
 * responses (migration-work/search-tools/record-search.mjs output: one live
 * search/v2 request and response per tab, captured on www.mybeckman.in).
 *
 *   node tools/fallback-data/build-search-fallback.mjs <recorded-search.json> <out-dir>
 *
 * Writes <out-dir>/<tabId>.json per tab: the recorded results in live relevancy
 * order, trimmed to the fields the block renders and filters on, plus the live
 * total. The block only reads these files when the live search is unreachable.
 */
/* eslint-disable no-console -- command-line tool */
import fs from 'fs';
import path from 'path';

const [recordedFile, outDir] = process.argv.slice(2);
if (!recordedFile || !outDir) {
  console.error('usage: build-search-fallback.mjs <recorded-search.json> <out-dir>');
  process.exit(1);
}

const { capturedAt, recorded } = JSON.parse(fs.readFileSync(recordedFile, 'utf8'));

const RESULT_FIELDS = ['title', 'clickUri', 'uniqueId', 'templateType', 'imageUrl', 'imageAlt',
  'excerpt', 'showTechDoc'];
const RAW_FIELDS = ['syssource', 'z95xname', 'partz32xnumber', 'itemtitlewithbranding',
  'itemdescription', 'fbody72451', 'imageurl', 'documenttitle', 'documentid', 'documentname',
  'documentnumber', 'documentrevision', 'documentdescription', 'documentlanguage', 'category',
  'releasedate', 'lotnumber', 'itemnumber', 'productline', 'product', 'disclaimer', 'accesstype'];
const TEXT_LIMIT = 600;

// inline <style> / <script> blocks in page bodies are dropped, not kept as text
const plain = (html) => String(html)
  .replace(/<(style|script|noscript)\b[\s\S]*?<\/\1\s*>/gi, ' ')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/\s+/g, ' ')
  .trim();

fs.mkdirSync(outDir, { recursive: true });
Object.entries(recorded).forEach(([tab, { request, response }]) => {
  const facetFields = JSON.parse(request.groupBy || '[]').map((g) => g.field.replace(/^@/, '').toLowerCase());
  const keepRaw = new Set([...RAW_FIELDS, ...facetFields]);
  const results = (response.results || []).map((r) => {
    const out = {};
    RESULT_FIELDS.forEach((f) => { if (r[f] !== undefined && r[f] !== '') out[f] = r[f]; });
    if (out.excerpt) out.excerpt = plain(out.excerpt).slice(0, TEXT_LIMIT);
    const raw = {};
    Object.entries(r.raw || {}).forEach(([k, v]) => {
      if (!keepRaw.has(k) || v === '' || v === null || v === undefined) return;
      raw[k] = (k === 'fbody72451' || k === 'itemdescription' || k === 'documentdescription')
        ? plain(v).slice(0, TEXT_LIMIT) : v;
    });
    out.raw = raw;
    return out;
  });
  const file = path.join(outDir, `${tab}.json`);
  fs.writeFileSync(file, `${JSON.stringify({
    capturedAt: capturedAt.slice(0, 10),
    source: 'https://www.mybeckman.in/search',
    tab,
    liveTotal: response.totalCount,
    results,
  })}\n`);
  console.log(`${file}: ${results.length} results, ${fs.statSync(file).size} bytes`);
});
