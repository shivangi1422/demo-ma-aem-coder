// Usage: node main-outline.cjs <snapshot.html>  — prints a compact outline of #main (tags, classes, ids, short text)
const fs = require('fs');
const { JSDOM } = require('/usr/local/lib/node_modules/jsdom');
const dom = new JSDOM(fs.readFileSync(process.argv[2], 'utf8'));
const main = dom.window.document.querySelector('#main') || dom.window.document.body;
const walk = (el, d) => {
  if (['SCRIPT', 'STYLE', 'svg', 'NOSCRIPT'].includes(el.tagName)) return;
  const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').trim();
  const attrs = (el.id ? `#${el.id}` : '') + (el.className && typeof el.className === 'string' ? `.${el.className.trim().split(/\s+/).join('.')}` : '');
  const extra = el.tagName === 'A' ? ` href=${el.getAttribute('href')}` : el.tagName === 'IMG' ? ` src=${el.getAttribute('src')} alt=${el.getAttribute('alt')}` : '';
  console.log(`${'  '.repeat(d)}${el.tagName.toLowerCase()}${attrs}${extra}${own ? ` "${own.slice(0, 90)}"` : ''}`);
  [...el.children].forEach((c) => walk(c, d + 1));
};
walk(main, 0);
