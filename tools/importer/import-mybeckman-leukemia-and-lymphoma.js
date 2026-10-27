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
  "name": "mybeckman-leukemia-and-lymphoma",
  "urls": [
    "https://www.mybeckman.in/resources/disease-research/leukemia-and-lymphoma"
  ],
  "representativeUrl": "https://www.mybeckman.in/resources/disease-research/leukemia-and-lymphoma",
  "urlPattern": "/resources/disease-research/leukemia-and-lymphoma",
  "description": "Disease-research gateway page: plain H1 intro, sticky jump links, five chapter banners (image_wrapper_vk with H2) followed by body copy, product-series-callouts card grids, a two-column infographic row and a run of wrap-collabsible toggles; references list.",
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
        "div.bc-rich-text:has(> #laboratory-challenges) > div.row"
      ]
    },
    {
      "name": "cards-grid-photo-mb",
      "instances": [
        "div.product-series-callouts"
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
      "id": "intro",
      "name": "Page title and intro",
      "selector": [
        "#content-holder"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        "#content-holder > h1",
        "#content-holder > p"
      ]
    },
    {
      "id": "jump-nav",
      "name": "Sticky chapter jump links",
      "selector": [
        "div.bc-rich-text > div.sticky"
      ],
      "style": "jump-links",
      "blocks": [],
      "defaultContent": [
        "div.bc-rich-text > div.sticky"
      ]
    },
    {
      "id": "overview",
      "name": "Overview and Statistics",
      "selector": [
        "#overview-and-statistics"
      ],
      "style": null,
      "blocks": [
        "hero-left-mb",
        "cards-grid-photo-mb"
      ],
      "defaultContent": [
        "div.bc-rich-text:has(> #overview-and-statistics) > p",
        "div.bc-rich-text:has(> #overview-and-statistics) > h3"
      ]
    },
    {
      "id": "diagnostic-tool",
      "name": "Flow Cytometry as a Diagnostic Tool",
      "selector": [
        "#diagnostic-tool"
      ],
      "style": null,
      "blocks": [
        "hero-left-mb",
        "cards-grid-photo-mb"
      ],
      "defaultContent": [
        "div.bc-rich-text:has(> #diagnostic-tool) > p",
        "div.bc-rich-text:has(> #diagnostic-tool) > ul"
      ]
    },
    {
      "id": "lab-challenges",
      "name": "Laboratory Challenges",
      "selector": [
        "#laboratory-challenges"
      ],
      "style": null,
      "blocks": [
        "hero-left-mb",
        "columns-mb",
        "cards-grid-photo-mb"
      ],
      "defaultContent": [
        "div.bc-rich-text:has(> #laboratory-challenges) > h3",
        "div.bc-rich-text:has(> #laboratory-challenges) + div.product-series-callouts + div.bc-rich-text > h3"
      ]
    },
    {
      "id": "standardized-reagents",
      "name": "Advantages of Standardized Reagents",
      "selector": [
        "#standardized-reagents"
      ],
      "style": null,
      "blocks": [
        "hero-left-mb",
        "accordion-toggle-mb",
        "cards-grid-photo-mb"
      ],
      "defaultContent": [
        "div.bc-rich-text:has(> #standardized-reagents) > h3",
        "div.bc-rich-text:has(> #standardized-reagents) > p",
        "div.bc-rich-text:has(> #standardized-reagents) > div.container-overlay-full-width > img",
        "div.bc-rich-text:has(> #standardized-reagents) + div.product-series-callouts + div.bc-rich-text > h3"
      ]
    },
    {
      "id": "additional-resources",
      "name": "Additional Resources",
      "selector": [
        "#additional-resources"
      ],
      "style": null,
      "blocks": [
        "hero-left-mb",
        "cards-grid-photo-mb"
      ],
      "defaultContent": []
    },
    {
      "id": "references",
      "name": "Footnote and references",
      "selector": [
        "div.bc-rich-text:has(li#ref1)"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        "div.bc-rich-text:has(li#ref1) > p",
        "div.bc-rich-text:has(li#ref1) > h2",
        "div.bc-rich-text:has(li#ref1) > ol"
      ]
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
