/* eslint-disable */
/* global WebImporter */

import heroCenteredLeftParser from './parsers/hero-centered-left.js';
import cardsGridIconLeftParser from './parsers/cards-grid-icon-left.js';
import cardsGridButtonsParser from './parsers/cards-grid-buttons.js';
import marketoFormParser from './parsers/marketo-form.js';
import cleanupTransformer from './transformers/mybeckman-cleanup.js';
import sectionsTransformer from './transformers/mybeckman-sections.js';

const PAGE_TEMPLATE = {
  "name": "service-training",
  "urls": [
    "https://www.mybeckman.in/service/training"
  ],
  "representativeUrl": "https://www.mybeckman.in/service/training",
  "description": "Training page: breadcrumb, MyBeckman Learning hero with images, Learn Your Way list, training method image/text sections with Sign Up CTAs, course catalog links, Knowledge Awaits callout, legal note",
  "urlPattern": "/service/training",
  "blocks": [
    {
      "name": "hero-centered-left",
      "instances": [
        ".bc-rich-text > .outimg",
        ".outimg"
      ]
    },
    {
      "name": "cards-grid-icon-left",
      "instances": [
        ".containercustom > .row:has(> .col-md-1 img)"
      ]
    },
    {
      "name": "cards-grid-buttons",
      "instances": [
        ".containercustom > .menu"
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
      "name": "MyBeckman Learning hero",
      "selector": [
        ".bc-rich-text:has(> .outimg)"
      ],
      "style": null,
      "blocks": [
        "hero-centered-left"
      ],
      "defaultContent": []
    },
    {
      "id": "section-2",
      "name": "Intro, training methods and Course Catalog",
      "selector": [
        ".bc-rich-text:has(> .containercustom > h1)"
      ],
      "style": null,
      "blocks": [
        "cards-grid-icon-left",
        "cards-grid-buttons"
      ],
      "defaultContent": [
        ".containercustom > h1",
        ".containercustom > p",
        ".containercustom > h2",
        ".containercustom > ul"
      ]
    },
    {
      "id": "section-3",
      "name": "Knowledge Awaits",
      "selector": [
        ".bc-rich-text > div:has(> .containercustom > h3)"
      ],
      "style": "grey, centered",
      "blocks": [
        "marketo-form"
      ],
      "defaultContent": [
        ".containercustom > h3",
        ".containercustom > h3 + p"
      ]
    },
    {
      "id": "section-4",
      "name": "Legal note",
      "selector": [
        ".bc-rich-text > div:has(> .containercustom > p > em)"
      ],
      "style": "grey",
      "blocks": [],
      "defaultContent": [
        ".containercustom > p:has(> em)"
      ]
    }
  ]
};

const parsers = {
  'hero-centered-left': heroCenteredLeftParser,
  'cards-grid-icon-left': cardsGridIconLeftParser,
  'cards-grid-buttons': cardsGridButtonsParser,
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
    meta.template = 'service-training';
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
