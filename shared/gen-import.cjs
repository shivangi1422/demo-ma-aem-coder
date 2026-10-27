const fs = require('fs');
const pt = JSON.parse(fs.readFileSync('tools/importer/page-templates.json', 'utf8'));
const NAME = process.argv[2];
if (!NAME) { console.error('usage: node gen-import.cjs <templateName>'); process.exit(1); }
const t = pt.templates.find((x) => x.name === NAME);
if (!t) { console.error('template not found', NAME); process.exit(1); }
// Link rules: pages already migrated (content dir) + pages in this run become site-relative links.
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${d}/${e.name}`) : [`${d}/${e.name}`]));
// Optional per-template settings for other sites:
//   siteOrigin: live site origin (default beckmancoulter.com)
//   pathMap: { '/live/path': '/our/path' }   (page lands at our path; links to it become relative)
//   metaOverrides: { '/live/path': { description, image } }
const SITE_ORIGIN = t.siteOrigin || 'https://www.beckmancoulter.com';
const PATH_MAP = t.pathMap || {};
const sameSiteAsContent = SITE_ORIGIN === 'https://www.beckmancoulter.com';
const migratedPaths = new Set(sameSiteAsContent
  ? walk('content').filter((f) => f.endsWith('.plain.html')).map((f) => f.slice('content'.length).replace('.plain.html', '')).filter((p) => !p.startsWith('/library'))
  : []);
t.urls.forEach((u) => { const lp = new URL(u).pathname.replace(/\/$/, ''); if (!PATH_MAP[lp]) migratedPaths.add(lp); });
const overridesFile = 'tools/importer/link-overrides.json';
t.linkRules = {
  siteOrigin: SITE_ORIGIN,
  migratedPaths: [...migratedPaths].sort(),
  pathMap: PATH_MAP,
  hrefOverrides: t.hrefOverrides || [],
  anchorOverrides: fs.existsSync(overridesFile) ? JSON.parse(fs.readFileSync(overridesFile, 'utf8')) : {},
};
// Optional image map: original image URL (origin + path, no query) -> clean local path.
const imageMapFile = 'tools/importer/image-map.json';
const IMAGE_MAP = fs.existsSync(imageMapFile) ? JSON.parse(fs.readFileSync(imageMapFile, 'utf8')) : {};
const parsers = t.blocks.map((b) => b.name);
for (const p of parsers) if (!fs.existsSync(`tools/importer/parsers/${p}.js`)) { console.error('missing parser', p); process.exit(1); }
const camel = (s) => s.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
const transformers = fs.readdirSync('tools/importer/transformers').filter((f) => f.endsWith('.js')).sort();
const out = `/* eslint-disable */
/* global WebImporter */

${parsers.map((p) => `import ${camel(p)}Parser from './parsers/${p}.js';`).join('\n')}
${transformers.map((f) => `import ${camel(f.replace('.js', ''))}Transformer from './transformers/${f}';`).join('\n')}

const PAGE_TEMPLATE = ${JSON.stringify(t, null, 2)};

// Clean asset paths for images (empty unless an image map was provided).
const IMAGE_MAP = ${JSON.stringify(IMAGE_MAP, null, 2)};

const parsers = {
${parsers.map((p) => `  '${p}': ${camel(p)}Parser,`).join('\n')}
};

const transformers = [
${transformers.map((f) => `  ${camel(f.replace('.js', ''))}Transformer,`).join('\n')}
];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((fn) => {
    try { fn(hookName, element, enhancedPayload); } catch (e) { console.error(\`Transformer failed at \${hookName}:\`, e); }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const seen = new Set();
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        if (seen.has(element)) return;
        seen.add(element);
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // Blog tags become page keywords (read before cleanup/parsing changes the DOM).
    const tags = [...document.querySelectorAll('.blog-post-tag-list a')]
      .map((a) => a.textContent.trim()).filter((tag) => tag && !/^share$/i.test(tag));

    executeTransformers('beforeTransform', main, payload);

    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (!parser) return;
      try { parser(block.element, { document, url, params }); } catch (e) { console.error(\`Failed to parse \${block.name} (\${block.selector}):\`, e); }
    });

    executeTransformers('afterTransform', main, payload);

    main.appendChild(document.createElement('hr'));
    const meta = WebImporter.Blocks.getMetadata(document);
    if (tags.length) meta.keywords = [...new Set(tags)].join(', ');
    const livePath = new URL(params.originalURL).pathname.replace(/\\/$/, '');
    const metaOverride = (PAGE_TEMPLATE.metaOverrides || {})[livePath] || {};
    if (metaOverride.title) meta.Title = metaOverride.title;
    if (metaOverride.description) meta.Description = metaOverride.description;
    if (metaOverride.image) { const img = document.createElement('img'); img.src = metaOverride.image; meta.Image = img; }
    if (Object.keys(meta).length) main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
    // Must run after adjustImageUrls, which re-absolutizes src to the source origin.
    const pageImages = IMAGE_MAP[new URL(params.originalURL).pathname.replace(/\\/$/, '')] || {};
    main.querySelectorAll('img[src]').forEach((img) => {
      try {
        const u = new URL(img.getAttribute('src'));
        const local = pageImages[u.origin + u.pathname];
        if (local) img.setAttribute('src', local);
      } catch (e) { /* keep src */ }
    });

    const rawPath = new URL(params.originalURL).pathname
      .replace(/\\/$/, '')
      .replace(/\\.html?$/, '');
    const mappedPath = (PAGE_TEMPLATE.pathMap || {})[rawPath] || rawPath;
    const path = WebImporter.FileUtils.sanitizePath(mappedPath === '' ? '/index' : mappedPath);

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }];
  },
};
`;
fs.writeFileSync(`tools/importer/import-${NAME}.js`, out);
console.log('migratedPaths', t.linkRules.migratedPaths.length, 'anchorOverrides', Object.keys(t.linkRules.anchorOverrides).length);
console.log('written', parsers, transformers);
