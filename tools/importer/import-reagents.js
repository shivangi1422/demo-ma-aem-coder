/* eslint-disable */
/* global WebImporter */

import cardsGridParser from './parsers/cards-grid.js';
import beckmanCleanupTransformer from './transformers/beckman-cleanup.js';
import beckmanSectionsTransformer from './transformers/beckman-sections.js';

const PAGE_TEMPLATE = {
  "name": "reagents",
  "urls": [
    "https://www.mybeckman.in/reagents",
    "https://www.mybeckman.in/reagents/cell-culture",
    "https://www.mybeckman.in/reagents/centrifugation",
    "https://www.mybeckman.in/reagents/coulter-flow-cytometry",
    "https://www.mybeckman.in/reagents/genomic",
    "https://www.mybeckman.in/reagents/particle"
  ],
  "representativeUrl": "https://www.mybeckman.in/reagents",
  "description": "Reagents landing and reagent category pages: intro, grid of linked product/category cards, disclaimer notes",
  "blocks": [
    {
      "name": "cards-grid",
      "instances": [
        ".product-series-selector-wrapper .product-series-callouts"
      ]
    }
  ],
  "urlPattern": "/*",
  "sections": [
    {
      "id": "section-1",
      "name": "Page intro",
      "selector": [
        ".product-series-selector-wrapper > .product-content-wrap"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        ".product-content-wrap .product-heading-wrap"
      ]
    },
    {
      "id": "section-2",
      "name": "Reagent category cards",
      "selector": [
        ".product-series-selector-wrapper .product-series-callouts"
      ],
      "style": "light-grey",
      "blocks": [
        "cards-grid"
      ],
      "defaultContent": []
    },
    {
      "id": "section-3",
      "name": "Disclaimer",
      "selector": [
        ".product-series-selector-wrapper > div > .bc-rich-text"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        ".product-series-selector-wrapper > div > .bc-rich-text"
      ]
    }
  ]
};

const parsers = { 'cards-grid': cardsGridParser };
const transformers = [beckmanCleanupTransformer, beckmanSectionsTransformer];

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
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }];
  },
};
