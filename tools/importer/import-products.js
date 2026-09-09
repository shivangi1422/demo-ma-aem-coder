/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroParser from './parsers/hero.js';
import cardsGridParser from './parsers/cards-grid.js';
import columnsParser from './parsers/columns.js';
import contentReversedParser from './parsers/content-reversed.js';
import carouselParser from './parsers/carousel.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/beckmancoulter-cleanup.js';
import sectionsTransformer from './transformers/beckmancoulter-sections.js';

// PARSER REGISTRY
const parsers = {
  hero: heroParser,
  'cards-grid': cardsGridParser,
  columns: columnsParser,
  'content-reversed': contentReversedParser,
  carousel: carouselParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'products',
  description: 'Beckman Coulter product overview page (immunoassay)',
  urls: ['https://www.beckmancoulter.com/en/products/immunoassay'],
  blocks: [
    { name: 'hero', instances: ['#main-container > div.sublayout.ui.aligned.segment.grid > div.lazyload.fade.video-hero-carousel.ui.container.active'] },
    { name: 'cards-grid', instances: ['#main-container > div.sublayout.ui.three.column.stackable.equal.height.grid.container.col-3-default-padding:nth-of-type(3)', '#main-container > div.sublayout.ui.one.column.stackable.grid.container:nth-of-type(4) > div.product-list.lazyload.active'] },
    { name: 'columns', instances: ['#main-container > div.sublayout.ui.three.column.stackable.equal.height.grid.container.col-3-default-padding:nth-of-type(5)', '#main-container > div.sublayout.ui.one.column.stackable.grid.container:nth-of-type(6) > div.double-showcase-feature'] },
    { name: 'content-reversed', instances: ['#main-container > div.sublayout.ui.one.column.stackable.grid.container:nth-of-type(6) > div.social-proof-section'] },
    { name: 'carousel', instances: ['#main-container > div.sublayout.ui.one.column.stackable.grid.container:nth-of-type(6) > div.lazyload.page-content.education-filter-carousel.active'] },
  ],
  sections: new Array(11).fill(0).map((_, i) => ({ id: String(i + 1) })),
};

// TRANSFORMER REGISTRY - cleanup first, then sections (only when 2+ sections)
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

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

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    executeTransformers('beforeTransform', main, payload);

    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
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

    executeTransformers('afterTransform', main, payload);

    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

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
