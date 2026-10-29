// Usage: node inline-styles.cjs <snapshot.html> — prints the page's inline <style> blocks (not FA/consent boilerplate)
const fs = require('fs');
const { JSDOM } = require('/usr/local/lib/node_modules/jsdom');
const doc = new JSDOM(fs.readFileSync(process.argv[2], 'utf8')).window.document;
[...doc.querySelectorAll('style')].forEach((s, i) => {
  const t = s.textContent.trim();
  if (t.length && !/onetrust|ot-sdk|font-awesome|@font-face/i.test(t.slice(0, 400))) console.log(`/* ---- style ${i} (${t.length}) in ${s.parentElement.tagName} */\n${t}\n`);
});
