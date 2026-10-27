// Usage: node make-image-map.cjs <toolingDir> <pagePath> [<pagePath> ...]
// Every image of a page goes into that page's own folder (no shared folders):
//   /en/products/hematology            -> /products/hematology/<name>
//   /en/blog/diagnostics/<slug>        -> /blog/diagnostics/<slug>/<name>
// Writes <toolingDir>/image-map.json as { pagePath: { originalUrl: localPath } } and copies the
// renamed files into content/<localPath> so the preview (and Sync) can pick them up.
const fs = require('fs');
const path = require('path');

const [toolDir, ...pages] = process.argv.slice(2);
const ROOT = '/content/dam/demo-ma-aem-coder';
const SRC = 'migration-work/dam-upload/demo-ma-aem-coder';
const csv = fs.readFileSync('migration-work/dam-upload/author-rename-list.csv', 'utf8').trim().split('\n').slice(1);
const parse = (line) => line.slice(1, -1).split('","').map((v) => v.replace(/""/g, '"'));
const pageFolder = (p) => p.replace(/^\/en\//, '/');

const map = {};
for (const page of pages) {
  map[page] = {};
  let copied = 0;
  for (const line of csv) {
    const [, newPath, , fileName, , usedOn, , url] = parse(line);
    if (!usedOn.split(' ; ').includes(page)) continue;
    const u = new URL(url);
    const local = `${pageFolder(page)}/${fileName}`;
    map[page][u.origin + u.pathname] = local;
    const base = `${SRC}${newPath.slice(ROOT.length).replace(/\.[a-z]+$/i, '')}`;
    const file = ['.jpg', '.png', '.svg', '.jpeg', '.gif'].map((e) => base + e).find((f) => fs.existsSync(f));
    if (!file) { console.log(`  MISSING local copy: ${page} ${fileName}`); continue; }
    fs.mkdirSync(path.dirname(`content${local}`), { recursive: true });
    fs.copyFileSync(file, `content${local}`);
    copied += 1;
  }
  console.log(`${page}: ${Object.keys(map[page]).length} mapped, ${copied} copied`);
}
fs.writeFileSync(`${toolDir}/image-map.json`, `${JSON.stringify(map, null, 2)}\n`);
