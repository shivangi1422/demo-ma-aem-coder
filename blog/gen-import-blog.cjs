const fs = require('fs');
const pt = JSON.parse(fs.readFileSync('tools/importer/page-templates.json', 'utf8'));
const t = pt.templates.find((x) => x.name === 'blog');
const parsers = t.blocks.map((b) => b.name);
for (const p of parsers) if (!fs.existsSync(`tools/importer/parsers/${p}.js`)) { console.error('missing parser', p); process.exit(1); }
const camel = (s) => s.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
const transformers = fs.readdirSync('tools/importer/transformers').filter((f) => f.endsWith('.js')).sort();
const out = `/* eslint-disable */
/* global WebImporter */

${parsers.map((p) => `import ${camel(p)}Parser from './parsers/${p}.js';`).join('\n')}
${transformers.map((f) => `import ${camel(f.replace('.js', ''))}Transformer from './transformers/${f}';`).join('\n')}

const PAGE_TEMPLATE = ${JSON.stringify(t, null, 2)};

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
    if (Object.keys(meta).length) main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    const rawPath = new URL(params.originalURL).pathname
      .replace(/\\/$/, '')
      .replace(/\\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }];
  },
};
`;
fs.writeFileSync('tools/importer/import-blog.js', out);
console.log('written', parsers, transformers);
