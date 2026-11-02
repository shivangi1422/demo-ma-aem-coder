/* eslint-disable */
/* global WebImporter */

import productTilesParser from './parsers/product-tiles.js';
import cleanupTransformer from './transformers/beckman-cleanup.js';
import sectionsTransformer from './transformers/beckman-sections.js';

const PAGE_TEMPLATE = {
  "name": "software-category",
  "urls": [
    "https://www.mybeckman.in/flow-cytometry/software",
    "https://www.mybeckman.in/liquid-handlers/software"
  ],
  "representativeUrl": "https://www.mybeckman.in/flow-cytometry/software",
  "description": "Software category listing: title and intro, then a grey band of linked product tiles (image, title, description)",
  "urlPattern": "/*/software",
  "blocks": [
    {
      "name": "product-tiles",
      "instances": [
        ".product-series-selector-wrapper .product-series-callouts > .row",
        ".product-series-callouts > .row"
      ]
    }
  ],
  "sections": [
    {
      "id": "s1",
      "name": "Title and intro",
      "selector": [
        ".product-series-selector-wrapper > .product-content-wrap"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        ".product-heading-wrap > h1",
        ".product-heading-wrap > p",
        ".product-heading-wrap > ul"
      ]
    },
    {
      "id": "s2",
      "name": "Product tiles",
      "selector": [
        ".product-series-selector-wrapper .product-series-callouts"
      ],
      "style": "light-grey",
      "blocks": [
        "product-tiles"
      ],
      "defaultContent": []
    }
  ]
};

const parsers = {
  'product-tiles': productTilesParser,
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
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }];
  },
};
