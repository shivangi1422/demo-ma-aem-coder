/* eslint-disable */
/* global WebImporter */

import cardsMediaListParser from './parsers/cards-media-list.js';
import cardsGridProductsParser from './parsers/cards-grid-products.js';
import cardsGridPhotoParser from './parsers/cards-grid-photo.js';
import heroPromoParser from './parsers/hero-promo.js';
import cleanupTransformer from './transformers/beckmancoulter-cleanup.js';
import sectionsTransformer from './transformers/beckmancoulter-sections.js';
import solutionsCleanupTransformer from './transformers/beckmancoulter-solutions-cleanup.js';
import solutionsSectionsTransformer from './transformers/beckmancoulter-solutions-sections.js';
import dxsCleanupTransformer from './transformers/beckmancoulter-dxs-cleanup.js';
import dxsSectionsTransformer from './transformers/beckmancoulter-dxs-sections.js';
import productCleanupTransformer from './transformers/beckmancoulter-product-cleanup.js';
import productSectionsTransformer from './transformers/beckmancoulter-product-sections.js';

const PAGE_TEMPLATE = {
  "name": "product-category",
  "urls": [
    "https://www.beckmancoulter.com/en/products/advanced-informatics"
  ],
  "representativeUrl": "https://www.beckmancoulter.com/en/products/advanced-informatics",
  "description": "Product category landing pages: intro copy, article/video media rows, grey product portfolio grid, centered intro, photo cards to related disciplines, promo banner, footnotes.",
  "blocks": [
    {
      "name": "cards-media-list",
      "instances": [
        "div.media-showcase-simple"
      ]
    },
    {
      "name": "cards-grid-products",
      "instances": [
        "div.product-list"
      ]
    },
    {
      "name": "cards-grid-photo",
      "instances": [
        "div.col-3-default-padding"
      ]
    },
    {
      "name": "hero-promo",
      "instances": [
        "div.photo-hero-promotional-banner"
      ]
    }
  ],
  "urlPattern": "/en/products/*",
  "sections": [
    {
      "id": "intro",
      "name": "Advanced Informatics Solutions",
      "selector": [
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.intro-content"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        "h1",
        "h2",
        "div",
        "ul"
      ]
    },
    {
      "id": "article",
      "name": "Article",
      "selector": [
        "div.media-showcase-simple"
      ],
      "style": null,
      "blocks": [
        "cards-media-list"
      ],
      "defaultContent": []
    },
    {
      "id": "video",
      "name": "Video",
      "selector": [
        "div.media-showcase-simple"
      ],
      "style": null,
      "blocks": [
        "cards-media-list"
      ],
      "defaultContent": []
    },
    {
      "id": "portfolio",
      "name": "Full Portfolio of Advanced Informatics Solutions",
      "selector": [
        "#main-container > div.sublayout.ui.aligned.segment.grid:has(div.product-list)"
      ],
      "style": "highlight",
      "blocks": [
        "cards-grid-products"
      ],
      "defaultContent": [
        "h2"
      ]
    },
    {
      "id": "tools",
      "name": "Clinical Informatics Tools Enhance Diagnostics Solutions",
      "selector": [
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.intro-content"
      ],
      "style": "centered",
      "blocks": [],
      "defaultContent": [
        "h2",
        "div"
      ]
    },
    {
      "id": "disciplines",
      "name": "Hematology",
      "selector": [
        "div.col-3-default-padding"
      ],
      "style": null,
      "blocks": [
        "cards-grid-photo"
      ],
      "defaultContent": []
    },
    {
      "id": "promo",
      "name": "Articles and Stories",
      "selector": [
        "div.photo-hero-promotional-banner"
      ],
      "style": null,
      "blocks": [
        "hero-promo"
      ],
      "defaultContent": []
    },
    {
      "id": "disclaimer",
      "name": "Not available in all regions",
      "selector": [
        "div.disclaimer-text"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        "p"
      ]
    }
  ]
};

const parsers = {
  'cards-media-list': cardsMediaListParser,
  'cards-grid-products': cardsGridProductsParser,
  'cards-grid-photo': cardsGridPhotoParser,
  'hero-promo': heroPromoParser,
};

// every template's transformers are registered; each guards on PAGE_TEMPLATE.name.
// cleanup must run before sections within each template.
const transformers = [cleanupTransformer, sectionsTransformer, solutionsCleanupTransformer, solutionsSectionsTransformer, dxsCleanupTransformer, dxsSectionsTransformer, productCleanupTransformer, productSectionsTransformer];

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
  // live page, before html2md copies the DOM (computed styles still available)
  onLoad: ({ document }) => {
    executeTransformers('onLoad', document.body, { document });
  },

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
