/* eslint-disable */
/* global WebImporter */

import cardsBenefitsParser from './parsers/cards-benefits.js';
import cardsGridProductsParser from './parsers/cards-grid-products.js';
import columnsParser from './parsers/columns.js';
import columnsCtaParser from './parsers/columns-cta.js';
import cleanupTransformer from './transformers/mybeckman-cleanup.js';
import sectionsTransformer from './transformers/mybeckman-sections.js';

const PAGE_TEMPLATE = {
  "name": "service-plans",
  "urls": [
    "https://www.mybeckman.in/service/plans"
  ],
  "representativeUrl": "https://www.mybeckman.in/service/plans",
  "description": "Service Plans landing page: breadcrumb, text intro with CTA, blue benefits band, product plan cards, team columns, additional-services columns (video, training) and blue Get in Touch band",
  "urlPattern": "/service/plans",
  "blocks": [
    {
      "name": "cards-benefits",
      "instances": [
        ".Section--blue .Intro",
        ".Intro"
      ]
    },
    {
      "name": "cards-grid-products",
      "instances": [
        ".Section .productCards",
        ".productCards"
      ]
    },
    {
      "name": "columns",
      "instances": [
        ".Section > .Section__two-column"
      ]
    },
    {
      "name": "columns-cta",
      "instances": [
        "#getInTouch .Contact__body",
        ".Contact .Contact__body"
      ]
    }
  ],
  "sections": [
    {
      "id": "section-1",
      "name": "Page header",
      "selector": [
        ".bc-rich-text:has(> .Section__header)",
        ".Section__header"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        ".Section__header > h1",
        ".Section__header > h2",
        ".Section__header .callout > p",
        ".Section__header .callout > a"
      ]
    },
    {
      "id": "section-2",
      "name": "Why choose a service plan",
      "selector": [
        ".bc-rich-text:has(.Section--blue .Intro)",
        ".Section--blue:has(.Intro)"
      ],
      "style": "blue",
      "blocks": [
        "cards-benefits"
      ],
      "defaultContent": []
    },
    {
      "id": "section-3",
      "name": "Product Specific Service Plans",
      "selector": [
        ".bc-rich-text:has(.productCards)"
      ],
      "style": null,
      "blocks": [
        "cards-grid-products"
      ],
      "defaultContent": [
        ".Section:has(> .productCards) > h2"
      ]
    },
    {
      "id": "section-4",
      "name": "Count on our team of experts",
      "selector": [
        ".bc-rich-text:has(> .Section > h2 + p + .Section__two-column)"
      ],
      "style": null,
      "blocks": [
        "columns"
      ],
      "defaultContent": [
        ".Section:has(> .Section__two-column) > h2",
        ".Section:has(> .Section__two-column) > p"
      ]
    },
    {
      "id": "section-5",
      "name": "Additional services",
      "selector": [
        ".bc-rich-text:has(.wistia_embed)",
        ".bc-rich-text:has(.wistia_responsive_padding)"
      ],
      "style": null,
      "blocks": [
        "columns"
      ],
      "defaultContent": []
    },
    {
      "id": "section-6",
      "name": "Training",
      "selector": [
        ".bc-rich-text:has(> .Section > .Section__two-column:first-child > .Section__two-column-left > img)"
      ],
      "style": null,
      "blocks": [
        "columns"
      ],
      "defaultContent": []
    },
    {
      "id": "section-7",
      "name": "Get in Touch",
      "selector": [
        "#getInTouch",
        ".Section--blue:has(.Contact)"
      ],
      "style": "blue, centered",
      "blocks": [
        "columns-cta"
      ],
      "defaultContent": [
        "#getInTouch .Contact > h2",
        "#getInTouch .Contact > p"
      ]
    }
  ]
};

const parsers = {
  'cards-benefits': cardsBenefitsParser,
  'cards-grid-products': cardsGridProductsParser,
  'columns': columnsParser,
  'columns-cta': columnsCtaParser,
};

const transformers = [cleanupTransformer, sectionsTransformer];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((fn) => {
    try { fn(hookName, element, enhancedPayload); } catch (e) { console.error(`Transformer failed at ${hookName}:`, e); }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const seen = new Set();
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        if (seen.has(element)) return;
        seen.add(element);
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
      try { parser(block.element, { document, url, params }); } catch (e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); }
    });

    executeTransformers('afterTransform', main, payload);

    main.appendChild(document.createElement('hr'));
    // page metadata from the head, plus the flag that turns on the URL-based breadcrumb
    const meta = WebImporter.Blocks.getMetadata(document);
    meta.breadcrumbs = 'true';
    meta.template = 'service-plans';
    main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
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
