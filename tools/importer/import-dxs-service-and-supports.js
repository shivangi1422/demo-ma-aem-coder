/* eslint-disable */
/* global WebImporter */

import heroSplitLeftParser from './parsers/hero-split-left.js';
import cardsGridFeaturesPurpleParser from './parsers/cards-grid-features-purple.js';
import columnsVideoParser from './parsers/columns-video.js';
import contentReversedParser from './parsers/content-reversed.js';
import carouselResourcesParser from './parsers/carousel-resources.js';
import quoteBannerParser from './parsers/quote-banner.js';
import cardsGridSolutionsParser from './parsers/cards-grid-solutions.js';
import cleanupTransformer from './transformers/beckmancoulter-cleanup.js';
import sectionsTransformer from './transformers/beckmancoulter-sections.js';
import solutionsCleanupTransformer from './transformers/beckmancoulter-solutions-cleanup.js';
import solutionsSectionsTransformer from './transformers/beckmancoulter-solutions-sections.js';
import dxsCleanupTransformer from './transformers/beckmancoulter-dxs-cleanup.js';
import dxsSectionsTransformer from './transformers/beckmancoulter-dxs-sections.js';
import productCleanupTransformer from './transformers/beckmancoulter-product-cleanup.js';
import productSectionsTransformer from './transformers/beckmancoulter-product-sections.js';

const PAGE_TEMPLATE = {
  "name": "dxs-service-and-supports",
  "urls": [
    "https://www.beckmancoulter.com/en/products/dxs-service-and-supports/remote-services-and-diagnostics"
  ],
  "representativeUrl": "https://www.beckmancoulter.com/en/products/dxs-service-and-supports/remote-services-and-diagnostics",
  "description": "DxS service & support product pages: split hero, purple key-benefits band, video and image feature rows, resources carousel, dark quote banner, solution cards, centered contact CTA and disclaimer.",
  "blocks": [
    {
      "name": "hero-split-left",
      "instances": [
        "div.sublayout-two-column-dynamic"
      ]
    },
    {
      "name": "cards-grid-features-purple",
      "instances": [
        "div.data-visualization-container"
      ]
    },
    {
      "name": "columns-video",
      "instances": [
        "div.social-proof-section"
      ]
    },
    {
      "name": "content-reversed",
      "instances": [
        "div.adjustable-two-column-display"
      ]
    },
    {
      "name": "carousel-resources",
      "instances": [
        "div.education-filter-carousel"
      ]
    },
    {
      "name": "quote-banner",
      "instances": [
        "div.testimonial-slim"
      ]
    },
    {
      "name": "cards-grid-solutions",
      "instances": [
        "div.col-3-default-padding:not(:has([class*=\"vidyard\"]))"
      ]
    }
  ],
  "urlPattern": "/en/products/dxs-service-and-supports/*",
  "sections": [
    {
      "id": "hero",
      "name": "Remote Services and Diagnostics",
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
      "id": "key-benefits",
      "name": "Key Benefits of Remote Desktop Sharing",
      "selector": [
        "div.data-visualization-container"
      ],
      "style": null,
      "blocks": [
        "cards-grid-features-purple"
      ],
      "defaultContent": []
    },
    {
      "id": "intelliserve",
      "name": "DxS IntelliServe",
      "selector": [
        "div.social-proof-section"
      ],
      "style": null,
      "blocks": [
        "columns-video"
      ],
      "defaultContent": []
    },
    {
      "id": "proservice",
      "name": "DxS PROService",
      "selector": [
        "div.adjustable-two-column-display"
      ],
      "style": null,
      "blocks": [
        "content-reversed"
      ],
      "defaultContent": []
    },
    {
      "id": "resources",
      "name": "Educational Resources",
      "selector": [
        "div.education-filter-carousel"
      ],
      "style": null,
      "blocks": [
        "carousel-resources"
      ],
      "defaultContent": [
        "h2"
      ]
    },
    {
      "id": "tagline",
      "name": "Increase uptime and improve productivity with remote connectivity",
      "selector": [
        "div.testimonial-slim"
      ],
      "style": null,
      "blocks": [
        "quote-banner"
      ],
      "defaultContent": []
    },
    {
      "id": "solutions",
      "name": "Solutions designed for your laboratory needs",
      "selector": [
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.page-content"
      ],
      "style": "centered",
      "blocks": [
        "cards-grid-solutions"
      ],
      "defaultContent": [
        "h2"
      ]
    },
    {
      "id": "contact-cta",
      "name": "Speak to a Representative about Remote Connectivity",
      "selector": [
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.page-content"
      ],
      "style": "centered",
      "blocks": [],
      "defaultContent": [
        "h2",
        "a.button"
      ]
    },
    {
      "id": "disclaimer",
      "name": "This product may not be available",
      "selector": [
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.page-content"
      ],
      "style": "divider, centered",
      "blocks": [],
      "defaultContent": [
        "p"
      ]
    }
  ]
};

const parsers = {
  'hero-split-left': heroSplitLeftParser,
  'cards-grid-features-purple': cardsGridFeaturesPurpleParser,
  'columns-video': columnsVideoParser,
  'content-reversed': contentReversedParser,
  'carousel-resources': carouselResourcesParser,
  'quote-banner': quoteBannerParser,
  'cards-grid-solutions': cardsGridSolutionsParser,
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
