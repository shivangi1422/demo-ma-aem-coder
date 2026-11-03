/* eslint-disable */
/* global WebImporter */

import columnsProductHeroParser from './parsers/columns-product-hero.js';
import productNavParser from './parsers/product-nav.js';
import columnsFeaturesParser from './parsers/columns-features.js';
import coveoProductsParser from './parsers/coveo-products.js';
import specificationsParser from './parsers/specifications.js';
import resourceListParser from './parsers/resource-list.js';
import coveoTechdocsParser from './parsers/coveo-techdocs.js';
import cardsGridRelatedParser from './parsers/cards-grid-related.js';
import cleanupTransformer from './transformers/mybeckman-cleanup.js';
import sectionsTransformer from './transformers/mybeckman-sections.js';

const PAGE_TEMPLATE = {
  "name": "product-detail",
  "urls": [
    "https://www.mybeckman.in/flow-cytometry/software/cytobank-enterprise"
  ],
  "representativeUrl": "https://www.mybeckman.in/flow-cytometry/software/cytobank-enterprise",
  "description": "Product detail page: intro with image and buttons, sticky in-page nav, features columns, Coveo license table, specifications, Content and Resources list (Sitecore API), Coveo technical documents, related products carousel",
  "urlPattern": "/flow-cytometry/software/*",
  "blocks": [
    {
      "name": "columns-product-hero",
      "instances": [
        ".product-spotlight-wrapper > .product-intro-wrapper"
      ]
    },
    {
      "name": "product-nav",
      "instances": [
        "#intrenal-page-link-wrapper"
      ]
    },
    {
      "name": "columns-features",
      "instances": [
        "#features-wrapper .bc-columns"
      ]
    },
    {
      "name": "coveo-products",
      "instances": [
        ".CoveoSearchInterface[data-pipeline=\"Product Table\"]"
      ]
    },
    {
      "name": "specifications",
      "instances": [
        "#product-specification-wrapper .specification-holder"
      ]
    },
    {
      "name": "resource-list",
      "instances": [
        "#product-documentation-wrapper #multiselect__container"
      ]
    },
    {
      "name": "coveo-techdocs",
      "instances": [
        "#techdocs-wrapper #coveo-center-column"
      ]
    },
    {
      "name": "cards-grid-related",
      "instances": [
        "#related-parts-wrapper .related-parts"
      ]
    }
  ],
  "sections": [
    {
      "id": "section-1",
      "name": "Product intro",
      "selector": [
        ".product-spotlight-wrapper > .product-intro-wrapper"
      ],
      "style": null,
      "blocks": [
        "columns-product-hero"
      ],
      "defaultContent": []
    },
    {
      "id": "section-2",
      "name": "In-page navigation",
      "selector": [
        "#intrenal-page-link-wrapper"
      ],
      "style": null,
      "blocks": [
        "product-nav"
      ],
      "defaultContent": []
    },
    {
      "id": "section-3",
      "name": "Features",
      "selector": [
        "#features-wrapper"
      ],
      "style": null,
      "blocks": [
        "columns-features"
      ],
      "defaultContent": [
        "#features-wrapper .product-page-sub-heading-wrapper > h2"
      ]
    },
    {
      "id": "section-4",
      "name": "Explore Licenses",
      "selector": [
        ".spotlight-content-wrapper > .bc-rich-text:has(> #product-table-wrapper)"
      ],
      "style": null,
      "blocks": [
        "coveo-products"
      ],
      "defaultContent": [
        "#product-table-wrapper > h2"
      ]
    },
    {
      "id": "section-5",
      "name": "Specifications",
      "selector": [
        ".spotlight-content-wrapper > .bc-rich-text:has(#product-specification-wrapper)"
      ],
      "style": null,
      "blocks": [
        "specifications"
      ],
      "defaultContent": [
        "#product-specification-wrapper .product-page-sub-heading-wrapper > h2"
      ]
    },
    {
      "id": "section-6",
      "name": "Content and Resources",
      "selector": [
        "#product-documentation-wrapper"
      ],
      "style": null,
      "blocks": [
        "resource-list"
      ],
      "defaultContent": [
        "#product-documentation-wrapper .product-page-sub-heading-wrapper > h2"
      ]
    },
    {
      "id": "section-7",
      "name": "Technical Documents",
      "selector": [
        "#techdocs-wrapper"
      ],
      "style": null,
      "blocks": [
        "coveo-techdocs"
      ],
      "defaultContent": [
        "#techdocs-wrapper .product-page-sub-heading-wrapper > h2"
      ]
    },
    {
      "id": "section-8",
      "name": "Related Products",
      "selector": [
        "#related-parts-wrapper"
      ],
      "style": null,
      "blocks": [
        "cards-grid-related"
      ],
      "defaultContent": [
        "#related-parts-wrapper .product-page-sub-heading-wrapper > h2",
        "p:has(> em)"
      ]
    }
  ]
};

const parsers = {
  'columns-product-hero': columnsProductHeroParser,
  'product-nav': productNavParser,
  'columns-features': columnsFeaturesParser,
  'coveo-products': coveoProductsParser,
  'specifications': specificationsParser,
  'resource-list': resourceListParser,
  'coveo-techdocs': coveoTechdocsParser,
  'cards-grid-related': cardsGridRelatedParser,
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
  // html2md hands the transform a document without <script> elements; copy the
  // Content and Resources widget's init settings (data source id) onto its
  // container first, so the resource-list parser can read them.
  onLoad: ({ document }) => {
    const container = document.querySelector('#product-documentation-wrapper #multiselect__container');
    if (!container) return;
    const text = Array.from(document.querySelectorAll('script')).map((s) => s.textContent).join('\n');
    const match = text.match(/"dataSourceId"\s*:\s*"([^"]*)"/);
    if (match) container.setAttribute('data-excat-datasource-id', match[1]);
  },
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // source breadcrumb labels (e.g. "Flow Cytometry Software" for /software), read
    // before the cleanup transformer removes the trail
    const crumbs = Array.from(document.querySelectorAll('nav.breadcrumbs li'))
      .map((li) => li.textContent.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .slice(1);

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
    meta.template = 'product-detail';
    if (crumbs.length) meta['breadcrumb-titles'] = crumbs.join(' | ');
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
