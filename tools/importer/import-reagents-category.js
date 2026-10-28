/* eslint-disable */
/* global WebImporter */

import cardsGridParser from './parsers/cards-grid.js';
import beckmanCleanupTransformer from './transformers/beckman-cleanup.js';
import beckmanSectionsTransformer from './transformers/beckman-sections.js';

const PAGE_TEMPLATE = {
  "name": "reagents-category",
  "description": "mybeckman.in reagent category pages: intro (heading + copy), light-grey band of linked product cards, optional disclaimer notes",
  "urls": [
    "https://www.mybeckman.in/reagents/particle"
  ],
  "blocks": [
    {
      "name": "cards-grid",
      "instances": [
        ".product-series-selector-wrapper .product-series-callouts"
      ]
    }
  ],
  "sections": [
    {
      "id": "intro",
      "name": "Intro",
      "selector": [
        ".product-series-selector-wrapper > .product-content-wrap"
      ],
      "style": "intro",
      "blocks": [],
      "defaultContent": [
        ".product-heading-wrap"
      ]
    },
    {
      "id": "cards",
      "name": "Product cards",
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
      "id": "disclaimer",
      "name": "Disclaimer",
      "selector": [
        ".product-series-selector-wrapper > div > .bc-rich-text:has(h5, p)"
      ],
      "style": "disclaimer",
      "insets": true,
      "blocks": [],
      "defaultContent": [
        ".bc-rich-text"
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

// "breadcrumb-title" page metadata from the live breadcrumb label (set by beckman-cleanup)
function addBreadcrumbTitle(main, document) {
  const label = main.getAttribute('data-excat-breadcrumb-title');
  main.removeAttribute('data-excat-breadcrumb-title');
  const table = [...main.querySelectorAll('table')]
    .find((t) => t.querySelector('th, td')?.textContent.trim().toLowerCase() === 'metadata');
  if (!label || !table) return;
  const tr = document.createElement('tr');
  ['breadcrumb-title', label].forEach((text) => {
    const td = document.createElement('td');
    td.textContent = text;
    tr.append(td);
  });
  (table.querySelector('tbody') || table).append(tr);
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
    addBreadcrumbTitle(main, document);
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
