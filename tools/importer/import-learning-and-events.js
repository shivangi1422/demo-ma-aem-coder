/* eslint-disable */
/* global WebImporter */

import cardsMediaListParser from './parsers/cards-media-list.js';
import cleanupTransformer from './transformers/beckmancoulter-cleanup.js';
import sectionsTransformer from './transformers/beckmancoulter-sections.js';
import solutionsCleanupTransformer from './transformers/beckmancoulter-solutions-cleanup.js';
import solutionsSectionsTransformer from './transformers/beckmancoulter-solutions-sections.js';

const PAGE_TEMPLATE = {
  "name": "learning-and-events",
  "urls": [
    "https://www.beckmancoulter.com/en/learning-and-events/case-studies"
  ],
  "representativeUrl": "https://www.beckmancoulter.com/en/learning-and-events/case-studies",
  "description": "Learning & events listing pages: intro with anchor jump buttons, then category headings each followed by a vertical list of media-showcase rows (case studies, videos, posters, webinars).",
  "blocks": [
    {
      "name": "cards-media-list",
      "instances": [
        "div.media-showcase-group"
      ]
    }
  ],
  "urlPattern": "/en/learning-and-events/*",
  "sections": [
    {
      "id": "intro",
      "name": "Page intro",
      "selector": [
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container:nth-of-type(1)",
        "div.sublayout.ui.one.column.stackable.grid.container:first-of-type"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        ".intro-content h1",
        ".intro-content .content-container",
        "table a.ui.button"
      ]
    },
    {
      "id": "high-volume",
      "name": "High-volume Hospital Laboratory",
      "selector": [
        "div.page-content:has(#High)",
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container:nth-of-type(2) > div.lazyload.page-content.nested-padding:nth-of-type(2)"
      ],
      "style": "divider",
      "blocks": [
        "cards-media-list"
      ],
      "defaultContent": [
        "div.page-content:has(#High) h2"
      ]
    },
    {
      "id": "mid-volume",
      "name": "Mid-volume Hospital Laboratory",
      "selector": [
        "div.page-content:has(#Mid)",
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container:nth-of-type(2) > div.lazyload.page-content.nested-padding:nth-of-type(9)"
      ],
      "style": "divider",
      "blocks": [
        "cards-media-list"
      ],
      "defaultContent": [
        "div.page-content:has(#Mid) h2"
      ]
    },
    {
      "id": "small-volume",
      "name": "Small-volume Physician Office or Small Hospital Laboratory",
      "selector": [
        "div.page-content:has(#Low)",
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container:nth-of-type(2) > div.lazyload.page-content.nested-padding:nth-of-type(17)"
      ],
      "style": "divider",
      "blocks": [],
      "defaultContent": [
        "div.page-content:has(#Low) h2"
      ]
    },
    {
      "id": "reference-lab",
      "name": "Reference Laboratory",
      "selector": [
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container:nth-of-type(2) > div.lazyload.page-content.nested-padding:nth-of-type(19)"
      ],
      "style": "divider",
      "blocks": [
        "cards-media-list"
      ],
      "defaultContent": [
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container:nth-of-type(2) > div.lazyload.page-content.nested-padding:nth-of-type(19) h2"
      ]
    },
    {
      "id": "other-labs",
      "name": "Other Clinical Diagnostics Laboratories",
      "selector": [
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container:nth-of-type(2) > div.lazyload.page-content.nested-padding:nth-of-type(24)"
      ],
      "style": "divider",
      "blocks": [
        "cards-media-list"
      ],
      "defaultContent": [
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container:nth-of-type(2) > div.lazyload.page-content.nested-padding:nth-of-type(24) h2"
      ]
    }
  ]
};

const parsers = {
  'cards-media-list': cardsMediaListParser,
};

// every template's transformers are registered; each guards on PAGE_TEMPLATE.name.
// cleanup must run before sections within each template.
const transformers = [cleanupTransformer, sectionsTransformer, solutionsCleanupTransformer, solutionsSectionsTransformer];

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
