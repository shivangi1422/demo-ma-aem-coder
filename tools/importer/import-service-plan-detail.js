/* eslint-disable */
/* global WebImporter */

import heroCenteredParser from './parsers/hero-centered.js';
import tableComparisonParser from './parsers/table-comparison.js';
import columnsParser from './parsers/columns.js';
import columnsCtaParser from './parsers/columns-cta.js';
import cleanupTransformer from './transformers/mybeckman-cleanup.js';
import sectionsTransformer from './transformers/mybeckman-sections.js';

const PAGE_TEMPLATE = {
  "name": "service-plan-detail",
  "urls": [
    "https://www.mybeckman.in/service/plans/centrifuge",
    "https://www.mybeckman.in/service/plans/flow-cytometry",
    "https://www.mybeckman.in/service/plans/liquid-handling",
    "https://www.mybeckman.in/service/plans/particle-analysis"
  ],
  "representativeUrl": "https://www.mybeckman.in/service/plans/centrifuge",
  "description": "Product service plan page: breadcrumb, optional photo hero with two CTAs, warranty/post-warranty comparison table with legend, optional two-column info section, blue Get in Touch band",
  "urlPattern": "/service/plans/*",
  "blocks": [
    {
      "name": "hero-centered",
      "instances": [
        ".bc-rich-text > .hero",
        "div.hero"
      ]
    },
    {
      "name": "table-comparison",
      "instances": [
        "#service-plans-table > table",
        "#service-plans-table table"
      ]
    },
    {
      "name": "columns",
      "instances": [
        ".Section > .row:has(> .col-md-6)",
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
      "name": "Hero",
      "selector": [
        ".bc-rich-text:has(> .hero)"
      ],
      "style": null,
      "blocks": [
        "hero-centered"
      ],
      "defaultContent": []
    },
    {
      "id": "section-2",
      "name": "Choose a plan",
      "selector": [
        "#choosePlan",
        ".bc-rich-text:has(#service-plans-table)"
      ],
      "style": null,
      "blocks": [
        "table-comparison"
      ],
      "defaultContent": [
        "#choosePlan .firstSection > h2",
        "#service-plans-table .footnotes > div > p"
      ]
    },
    {
      "id": "section-3",
      "name": "Additional services",
      "selector": [
        ".bc-rich-text:has(> .Section > .row > .col-md-6)",
        ".bc-rich-text:has(> .Section > .Section__two-column)"
      ],
      "style": null,
      "blocks": [
        "columns"
      ],
      "defaultContent": []
    },
    {
      "id": "section-4",
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
  'hero-centered': heroCenteredParser,
  'table-comparison': tableComparisonParser,
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
