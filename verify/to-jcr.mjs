/* eslint-disable */
// Converts a page the way authoring stores it (html2md + md2jcr with the project's merged models)
// and writes the JCR XML. Run from the project root after `npm run build:json`.
// Usage: node migration-work/verify/to-jcr.mjs <page.plain.html> <out.xml>
import { createRequire } from 'module';
import fs from 'fs';

const require = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/check-xwalk-jcr.mjs');
const { html2md } = await import(require.resolve('@adobe/helix-html2md'));
const { md2jcr } = await import(require.resolve('@adobe/helix-md2jcr'));
const SILENT = { info() {}, debug() {}, trace() {}, warn() {}, error() {} };
const [, , file, out] = process.argv;
const html = fs.readFileSync(file, 'utf8');
const doc = html.includes('<main') ? html : `<body><main>${html}</main></body>`;
const markdown = await html2md(doc, { log: SILENT });
const read = (k) => JSON.parse(fs.readFileSync(`component-${k}.json`, 'utf8'));
const xml = await md2jcr(markdown, { models: read('models'), definition: read('definition'), filters: read('filters'), log: SILENT });
fs.writeFileSync(out, xml);
fs.writeFileSync(out.replace(/\.xml$/, '.md'), markdown);
console.log(`written ${out} (${xml.length} chars)`);
