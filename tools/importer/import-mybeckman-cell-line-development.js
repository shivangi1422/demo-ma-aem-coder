/* eslint-disable */
/* global WebImporter */

import heroHomeMbParser from './parsers/hero-home-mb.js';
import tabsWorkflowMbParser from './parsers/tabs-workflow-mb.js';
import embedMbParser from './parsers/embed-mb.js';
import cardsGridProductsMbParser from './parsers/cards-grid-products-mb.js';
import columnsMbParser from './parsers/columns-mb.js';
import cardsGridPhotoMbParser from './parsers/cards-grid-photo-mb.js';
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
  "name": "mybeckman-cell-line-development",
  "urls": [
    "https://www.mybeckman.in/resources/methods/cell-line-development"
  ],
  "representativeUrl": "https://www.mybeckman.in/resources/methods/cell-line-development",
  "urlPattern": "/resources/methods/cell-line-development",
  "description": "Methods landing page (Sitecore bc-rich-text family): top-banner hero, intro, grey wf-row workflow stepper, centred Wistia player, application-note resource cards, \"watch a story\" GIF|text columns, related panels, trademark disclaimer, Marketo contact form (3797).",
  "blocks": [
    {
      "name": "hero-home-mb",
      "instances": [
        "div.top-banner"
      ]
    },
    {
      "name": "tabs-workflow-mb",
      "instances": [
        "div.workflow-container > div.wf-row"
      ]
    },
    {
      "name": "embed-mb",
      "instances": [
        "div.embeded-video__wrapper"
      ]
    },
    {
      "name": "cards-grid-products-mb",
      "instances": [
        "div.cards-row:has(div.badge-resources):not(div.cards-row + div.cards-row)"
      ]
    },
    {
      "name": "columns-mb",
      "instances": [
        "div.row:has(> div.column2)"
      ]
    },
    {
      "name": "cards-grid-photo-mb",
      "instances": [
        "div.row:has(> div.panel-wrapper)"
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
        "div.outimg:has(> div.top-banner)"
      ],
      "style": null,
      "blocks": [
        "hero-home-mb"
      ],
      "defaultContent": []
    },
    {
      "id": "intro",
      "name": "Automated Solutions for Cell Line Development",
      "selector": [
        "div.bc-rich-text > div:has(> h2 + p)"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        "div.bc-rich-text > div:has(> h2 + p) > h2",
        "div.bc-rich-text > div:has(> h2 + p) > p"
      ]
    },
    {
      "id": "workflow",
      "name": "Cell line development workflow stepper",
      "selector": [
        "div.workflow-section"
      ],
      "style": "highlight",
      "blocks": [
        "tabs-workflow-mb"
      ],
      "defaultContent": [
        "div.workflow-container > div:has(> a.primary-btn)"
      ]
    },
    {
      "id": "video",
      "name": "Learn More About Our Solutions (Wistia video)",
      "selector": [
        "div.bc-rich-text:has(+ div.embeded-video)"
      ],
      "style": "centered",
      "blocks": [
        "embed-mb"
      ],
      "defaultContent": [
        "div.bc-rich-text:has(+ div.embeded-video) h2.row"
      ]
    },
    {
      "id": "resources",
      "name": "Learn more with our resources",
      "selector": [
        "div.section-resources"
      ],
      "style": null,
      "blocks": [
        "cards-grid-products-mb"
      ],
      "defaultContent": [
        "div.section-resources > h2"
      ]
    },
    {
      "id": "story",
      "name": "Watch A Story (ExcellGene / Valita Titer)",
      "selector": [
        "div.bc-rich-text:has(> div.section-resources) + div.bc-rich-text"
      ],
      "style": null,
      "blocks": [
        "columns-mb"
      ],
      "defaultContent": [
        "div.bc-rich-text:has(> div.section-resources) + div.bc-rich-text h2.row"
      ]
    },
    {
      "id": "related",
      "name": "Related topic panels",
      "selector": [
        "div.row:has(> div.panel-wrapper)"
      ],
      "style": null,
      "blocks": [
        "cards-grid-photo-mb"
      ],
      "defaultContent": []
    },
    {
      "id": "disclaimer",
      "name": "Trademark disclaimer",
      "selector": [
        "section#disclaimer"
      ],
      "style": "centered",
      "blocks": [],
      "defaultContent": [
        "section#disclaimer > p"
      ]
    },
    {
      "id": "contact",
      "name": "Want To Bring Your Cell Line Development Workflow To The Next Level? (contact form)",
      "selector": [
        "section#anchor"
      ],
      "style": "highlight",
      "blocks": [
        "form-mb"
      ],
      "defaultContent": [
        "section#anchor > p.formtitle",
        "section#anchor > p.formtext"
      ]
    }
  ]
};

const parsers = {
  'hero-home-mb': heroHomeMbParser,
  'tabs-workflow-mb': tabsWorkflowMbParser,
  'embed-mb': embedMbParser,
  'cards-grid-products-mb': cardsGridProductsMbParser,
  'columns-mb': columnsMbParser,
  'cards-grid-photo-mb': cardsGridPhotoMbParser,
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
