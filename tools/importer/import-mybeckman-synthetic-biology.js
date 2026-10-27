/* eslint-disable */
/* global WebImporter */

import heroHomeMbParser from './parsers/hero-home-mb.js';
import columnsMbParser from './parsers/columns-mb.js';
import tabsWorkflowMbParser from './parsers/tabs-workflow-mb.js';
import accordionToggleMbParser from './parsers/accordion-toggle-mb.js';
import cardsGridVideoMbParser from './parsers/cards-grid-video-mb.js';
import formMbParser from './parsers/form-mb.js';
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
  "name": "mybeckman-synthetic-biology",
  "urls": [
    "https://www.mybeckman.in/resources/industries/synthetic-biology"
  ],
  "representativeUrl": "https://www.mybeckman.in/resources/industries/synthetic-biology",
  "urlPattern": "/resources/industries/synthetic-biology",
  "description": "Industry landing page (Sitecore bc-rich-text family): photo hero (largebanner/smallbanner), intro text|graphic columns, tab-scroll interactive workflow, featured-resources accordion, Wistia channel video gallery, testimonial video|cover columns, Marketo contact form (3101), disclaimer.",
  "blocks": [
    {
      "name": "hero-home-mb",
      "instances": [
        "div.outimg:has(> div.largebanner)"
      ]
    },
    {
      "name": "columns-mb",
      "instances": [
        "div.intro",
        "div.containercustom > div.row:has(wistia-player)"
      ]
    },
    {
      "name": "tabs-workflow-mb",
      "instances": [
        "div.tab-scroll"
      ]
    },
    {
      "name": "accordion-toggle-mb",
      "instances": [
        "div.containercustom > div.row:has(div.accordion-item)"
      ]
    },
    {
      "name": "cards-grid-video-mb",
      "instances": [
        "div.wistia_channel"
      ]
    },
    {
      "name": "form-mb",
      "instances": [
        "#main div.formassembly-container"
      ]
    }
  ],
  "sections": [
    {
      "id": "hero",
      "name": "Top photo banner",
      "selector": [
        "div.outimg:has(> div.largebanner)"
      ],
      "style": null,
      "blocks": [
        "hero-home-mb"
      ],
      "defaultContent": []
    },
    {
      "id": "intro",
      "name": "Intro + Design-Build-Test-Learn graphic",
      "selector": [
        "div.containercustom:has(> div.intro)"
      ],
      "style": null,
      "blocks": [
        "columns-mb"
      ],
      "defaultContent": []
    },
    {
      "id": "workflow",
      "name": "Interactive Synthetic Biology Workflow",
      "selector": [
        "div.containercustom:has(> div.tab-scroll)"
      ],
      "style": null,
      "blocks": [
        "tabs-workflow-mb"
      ],
      "defaultContent": [
        "div.containercustom:has(> div.tab-scroll) > h2",
        "div.containercustom:has(> div.tab-scroll) > p",
        "div.containercustom:has(> div.tab-scroll) > div:last-child"
      ]
    },
    {
      "id": "featured-resources",
      "name": "Synthetic Biology Featured Resources",
      "selector": [
        "div.containercustom:has(div.accordion-item)"
      ],
      "style": null,
      "blocks": [
        "accordion-toggle-mb"
      ],
      "defaultContent": [
        "div.containercustom:has(div.accordion-item) > h2"
      ]
    },
    {
      "id": "video-gallery",
      "name": "Synthetic Biology Video Gallery",
      "selector": [
        "div.containercustom:has(> div.wistia_channel)"
      ],
      "style": null,
      "blocks": [
        "cards-grid-video-mb"
      ],
      "defaultContent": [
        "div.containercustom:has(> div.wistia_channel) > h2"
      ]
    },
    {
      "id": "testimonial",
      "name": "Customer Testimonial",
      "selector": [
        "div.containercustom:has(wistia-player)"
      ],
      "style": null,
      "blocks": [
        "columns-mb"
      ],
      "defaultContent": [
        "div.containercustom:has(wistia-player) > h2"
      ]
    },
    {
      "id": "contact",
      "name": "Our team is ready to help (contact form)",
      "selector": [
        "div.bc-rich-text:has(> a[name=form])"
      ],
      "style": "highlight",
      "blocks": [
        "form-mb"
      ],
      "defaultContent": [
        "div.bc-rich-text:has(> a[name=form]) div.containercustom > h2",
        "div.bc-rich-text:has(> a[name=form]) div.containercustom > p"
      ]
    },
    {
      "id": "disclaimer",
      "name": "Disclaimer",
      "selector": [
        "div.formassembly-container + div.bc-rich-text"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        "div.formassembly-container + div.bc-rich-text div.containercustom > p"
      ]
    }
  ]
};

const parsers = {
  'hero-home-mb': heroHomeMbParser,
  'columns-mb': columnsMbParser,
  'tabs-workflow-mb': tabsWorkflowMbParser,
  'accordion-toggle-mb': accordionToggleMbParser,
  'cards-grid-video-mb': cardsGridVideoMbParser,
  'form-mb': formMbParser,
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
