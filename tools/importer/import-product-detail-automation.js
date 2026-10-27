/* eslint-disable */
/* global WebImporter */

import carouselGalleryParser from './parsers/carousel-gallery.js';
import cardsGridFeaturesPurpleParser from './parsers/cards-grid-features-purple.js';
import embedParser from './parsers/embed.js';
import tabsUnderlineParser from './parsers/tabs-underline.js';
import quoteTestimonialPurpleParser from './parsers/quote-testimonial-purple.js';
import columnsParser from './parsers/columns.js';
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
  "name": "product-detail-automation",
  "urls": [
    "https://www.beckmancoulter.com/en/products/automation/workflow-automation-system-dxa-5000-fit"
  ],
  "representativeUrl": "https://www.beckmancoulter.com/en/products/automation/workflow-automation-system-dxa-5000-fit",
  "description": "Automation product detail pages: media-gallery product hero, image-panel feature, purple feature band, interactive embed, product tabs, purple testimonial, text/image rows, related products slider, footnotes.",
  "blocks": [
    {
      "name": "carousel-gallery",
      "instances": [
        "#main-container > div.sublayout-two-column-dynamic"
      ]
    },
    {
      "name": "cards-grid-features-purple",
      "instances": [
        "div.data-visualization-container"
      ]
    },
    {
      "name": "embed",
      "instances": [
        "iframe[src*=\"genial.ly\"]",
        "iframe[src*=\"genially\"]"
      ]
    },
    {
      "name": "tabs-underline",
      "instances": [
        "div.product-tabs"
      ]
    },
    {
      "name": "quote-testimonial-purple",
      "instances": [
        "div.testimonial-slim"
      ]
    },
    {
      "name": "columns",
      "instances": [
        "div.adjustable-two-column-display"
      ]
    },
    {
      "name": "carousel-products",
      "instances": [
        "div.related-products:has(h3)"
      ]
    }
  ],
  "urlPattern": "/en/products/automation/*",
  "sections": [
    {
      "id": "hero",
      "name": "The DxA 5000 Fit Workflow Automation System",
      "selector": [
        "#main-container > div.sublayout-two-column-dynamic"
      ],
      "style": null,
      "blocks": [
        "carousel-gallery"
      ],
      "defaultContent": []
    },
    {
      "id": "focus",
      "name": "Focus on what matters",
      "selector": [
        "div.photo-feature"
      ],
      "style": "image-panel",
      "blocks": [],
      "defaultContent": [
        "h2",
        "p",
        "a"
      ]
    },
    {
      "id": "automation-for-all",
      "name": "Automation for All",
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
      "id": "explore-features",
      "name": "Explore DxA 5000 Fit Features",
      "selector": [
        "div.page-content:has(iframe)"
      ],
      "style": "centered",
      "blocks": [
        "embed"
      ],
      "defaultContent": [
        "h2",
        "p"
      ]
    },
    {
      "id": "product-tabs",
      "name": "Endless Benefits",
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
      "id": "testimonial",
      "name": "From its compact footprint",
      "selector": [
        "div.testimonial-slim"
      ],
      "style": null,
      "blocks": [
        "quote-testimonial-purple"
      ],
      "defaultContent": []
    },
    {
      "id": "webinars",
      "name": "Watch our latest automation webinars",
      "selector": [
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.adjustable-two-column-display"
      ],
      "style": null,
      "blocks": [
        "columns"
      ],
      "defaultContent": []
    },
    {
      "id": "routing",
      "name": "Intelligent routing in a compact footprint",
      "selector": [
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.adjustable-two-column-display"
      ],
      "style": null,
      "blocks": [
        "columns"
      ],
      "defaultContent": []
    },
    {
      "id": "demo",
      "name": "Watch the DxA 5000 Fit Demo",
      "selector": [
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.adjustable-two-column-display"
      ],
      "style": null,
      "blocks": [
        "columns"
      ],
      "defaultContent": []
    },
    {
      "id": "related-heading",
      "name": "Related Solutions",
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
      "name": "Hematology",
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
  'carousel-gallery': carouselGalleryParser,
  'cards-grid-features-purple': cardsGridFeaturesPurpleParser,
  embed: embedParser,
  'tabs-underline': tabsUnderlineParser,
  'quote-testimonial-purple': quoteTestimonialPurpleParser,
  columns: columnsParser,
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
