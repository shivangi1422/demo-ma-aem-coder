/* eslint-disable */
/* global WebImporter */

import categoryCardsParser from './parsers/category-cards.js';
import cleanupTransformer from './transformers/beckman-cleanup.js';
import sectionsTransformer from './transformers/beckman-sections.js';

const PAGE_TEMPLATE = {
  "name": "software",
  "urls": [
    "https://www.mybeckman.in/software"
  ],
  "representativeUrl": "https://www.mybeckman.in/software",
  "description": "Software landing page: page title and text-only category cards linking to software detail pages (breadcrumbs are generated from the page path)",
  "urlPattern": "/*",
  "blocks": [
    {
      "name": "category-cards",
      "instances": [
        ".product-series-selector-wrapper .softwareContainer",
        ".softwareContainer"
      ]
    }
  ],
  "sections": [
    {
      "id": "rc3",
      "name": "Software categories",
      "selector": [
        "#main .main-holder > .container.product-series-selector-wrapper",
        ".product-series-selector-wrapper"
      ],
      "style": null,
      "blocks": [
        "category-cards"
      ],
      "defaultContent": [
        ".product-heading-wrap > h1"
      ]
    }
  ]
};

const parsers = {
  'category-cards': categoryCardsParser,
};
const transformers = [cleanupTransformer, sectionsTransformer];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((fn) => {
    try { fn(hookName, element, enhancedPayload); }
    catch (e) { console.error(`Transformer failed at ${hookName}:`, e); }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });
  return pageBlocks;
}

/** Page metadata from the document head, plus the breadcrumb labels captured by the cleanup transformer. */
function createMetadata(main, document) {
  const meta = WebImporter.Blocks.getMetadata(document) || {};
  const labels = document.documentElement.dataset.breadcrumbLabels;
  if (labels) meta['Breadcrumb Labels'] = labels;
  delete document.documentElement.dataset.breadcrumbLabels;
  if (Object.keys(meta).length) main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
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
      if (!parser) return;
      try { parser(block.element, { document, url, params }); }
      catch (e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); }
    });

    executeTransformers('afterTransform', main, payload);

    main.appendChild(document.createElement('hr'));
    createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    // migrated pages live under the "sai" site root (with its own nav and footer)
    const path = WebImporter.FileUtils.sanitizePath(`/sai${rawPath === '' ? '/index' : rawPath}`);

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }];
  },
};
