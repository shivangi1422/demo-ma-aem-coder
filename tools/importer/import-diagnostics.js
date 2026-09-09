/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroBlogParser from './parsers/hero-blog.js';
import columnsTagsParser from './parsers/columns-tags.js';
import columnsAuthorParser from './parsers/columns-author.js';
import cardsBlogParser from './parsers/cards-blog.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/beckmancoulter-cleanup.js';
import sectionsTransformer from './transformers/beckmancoulter-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-blog': heroBlogParser,
  'columns-tags': columnsTagsParser,
  'columns-author': columnsAuthorParser,
  'cards-blog': cardsBlogParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'diagnostics',
  description: 'Beckman Coulter diagnostics blog article page',
  urls: [
    'https://www.beckmancoulter.com/en/blog/diagnostics/the-value-of-mpv-in-hematology',
  ],
  blocks: [
    {
      name: 'hero-blog',
      instances: ['#main-container > div.sublayout.ui.aligned.segment.grid:nth-of-type(1)'],
    },
    {
      name: 'columns-tags',
      instances: ['#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.ui.grid.container.blog-post-tag-list'],
    },
    {
      name: 'columns-author',
      instances: ['#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.contributor-detail.summary.sixteen.wide.column'],
    },
    {
      name: 'cards-blog',
      instances: ['#main-container > div.sublayout.ui.aligned.segment.grid.light-gray'],
    },
  ],
  sections: [
    { id: 'rc1', name: 'Article Header', selector: '#main-container > div.sublayout.ui.aligned.segment.grid:nth-of-type(1)', style: null, blocks: ['hero-blog'], defaultContent: [] },
    { id: 'rc2', name: 'Article Body', selector: '#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.lazyload.page-content.nested-padding.active', style: null, blocks: [], defaultContent: ['#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.lazyload.page-content.nested-padding.active'] },
    { id: 'rc3', name: 'References and Disclaimer', selector: '#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.disclaimer-text.lazyload.active', style: null, blocks: [], defaultContent: ['#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.disclaimer-text.lazyload.active'] },
    { id: 'rc4', name: 'Blog Tags', selector: '#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.ui.grid.container.blog-post-tag-list', style: null, blocks: ['columns-tags'], defaultContent: [] },
    { id: 'rc5', name: 'Author Bio', selector: '#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.contributor-detail.summary.sixteen.wide.column', style: null, blocks: ['columns-author'], defaultContent: [] },
    { id: 'rc6', name: 'Related Articles', selector: '#main-container > div.sublayout.ui.aligned.segment.grid.light-gray', style: 'light-gray', blocks: ['cards-blog'], defaultContent: [] },
  ],
};

// TRANSFORMER REGISTRY - cleanup first, then sections (only when 2+ sections)
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name, selector, element, section: blockDef.section || null,
        });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // 1. beforeTransform (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block (skip already-replaced elements)
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform (final cleanup + section breaks/metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized path
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
