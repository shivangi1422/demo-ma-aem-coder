/* eslint-disable */
/* global WebImporter */

import productHeroParser from './parsers/product-hero.js';
import pageTabsParser from './parsers/page-tabs.js';
import featureColumnsParser from './parsers/feature-columns.js';
import specTableParser from './parsers/spec-table.js';
import productTableParser from './parsers/product-table.js';
import resourceListParser from './parsers/resource-list.js';
import relatedProductsParser from './parsers/related-products.js';
import technicalDocumentsParser from './parsers/technical-documents.js';
import cleanupTransformer from './transformers/beckman-cleanup.js';
import sectionsTransformer from './transformers/beckman-sections.js';

const PAGE_TEMPLATE = {
  "name": "software-product-detail",
  "urls": [
    "https://www.mybeckman.in/flow-cytometry/software/cytobank-enterprise",
    "https://www.mybeckman.in/flow-cytometry/software/cytobank-premium",
    "https://www.mybeckman.in/flow-cytometry/software/kaluza",
    "https://www.mybeckman.in/flow-cytometry/software/kaluza-c"
  ],
  "coverageGaps": [],
  "description": "Breadcrumb trail, product hero (image or gallery beside title, highlights, CTAs and resource links), sticky section tabs, then Features columns, a filterable licence/model table, specifications, content and resources, technical documents and related products",
  "blocks": [
    {
      "name": "product-hero",
      "instances": [
        ".product-spotlight-wrapper .product-intro-wrapper"
      ]
    },
    {
      "name": "page-tabs",
      "instances": [
        "#intrenal-page-link-wrapper"
      ]
    },
    {
      "name": "feature-columns",
      "instances": [
        "#features-wrapper .bc-columns"
      ]
    },
    {
      "name": "product-table",
      "instances": [
        ".product-spotlight-wrapper .CoveoSearchInterface:has(.product-table)"
      ]
    },
    {
      "name": "spec-table",
      "instances": [
        "#product-specification-wrapper .specification-holder"
      ]
    },
    {
      "name": "resource-list",
      "instances": [
        "#product-documentation-wrapper .content-resource-list-wrapper"
      ]
    },
    {
      "name": "technical-documents",
      "instances": [
        "#techdocs-wrapper #coveo-center-column"
      ]
    },
    {
      "name": "related-products",
      "instances": [
        "#related-parts-wrapper .related-parts"
      ]
    }
  ],
  "sections": [
    {
      "id": "s1",
      "name": "Product hero",
      "selector": [
        ".product-spotlight-wrapper .product-intro-wrapper"
      ],
      "style": null,
      "blocks": [
        "product-hero"
      ],
      "defaultContent": []
    },
    {
      "id": "s2",
      "name": "Page tabs",
      "selector": [
        "#intrenal-page-link-wrapper"
      ],
      "style": null,
      "blocks": [
        "page-tabs"
      ],
      "defaultContent": []
    },
    {
      "id": "s3",
      "name": "Features",
      "selector": [
        "#features-wrapper"
      ],
      "style": null,
      "blocks": [
        "feature-columns"
      ],
      "defaultContent": [
        "#features-wrapper h3"
      ]
    },
    {
      "id": "s4",
      "name": "Licenses / Models",
      "selector": [
        "div.product-page-sub-heading-wrapper#product-table-wrapper",
        ".product-spotlight-wrapper .CoveoSearchInterface:has(.product-table)"
      ],
      "style": null,
      "blocks": [
        "product-table"
      ],
      "defaultContent": [
        "div.product-page-sub-heading-wrapper#product-table-wrapper h3"
      ]
    },
    {
      "id": "s5",
      "name": "Specifications",
      "selector": [
        "#product-specification-wrapper"
      ],
      "style": null,
      "blocks": [
        "spec-table"
      ],
      "defaultContent": [
        "#product-specification-wrapper h3"
      ]
    },
    {
      "id": "s6",
      "name": "Content and Resources",
      "selector": [
        "#product-documentation-wrapper"
      ],
      "style": null,
      "blocks": [
        "resource-list"
      ],
      "defaultContent": [
        "#product-documentation-wrapper h3"
      ]
    },
    {
      "id": "s7",
      "name": "Technical Documents",
      "selector": [
        "#techdocs-wrapper"
      ],
      "style": null,
      "blocks": [
        "technical-documents"
      ],
      "defaultContent": [
        "#techdocs-wrapper h3",
        "#coveo-techdocs-more-results"
      ]
    },
    {
      "id": "s8",
      "name": "Related products",
      "selector": [
        "#related-parts-wrapper"
      ],
      "style": null,
      "blocks": [
        "related-products"
      ],
      "defaultContent": [
        "#related-parts-wrapper h3"
      ]
    },
    {
      "id": "s9",
      "name": "Disclaimer",
      "selector": [
        "#related-parts-wrapper + .bc-rich-text"
      ],
      "style": "fine-print",
      "blocks": [],
      "defaultContent": [
        "#related-parts-wrapper + .bc-rich-text p"
      ]
    }
  ],
  "urlPattern": "/*/software/*"
};

const parsers = {
  'product-hero': productHeroParser,
  'page-tabs': pageTabsParser,
  'feature-columns': featureColumnsParser,
  'spec-table': specTableParser,
  'product-table': productTableParser,
  'resource-list': resourceListParser,
  'related-products': relatedProductsParser,
  'technical-documents': technicalDocumentsParser,
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

/**
 * Page metadata from the document head, the breadcrumb labels captured by the cleanup
 * transformer, and the page template (drives the product-detail layout styles).
 */
function createMetadata(main, document) {
  const meta = WebImporter.Blocks.getMetadata(document) || {};
  const labels = document.documentElement.dataset.breadcrumbLabels;
  if (labels) meta['Breadcrumb Labels'] = labels;
  // lower-case key: the local preview keeps metadata names as written, and getMetadata('template') is exact
  meta.template = PAGE_TEMPLATE.name;
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
    // migrated pages live under the "sai" site root (with its own nav and footer)
    const path = WebImporter.FileUtils.sanitizePath(`/sai${rawPath === '' ? '/index' : rawPath}`);

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }];
  },
};
