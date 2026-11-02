/* eslint-disable */
/* global WebImporter */

import cardsGridContentlistParser from './parsers/cards-grid-contentlist.js';
import marketoFormParser from './parsers/marketo-form.js';
import cleanupTransformer from './transformers/mybeckman-cleanup.js';
import sectionsTransformer from './transformers/mybeckman-sections.js';

const PAGE_TEMPLATE = {
  "name": "support",
  "urls": [
    "https://www.mybeckman.in/support"
  ],
  "representativeUrl": "https://www.mybeckman.in/support",
  "description": "Support landing page: breadcrumb, text intro, four image support cards (Service Plans, Locations, Training, FAQs), eCommerce promo",
  "urlPattern": "/support",
  "blocks": [
    {
      "name": "cards-grid-contentlist",
      "instances": [
        ".content-list.column-count-3",
        ".content-list"
      ]
    },
    {
      "name": "marketo-form",
      "instances": [
        "#main .formassembly-container"
      ]
    }
  ],
  "sections": [
    {
      "id": "section-1",
      "name": "Page heading",
      "selector": [
        "#content-holder",
        ".generic-content-heading"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        "#content-holder > h1"
      ]
    },
    {
      "id": "section-2",
      "name": "Support content and request form",
      "selector": [
        ".two-columns-holder"
      ],
      "style": "split",
      "blocks": [
        "cards-grid-contentlist",
        "marketo-form"
      ],
      "defaultContent": [
        ".two-columns-holder__left .bc-rich-text > p"
      ]
    }
  ]
};

const parsers = {
  'cards-grid-contentlist': cardsGridContentlistParser,
  'marketo-form': marketoFormParser,
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
    meta.template = 'support';
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
