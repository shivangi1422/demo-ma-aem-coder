/* eslint-disable */
/* global WebImporter */

import breadcrumbParser from './parsers/breadcrumb.js';
import columnsProductIntroParser from './parsers/columns-product-intro.js';
import columnsAnchorNavParser from './parsers/columns-anchor-nav.js';
import cardsIconParser from './parsers/cards-icon.js';
import cardsTileParser from './parsers/cards-tile.js';
import cardsResourceParser from './parsers/cards-resource.js';
import accordionFaqParser from './parsers/accordion-faq.js';
import mybeckmanLinksTransformer from './transformers/mybeckman-links.js';
import beckmanProductPrepareTransformer from './transformers/beckman-product-prepare.js';
import mybeckmanCleanupTransformer from './transformers/mybeckman-cleanup.js';
import mybeckmanSectionsTransformer from './transformers/mybeckman-sections.js';

const PAGE_TEMPLATE = {
  "name": "product-detail",
  "pageTemplate": "product-detail",
  "urls": [
    "https://www.beckman.com/air-particle-counters/met-one-6000"
  ],
  "representativeUrl": "https://www.beckman.com/air-particle-counters/met-one-6000",
  "description": "Product details page (beckman.com instrument page)",
  "blocks": [
    {
      "name": "breadcrumb",
      "instances": [
        "nav.breadcrumbs"
      ]
    },
    {
      "name": "columns-product-intro",
      "instances": [
        ".product-spotlight-wrapper > .product-intro-wrapper",
        ".product-intro-wrapper"
      ]
    },
    {
      "name": "columns-anchor-nav",
      "instances": [
        "#intrenal-page-link-wrapper"
      ]
    },
    {
      "name": "cards-icon",
      "instances": [
        "#features-wrapper > div.bc-columns.row"
      ]
    },
    {
      "name": "cards-tile",
      "instances": [
        ".spotlight-content-wrapper .download-res"
      ]
    },
    {
      "name": "cards-resource",
      "instances": [
        "#product-documentation-wrapper .content-resource-list-wrapper"
      ]
    },
    {
      "name": "accordion-faq",
      "instances": [
        ".bcls-aeo-faqs"
      ]
    }
  ],
  "urlPattern": "/*/*",
  "coverageGaps": [],
  "sections": [
    {
      "id": "rc2",
      "name": "breadcrumb",
      "selector": [
        ".main-holder > .container.custome-container:has(nav.breadcrumbs)",
        ".main-holder > .container.custome-container"
      ],
      "style": null,
      "blocks": [
        "breadcrumb"
      ],
      "defaultContent": []
    },
    {
      "id": "rc3",
      "name": "product-spotlight",
      "selector": [
        ".main-holder > .container.custome-container.product-spotlight-wrapper",
        ".product-spotlight-wrapper"
      ],
      "style": null,
      "blocks": [
        "columns-product-intro",
        "columns-anchor-nav",
        "cards-icon",
        "cards-tile",
        "cards-resource",
        "accordion-faq"
      ],
      "defaultContent": [
        "#features-wrapper > .product-page-sub-heading-wrapper h3",
        ".spotlight-content-wrapper .bc-rich-text > .product-page-sub-heading-wrapper",
        "#product-table-wrapper .product-table__header h3",
        "#product-documentation-wrapper .product-page-sub-heading-wrapper h3",
        "#techdocs-wrapper .product-page-sub-heading-wrapper h3",
        "#coveo-techdocs-more-results",
        ".bcls-aeo-faqs > h2"
      ]
    }
  ],
  "excluded": [
    {
      "selector": "#product-table-wrapper .product-table__container",
      "reason": "Coveo-driven model table (Product Table search hub), empty in the page; left out by decision (P5-product-detail), API integration later"
    },
    {
      "selector": "#techdocs-wrapper #coveo-center-column",
      "reason": "Coveo-driven Technical Documents table, no results on the source"
    },
    {
      "selector": "#product-documentation-wrapper #multiselect__container, #resource-table-pagination",
      "reason": "client-side Resource Type filter and pagination; items carry no type"
    }
  ]
};

const parsers = {
  breadcrumb: breadcrumbParser,
  'columns-product-intro': columnsProductIntroParser,
  'columns-anchor-nav': columnsAnchorNavParser,
  'cards-icon': cardsIconParser,
  'cards-tile': cardsTileParser,
  'cards-resource': cardsResourceParser,
  'accordion-faq': accordionFaqParser,
};
// links first (source ids still exist for the anchor nav), prepare before cleanup (cleanup's Coveo rule
// would drop the models heading; Coveo tables, resource filter and the gallery carousel are handled there),
// then cleanup (chrome removal, text normalisation), then section breaks + page metadata
const transformers = [mybeckmanLinksTransformer, beckmanProductPrepareTransformer, mybeckmanCleanupTransformer, mybeckmanSectionsTransformer];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((fn) => {
    try { fn(hookName, element, enhancedPayload); }
    catch (e) { console.error(`Transformer failed at ${hookName}:`, e); }
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
      try { parser(block.element, { document, url, params }); }
      catch (e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); }
    });

    // the sections transformer appends the Metadata block (Title, Description),
    // so WebImporter.rules.createMetadata is not called here (it would add a second one)
    executeTransformers('afterTransform', main, payload);

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
