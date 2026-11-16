/* eslint-disable */
/* global WebImporter */

import columnsTextFirstParser from './parsers/columns-text-first.js';
import columnsParser from './parsers/columns.js';
import columnsCtaParser from './parsers/columns-cta.js';
import cleanupTransformer from './transformers/mybeckman-cleanup.js';
import sectionsTransformer from './transformers/mybeckman-sections.js';

const PAGE_TEMPLATE = {
  "name": "service-tech-support",
  "urls": [
    "https://www.mybeckman.in/service/tech-support/repairs"
  ],
  "representativeUrl": "https://www.mybeckman.in/service/tech-support/repairs",
  "description": "Service technical support detail page (Repairs): H1 with text|image columns, image|text columns with a call button (text first on mobile), blue Get in Touch contact band",
  "urlPattern": "/service/tech-support/*",
  "blocks": [
    {
      "name": "columns-text-first",
      "instances": [
        ".Section > .Section__two-column:has(> .Section__two-column-left > img:only-child)"
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
      "name": "Repair Services intro",
      "selector": [
        ".bc-rich-text:has(> .Section > h1)"
      ],
      "style": null,
      "blocks": [
        "columns"
      ],
      "defaultContent": [
        ".Section > h1"
      ]
    },
    {
      "id": "section-2",
      "name": "Onsite repairs",
      "selector": [
        ".bc-rich-text:has(.Section__two-column-left > img:only-child)"
      ],
      "style": null,
      "blocks": [
        "columns-text-first"
      ],
      "defaultContent": []
    },
    {
      "id": "section-3",
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
  'columns-text-first': columnsTextFirstParser,
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
