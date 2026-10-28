/* eslint-disable */
/* global WebImporter */

import heroHomeMbParser from './parsers/hero-home-mb.js';
import tabsWorkflowMbParser from './parsers/tabs-workflow-mb.js';
import columnsMbParser from './parsers/columns-mb.js';
import embedMbParser from './parsers/embed-mb.js';
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
  "name": "mybeckman-biomanufacturing",
  "urls": [
    "https://www.mybeckman.in/resources/industries/biomanufacturing"
  ],
  "representativeUrl": "https://www.mybeckman.in/resources/industries/biomanufacturing",
  "urlPattern": "/resources/industries/biomanufacturing",
  "description": "Industry landing page (Sitecore bc-rich-text family): Wistia background-video hero, intro with two-column list, tab-scroll interactive workflow, grey ebook columns band, Wistia testimonial player, Marketo contact form (3101) with disclaimer.",
  "blocks": [
    {
      "name": "hero-home-mb",
      "instances": [
        "div.bc-rich-text > div.section:has(iframe.responsive-iframe)"
      ]
    },
    {
      "name": "tabs-workflow-mb",
      "instances": [
        "div.tab-scroll"
      ]
    },
    {
      "name": "columns-mb",
      "instances": [
        "div.containercustom > div.row:has(> div.col-md-8)"
      ]
    },
    {
      "name": "embed-mb",
      "instances": [
        "div.embeded-video__wrapper"
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
      "name": "Top video banner",
      "selector": [
        "div.bc-rich-text > div.section:has(iframe.responsive-iframe)"
      ],
      "style": null,
      "blocks": [
        "hero-home-mb"
      ],
      "defaultContent": []
    },
    {
      "id": "intro",
      "name": "A World Of Possibilities",
      "selector": [
        "div.containercustom:has(ul.fields):not(:has(div.col-md-8))"
      ],
      "style": "checklist",
      "blocks": [],
      "defaultContent": [
        "div.containercustom:has(> div.row > div.col-sm-6) > h2",
        "div.containercustom:has(> div.row > div.col-sm-6) > p",
        "div.containercustom > div.row > div.col-sm-6 > ul.fields"
      ]
    },
    {
      "id": "workflow",
      "name": "Interactive Biomanufacturing Workflow",
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
      "id": "ebook",
      "name": "A Must-Have Resource on Biomanufacturing",
      "selector": [
        "div.containercustom:has(> div.row > div.col-md-8)"
      ],
      "style": "highlight, checklist",
      "blocks": [
        "columns-mb"
      ],
      "defaultContent": []
    },
    {
      "id": "testimonial",
      "name": "What Customers Are Saying",
      "selector": [
        "div.bc-rich-text:has(+ div.embeded-video)"
      ],
      "style": "centered",
      "blocks": [
        "embed-mb"
      ],
      "defaultContent": [
        "div.bc-rich-text:has(+ div.embeded-video) h2"
      ]
    },
    {
      "id": "contact",
      "name": "Our team is ready to help (contact form)",
      "selector": [
        "div.bc-rich-text:has(> a[name=form])"
      ],
      "style": "highlight, centered",
      "blocks": [
        "form-mb"
      ],
      "defaultContent": [
        "div.containercustom > div.formtitle",
        "div.containercustom > div.formtext",
        "div.formassembly-container + div.bc-rich-text div.containercustom > p"
      ]
    }
  ]
};

const parsers = {
  'hero-home-mb': heroHomeMbParser,
  'tabs-workflow-mb': tabsWorkflowMbParser,
  'columns-mb': columnsMbParser,
  'embed-mb': embedMbParser,
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
