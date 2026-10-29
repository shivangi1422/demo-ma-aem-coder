// Usage: node archived-sections.cjs <archived.html> [pattern]
// Prints the inner HTML of each .bc-rich-text (optionally only those whose text matches pattern),
// with Wayback URL prefixes removed — to see content a live page has since lost.
const fs = require('fs');
const { JSDOM } = require('/usr/local/lib/node_modules/jsdom');

const [, , file, pattern] = process.argv;
const doc = new JSDOM(fs.readFileSync(file, 'utf8')).window.document;
const re = pattern ? new RegExp(pattern) : null;
const WAYBACK = /https?:\/\/web\.archive\.org\/web\/[0-9a-z_]+\//g;
[...doc.querySelectorAll('.bc-rich-text')].forEach((el, i) => {
  if (re && !re.test(el.textContent)) return;
  console.log(`--- rich text ${i}\n${el.innerHTML.replace(WAYBACK, '').replace(/\s+/g, ' ').trim()}\n`);
});
