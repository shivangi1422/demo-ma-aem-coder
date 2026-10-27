/* eslint-disable */
/* global WebImporter */

import heroSplitLeftParser from './parsers/hero-split-left.js';
import tabsUnderlineParser from './parsers/tabs-underline.js';
import cardsMediaListParser from './parsers/cards-media-list.js';
import cardsGridShowcaseParser from './parsers/cards-grid-showcase.js';
import quoteTestimonialParser from './parsers/quote-testimonial.js';
import carouselProductsParser from './parsers/carousel-products.js';
import cleanupTransformer from './transformers/beckmancoulter-cleanup.js';
import sectionsTransformer from './transformers/beckmancoulter-sections.js';
import solutionsCleanupTransformer from './transformers/beckmancoulter-solutions-cleanup.js';
import solutionsSectionsTransformer from './transformers/beckmancoulter-solutions-sections.js';
import dxsCleanupTransformer from './transformers/beckmancoulter-dxs-cleanup.js';
import dxsSectionsTransformer from './transformers/beckmancoulter-dxs-sections.js';
import productCleanupTransformer from './transformers/beckmancoulter-product-cleanup.js';
import productSectionsTransformer from './transformers/beckmancoulter-product-sections.js';

const PAGE_TEMPLATE = {
  "name": "product-detail-informatics",
  "urls": [
    "https://www.beckmancoulter.com/en/products/advanced-informatics/remisol-advance"
  ],
  "representativeUrl": "https://www.beckmancoulter.com/en/products/advanced-informatics/remisol-advance",
  "description": "Advanced Informatics product detail pages: split product hero, tabbed product details, media rows (video/brochure), resources showcase over background, testimonial, related products slider, footnotes.",
  "blocks": [
    {
      "name": "hero-split-left",
      "instances": [
        "div.sublayout-two-column-dynamic"
      ]
    },
    {
      "name": "tabs-underline",
      "instances": [
        "div.product-tabs"
      ]
    },
    {
      "name": "cards-media-list",
      "instances": [
        "div.media-showcase-simple"
      ]
    },
    {
      "name": "cards-grid-showcase",
      "instances": [
        "div.double-showcase-feature",
        "div.tripple-showcase-feature"
      ]
    },
    {
      "name": "quote-testimonial",
      "instances": [
        "div.testimonial:not(.testimonial-slim)"
      ]
    },
    {
      "name": "carousel-products",
      "instances": [
        "div.related-products:has(h3)"
      ]
    }
  ],
  "urlPattern": "/en/products/advanced-informatics/*",
  "sections": [
    {
      "id": "hero",
      "name": "REMISOL Advance",
      "selector": [
        "div.sublayout-two-column-dynamic"
      ],
      "style": null,
      "blocks": [
        "hero-split-left"
      ],
      "defaultContent": []
    },
    {
      "id": "overview",
      "name": "Overview",
      "selector": [
        "div.product-tabs"
      ],
      "style": "highlight",
      "blocks": [
        "tabs-underline"
      ],
      "defaultContent": []
    },
    {
      "id": "video-showcase",
      "name": "Video",
      "selector": [
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.media-showcase-simple"
      ],
      "style": null,
      "blocks": [
        "cards-media-list"
      ],
      "defaultContent": []
    },
    {
      "id": "brochure-showcase",
      "name": "Brochure",
      "selector": [
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.media-showcase-simple"
      ],
      "style": null,
      "blocks": [
        "cards-media-list"
      ],
      "defaultContent": []
    },
    {
      "id": "resources",
      "name": "REMISOL Advance Resources",
      "selector": [
        "div.double-showcase-feature"
      ],
      "style": null,
      "blocks": [
        "cards-grid-showcase"
      ],
      "defaultContent": []
    },
    {
      "id": "testimonial",
      "name": "Because of our entire solution",
      "selector": [
        "div.testimonial:not(.testimonial-slim)"
      ],
      "style": null,
      "blocks": [
        "quote-testimonial"
      ],
      "defaultContent": []
    },
    {
      "id": "related-heading",
      "name": "Additional Advanced Informatics tools",
      "selector": [
        "div.related-products:has(h2)"
      ],
      "style": "centered",
      "blocks": [],
      "defaultContent": [
        "h2"
      ]
    },
    {
      "id": "related-products",
      "name": "Remote Services",
      "selector": [
        "div.related-products:has(h3)"
      ],
      "style": null,
      "blocks": [
        "carousel-products"
      ],
      "defaultContent": []
    },
    {
      "id": "disclaimer",
      "name": "REMISOL Advance is a trademark",
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
  'hero-split-left': heroSplitLeftParser,
  'tabs-underline': tabsUnderlineParser,
  'cards-media-list': cardsMediaListParser,
  'cards-grid-showcase': cardsGridShowcaseParser,
  'quote-testimonial': quoteTestimonialParser,
  'carousel-products': carouselProductsParser,
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
