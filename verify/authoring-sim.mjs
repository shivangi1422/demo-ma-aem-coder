/* eslint-disable */
// Authoring simulation: serves a page the way authoring (xwalk/JCR) delivers it, so it can be compared
// with the plain preview. Other requests are proxied to the preview server.
// Usage: node authoring-sim.mjs <previewPageUrl> [port=8812]   -> same path on http://localhost:<port>
// Simulated delivery differences, applied to every block cell (main > div > div[class] > div > div):
//   - rich text wrapped in an extra <div>
//   - stored <p><h2>…</h2></p> arriving as empty paragraphs around each heading
//   - :name: tokens delivered as <span class="icon icon-name"></span>
//   - block item rows carrying their instrumentation (data-aue-resource / data-aue-model)
import http from 'http';
import { JSDOM } from '/usr/local/lib/node_modules/jsdom/lib/api.js';

const [, , pageUrl, port = '8812'] = process.argv;
const target = new URL(pageUrl);
const ITEM_MODELS = { 'table-plan-compare': 'table-plan-compare-row', 'cards-button-caption': 'cards-button-caption-item' };

async function simulated() {
  const html = await (await fetch(pageUrl)).text();
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  doc.querySelectorAll('main > div > div[class]').forEach((block) => {
    const name = block.classList[0];
    if (name === 'section-metadata' || name === 'metadata') return;
    [...block.children].forEach((row, r) => {
      const isItem = name === 'table-plan-compare' ? row.children.length > 1 : !!ITEM_MODELS[name];
      if (isItem) {
        row.dataset.aueResource = `urn:aemconnection:/content/sim/jcr:content/root/section/block/item_${r}`;
        row.dataset.aueModel = ITEM_MODELS[name];
      }
      [...row.children].forEach((cell) => {
        // icons
        const walker = doc.createTreeWalker(cell, 4);
        const texts = [];
        while (walker.nextNode()) texts.push(walker.currentNode);
        texts.forEach((t) => {
          if (!/:[a-z0-9-]+:/.test(t.textContent)) return;
          const frag = doc.createDocumentFragment();
          t.textContent.split(/(:[a-z0-9-]+:)/).forEach((part) => {
            const m = part.match(/^:([a-z0-9-]+):$/);
            if (m) { const s = doc.createElement('span'); s.className = `icon icon-${m[1]}`; frag.append(s); } else if (part) frag.append(part);
          });
          t.replaceWith(frag);
        });
        // empty paragraphs around headings
        cell.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => { h.before(doc.createElement('p')); h.after(doc.createElement('p')); });
        // rich-text wrapper
        if (cell.childNodes.length) {
          const wrap = doc.createElement('div');
          wrap.append(...cell.childNodes);
          cell.append(wrap);
        }
      });
    });
  });
  return dom.serialize();
}

http.createServer(async (req, res) => {
  if (req.url.split('?')[0] === target.pathname) {
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(await simulated());
    return;
  }
  const up = http.request({ host: target.hostname, port: target.port, path: req.url, method: req.method, headers: { ...req.headers, host: target.host } }, (r) => {
    res.writeHead(r.statusCode, r.headers);
    r.pipe(res);
  });
  up.on('error', () => { res.writeHead(502); res.end(); });
  req.pipe(up);
}).listen(Number(port), () => console.log(`authoring simulation of ${pageUrl} at http://localhost:${port}${target.pathname}`));
