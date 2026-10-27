/* eslint-disable */
/* global WebImporter */

import contentProductDetailParser from './parsers/content-product-detail.js';
import columnsFeaturesParser from './parsers/columns-features.js';
import heroParser from './parsers/hero.js';
import embedVideoParser from './parsers/embed-video.js';
import columnsIconListParser from './parsers/columns-icon-list.js';
import cardsGridParser from './parsers/cards-grid.js';
import contentReversedParser from './parsers/content-reversed.js';
import cardsResourceListParser from './parsers/cards-resource-list.js';
import cardsDocTableParser from './parsers/cards-doc-table.js';
import beckmanCleanupTransformer from './transformers/beckman-cleanup.js';
import beckmanSectionsTransformer from './transformers/beckman-sections.js';

const PAGE_TEMPLATE = {
  "name": "reagent-product",
  "urls": [
    "https://www.mybeckman.in/reagents/particle/valita-aggregation-pure",
    "https://www.mybeckman.in/reagents/particle/valita-titer-assays"
  ],
  "representativeUrl": "https://www.mybeckman.in/reagents/particle/valita-titer-assays",
  "description": "Reagent product detail pages (Valita kits): product spotlight intro, rich-text features, embedded video, product callouts, disclaimers",
  "blocks": [
    {
      "name": "content-product-detail",
      "instances": [
        ".product-spotlight-wrapper > .product-intro-wrapper"
      ]
    },
    {
      "name": "columns-features",
      "instances": [
        "#features-wrapper .bc-columns"
      ]
    },
    {
      "name": "hero",
      "instances": [
        ".product-spotlight-wrapper .spotlight-content-wrapper .banner-container"
      ]
    },
    {
      "name": "embed-video",
      "instances": [
        ".product-spotlight-wrapper .spotlight-content-wrapper > .embeded-video"
      ]
    },
    {
      "name": "columns-icon-list",
      "instances": [
        ".product-spotlight-wrapper .spotlight-content-wrapper > .bc-rich-text > .row"
      ]
    },
    {
      "name": "cards-grid",
      "instances": [
        ".product-spotlight-wrapper .spotlight-content-wrapper > .product-series-callouts"
      ]
    },
    {
      "name": "content-reversed",
      "instances": [
        ".product-spotlight-wrapper .spotlight-content-wrapper .custom-container"
      ]
    },
    {
      "name": "cards-resource-list",
      "instances": [
        "#product-documentation-wrapper .content-resource-list-wrapper"
      ]
    },
    {
      "name": "cards-doc-table",
      "instances": [
        "#techdocs-wrapper .techdocs-table"
      ]
    }
  ],
  "urlPattern": "/reagents/particle/valita-*",
  "sections": [
    {
      "id": "section-1",
      "name": "Product intro",
      "selector": [
        ".product-spotlight-wrapper > .product-intro-wrapper"
      ],
      "style": null,
      "blocks": [
        "content-product-detail"
      ],
      "defaultContent": []
    },
    {
      "id": "section-2",
      "name": "Features",
      "selector": [
        "#features-wrapper"
      ],
      "style": null,
      "blocks": [
        "columns-features"
      ],
      "defaultContent": [
        "#features-wrapper > .product-page-sub-heading-wrapper",
        "#features-wrapper > p"
      ]
    },
    {
      "id": "section-3",
      "name": "Promo banner",
      "selector": [
        ".product-spotlight-wrapper .spotlight-content-wrapper > .bc-rich-text:has(.banner-container)"
      ],
      "style": null,
      "blocks": [
        "hero"
      ],
      "defaultContent": []
    },
    {
      "id": "section-4",
      "name": "Video",
      "selector": [
        ".product-spotlight-wrapper .spotlight-content-wrapper > .bc-rich-text:has(+ .embeded-video)",
        ".product-spotlight-wrapper .spotlight-content-wrapper > .embeded-video"
      ],
      "style": null,
      "blocks": [
        "embed-video"
      ],
      "defaultContent": [
        ".product-spotlight-wrapper .spotlight-content-wrapper > .bc-rich-text:has(+ .embeded-video) .product-page-sub-heading-wrapper",
        ".product-spotlight-wrapper .spotlight-content-wrapper > .bc-rich-text:has(+ .embeded-video) > p"
      ]
    },
    {
      "id": "section-5",
      "name": "Quantify IgG in minutes",
      "selector": [
        ".product-spotlight-wrapper .spotlight-content-wrapper > .bc-rich-text:has(> .row)"
      ],
      "style": null,
      "blocks": [
        "columns-icon-list"
      ],
      "defaultContent": [
        ".product-spotlight-wrapper .spotlight-content-wrapper > .bc-rich-text:has(> .row) > .product-page-sub-heading-wrapper",
        ".product-spotlight-wrapper .spotlight-content-wrapper > .bc-rich-text:has(> .row) > p"
      ]
    },
    {
      "id": "section-6",
      "name": "Learn more callouts",
      "selector": [
        ".product-spotlight-wrapper .spotlight-content-wrapper > .bc-rich-text:has(+ .product-series-callouts)",
        ".product-spotlight-wrapper .spotlight-content-wrapper > .product-series-callouts"
      ],
      "style": null,
      "blocks": [
        "cards-grid"
      ],
      "defaultContent": [
        ".product-spotlight-wrapper .spotlight-content-wrapper > .bc-rich-text:has(+ .product-series-callouts) .product-page-sub-heading-wrapper"
      ]
    },
    {
      "id": "section-7",
      "name": "Explore product table",
      "selector": [
        "#product-table-wrapper"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        "#product-table-wrapper .product-page-sub-heading-wrapper"
      ]
    },
    {
      "id": "section-8",
      "name": "Plate reader bundle banner",
      "selector": [
        ".product-spotlight-wrapper .spotlight-content-wrapper > .bc-rich-text:has(> .custom-container)"
      ],
      "style": null,
      "blocks": [
        "content-reversed"
      ],
      "defaultContent": []
    },
    {
      "id": "section-9",
      "name": "Content and Resources",
      "selector": [
        "#product-documentation-wrapper"
      ],
      "style": null,
      "blocks": [
        "cards-resource-list"
      ],
      "defaultContent": [
        "#product-documentation-wrapper .product-page-sub-heading-wrapper"
      ]
    },
    {
      "id": "section-10",
      "name": "Technical Documents",
      "selector": [
        "#techdocs-wrapper"
      ],
      "style": null,
      "blocks": [
        "cards-doc-table"
      ],
      "defaultContent": [
        "#techdocs-wrapper > .product-page-sub-heading-wrapper",
        "#coveo-techdocs-more-results"
      ]
    },
    {
      "id": "section-11",
      "name": "Disclaimer",
      "selector": [
        ".product-spotlight-wrapper .spotlight-content-wrapper > .bc-rich-text:has(> h5)"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        ".product-spotlight-wrapper .spotlight-content-wrapper > .bc-rich-text:has(> h5)"
      ]
    }
  ]
};

const PAGE_THEME = 'mybeckman';

const parsers = {
  'content-product-detail': contentProductDetailParser,
  'columns-features': columnsFeaturesParser,
  'hero': heroParser,
  'embed-video': embedVideoParser,
  'columns-icon-list': columnsIconListParser,
  'cards-grid': cardsGridParser,
  'content-reversed': contentReversedParser,
  'cards-resource-list': cardsResourceListParser,
  'cards-doc-table': cardsDocTableParser,
};
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
    // Page theme: scopes the mybeckman.in look (fonts, buttons, cards) to migrated pages
    const metaTable = [...main.querySelectorAll('table')]
      .find((t) => t.querySelector('th, td')?.textContent.trim().toLowerCase() === 'metadata');
    if (metaTable) {
      const tr = document.createElement('tr');
      ['theme', PAGE_THEME].forEach((v) => {
        const td = document.createElement('td');
        td.textContent = v;
        tr.append(td);
      });
      (metaTable.querySelector('tbody') || metaTable).append(tr);
    } else {
      main.append(WebImporter.Blocks.createBlock(document, { name: 'Metadata', cells: { theme: PAGE_THEME } }));
    }
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
