/* eslint-disable */
/* global WebImporter */

import heroLeftMbParser from './parsers/hero-left-mb.js';
import columnsMbParser from './parsers/columns-mb.js';
import cardsGridPhotoMbParser from './parsers/cards-grid-photo-mb.js';
import accordionToggleMbParser from './parsers/accordion-toggle-mb.js';
import cleanupTransformer from './transformers/beckmancoulter-cleanup.js';
import sectionsTransformer from './transformers/beckmancoulter-sections.js';
import solutionsCleanupTransformer from './transformers/beckmancoulter-solutions-cleanup.js';
import solutionsSectionsTransformer from './transformers/beckmancoulter-solutions-sections.js';
import dxsCleanupTransformer from './transformers/beckmancoulter-dxs-cleanup.js';
import dxsSectionsTransformer from './transformers/beckmancoulter-dxs-sections.js';
import productCleanupTransformer from './transformers/beckmancoulter-product-cleanup.js';
import productSectionsTransformer from './transformers/beckmancoulter-product-sections.js';
import hematologyCleanupTransformer from './transformers/beckmancoulter-hematology-cleanup.js';
import hematologySectionsTransformer from './transformers/beckmancoulter-hematology-sections.js';
import mybeckmanCleanupTransformer from './transformers/mybeckman-cleanup.js';
import mybeckmanSectionsTransformer from './transformers/mybeckman-sections.js';

const PAGE_TEMPLATE = {
  "name": "mybeckman-clinical-trials",
  "urls": [
    "https://www.mybeckman.in/flow-cytometry/clinical-trials"
  ],
  "representativeUrl": "https://www.mybeckman.in/flow-cytometry/clinical-trials",
  "urlPattern": "/flow-cytometry/clinical-trials",
  "description": "Flow cytometry clinical-trials landing page: banner hero (image_wrapper_vk), gradient jump-link strip, ebook columns, three chapter bands (two-columns-holder video|text columns, product-series-callouts card grids, wrap-collabsible \"Related products\" toggles).",
  "blocks": [
    {
      "name": "hero-left-mb",
      "instances": [
        "div.image_wrapper_vk"
      ]
    },
    {
      "name": "columns-mb",
      "instances": [
        "div.width90cta",
        "div.two-columns-holder"
      ]
    },
    {
      "name": "cards-grid-photo-mb",
      "instances": [
        "div.product-series-callouts:not(.collapsible-content *)"
      ]
    },
    {
      "name": "accordion-toggle-mb",
      "instances": [
        "div.wrap-collabsible:not(div.wrap-collabsible + div.wrap-collabsible)"
      ]
    }
  ],
  "sections": [
    {
      "id": "hero",
      "name": "Hero banner",
      "selector": [
        "div.image_wrapper_vk"
      ],
      "style": null,
      "blocks": [
        "hero-left-mb"
      ],
      "defaultContent": []
    },
    {
      "id": "intro",
      "name": "Intro + workflow graphic",
      "selector": [
        "div.bc-rich-text:has(> div.image_wrapper_vk) > p:first-of-type"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        "div.bc-rich-text:has(> div.image_wrapper_vk) > p:first-of-type",
        "div.bc-rich-text:has(> div.image_wrapper_vk) > img"
      ]
    },
    {
      "id": "jump-nav",
      "name": "Chapter jump links",
      "selector": [
        "div.container-overlay-full-width:has(div.sticky)"
      ],
      "style": "spectrum-gradient, jump-links",
      "blocks": [],
      "defaultContent": [
        "div.container-overlay-full-width div.sticky"
      ]
    },
    {
      "id": "ebook",
      "name": "We wrote the book",
      "selector": [
        "div:has(> div.width90cta)"
      ],
      "style": "divider",
      "blocks": [
        "columns-mb"
      ],
      "defaultContent": []
    },
    {
      "id": "chapter-1",
      "name": "Chapter 1",
      "selector": [
        "div.two-columns-holder:has(#multicenter)"
      ],
      "style": "divider",
      "blocks": [
        "columns-mb",
        "cards-grid-photo-mb",
        "accordion-toggle-mb"
      ],
      "defaultContent": []
    },
    {
      "id": "chapter-2",
      "name": "Chapter 2",
      "selector": [
        "div.two-columns-holder:has(#resources)"
      ],
      "style": null,
      "blocks": [
        "columns-mb",
        "cards-grid-photo-mb"
      ],
      "defaultContent": [
        "div.two-columns-holder:has(#resources) + div.bc-test-layout div.bc-rich-text > h3"
      ]
    },
    {
      "id": "chapter-3",
      "name": "Chapter 3",
      "selector": [
        "div.two-columns-holder:has(#efficiency)"
      ],
      "style": null,
      "blocks": [
        "columns-mb",
        "cards-grid-photo-mb",
        "accordion-toggle-mb"
      ],
      "defaultContent": []
    }
  ]
};

const parsers = {
  'hero-left-mb': heroLeftMbParser,
  'columns-mb': columnsMbParser,
  'cards-grid-photo-mb': cardsGridPhotoMbParser,
  'accordion-toggle-mb': accordionToggleMbParser,
};

// every template's transformers are registered; each guards on PAGE_TEMPLATE.name.
// cleanup must run before sections within each template.
const transformers = [cleanupTransformer, sectionsTransformer, solutionsCleanupTransformer, solutionsSectionsTransformer, dxsCleanupTransformer, dxsSectionsTransformer, productCleanupTransformer, productSectionsTransformer, hematologyCleanupTransformer, hematologySectionsTransformer, mybeckmanCleanupTransformer, mybeckmanSectionsTransformer];

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
    const metaTable = [...main.querySelectorAll('table')].find((table) => {
      const first = table.querySelector('tr > th, tr > td');
      return first && /^metadata$/i.test(first.textContent.trim());
    });
    if (metaTable && metaTable !== main.lastElementChild) main.append(metaTable);
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
