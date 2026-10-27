/* eslint-disable */
/* global WebImporter */

import tableStripedMbParser from './parsers/table-striped-mb.js';
import cardsGridAccentMbParser from './parsers/cards-grid-accent-mb.js';
import accordionToggleMbParser from './parsers/accordion-toggle-mb.js';
import accordionToggleOpenMbParser from './parsers/accordion-toggle-open-mb.js';
import columnsMbParser from './parsers/columns-mb.js';
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
  "name": "mybeckman-protein-production",
  "urls": [
    "https://www.mybeckman.in/resources/product-applications/process-development-manufacturing/protein-production"
  ],
  "representativeUrl": "https://www.mybeckman.in/resources/product-applications/process-development-manufacturing/protein-production",
  "urlPattern": "/resources/product-applications/process-development-manufacturing/protein-production",
  "description": "AEO article page (two-columns-holder article + sidebar): H1 + published date, Key Takeaways and at-a-glance callouts, expression-host table, benefit and related-topic card grids, View References details, always-open FAQ, sidebar with author box and Marketo \"Talk to an Expert\" form (1024).",
  "blocks": [
    {
      "name": "table-striped-mb",
      "instances": [
        "div.table-wrapper"
      ]
    },
    {
      "name": "cards-grid-accent-mb",
      "instances": [
        "div.benefits-grid",
        "section.related-cleanroom-topics"
      ]
    },
    {
      "name": "accordion-toggle-mb",
      "instances": [
        "details.references-details"
      ]
    },
    {
      "name": "accordion-toggle-open-mb",
      "instances": [
        "div.bcls-aeo-faq:not(div.bcls-aeo-faq + div.bcls-aeo-faq)"
      ]
    },
    {
      "name": "columns-mb",
      "instances": [
        "div.bcls-aeo-author__card"
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
      "id": "intro",
      "name": "Article title, published date and intro",
      "selector": [
        "#content-holder"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        "#content-holder > h1",
        "#content-holder div.bcls-aeo-published > p",
        "div.cleanroom-content-block > p:first-child"
      ]
    },
    {
      "id": "key-takeaways",
      "name": "Key Takeaways callout box",
      "selector": [
        "div.summary-box"
      ],
      "style": "callout",
      "blocks": [],
      "defaultContent": [
        "div.summary-box > h2",
        "div.summary-box > ul"
      ]
    },
    {
      "id": "recombinant",
      "name": "Why it matters / What is recombinant protein production + expression host table",
      "selector": [
        "div.summary-box + h2"
      ],
      "style": null,
      "blocks": [
        "table-striped-mb"
      ],
      "defaultContent": [
        "div.cleanroom-content-block > h2:nth-of-type(1)",
        "div.cleanroom-content-block > p:nth-of-type(2)",
        "div.cleanroom-content-block > h2:nth-of-type(2)",
        "div.cleanroom-content-block > p:nth-of-type(3)",
        "div.cleanroom-content-block > p:nth-of-type(4)",
        "div.table-wrapper + p"
      ]
    },
    {
      "id": "at-a-glance",
      "name": "Protein production at a glance callout",
      "selector": [
        "div.process-flow"
      ],
      "style": "callout",
      "blocks": [],
      "defaultContent": [
        "div.process-flow > strong",
        "div.process-flow > p"
      ]
    },
    {
      "id": "benefits",
      "name": "Benefits of Scalable Protein Production Systems + advantages cards",
      "selector": [
        "div.process-flow + h2"
      ],
      "style": null,
      "blocks": [
        "cards-grid-accent-mb"
      ],
      "defaultContent": [
        "div.process-flow + h2",
        "div.process-flow + h2 + p",
        "div.cleanroom-content-block > h3"
      ]
    },
    {
      "id": "references",
      "name": "View References collapsible",
      "selector": [
        "details.references-details"
      ],
      "style": null,
      "blocks": [
        "accordion-toggle-mb"
      ],
      "defaultContent": []
    },
    {
      "id": "related-topics",
      "name": "Explore Related Protein Production Topics",
      "selector": [
        "details.references-details + h2"
      ],
      "style": null,
      "blocks": [
        "cards-grid-accent-mb"
      ],
      "defaultContent": [
        "details.references-details + h2",
        "details.references-details + h2 + p"
      ]
    },
    {
      "id": "faq",
      "name": "FAQ on Protein Production Workflow and Process",
      "selector": [
        "div.bcls-aeo-faqs"
      ],
      "style": null,
      "blocks": [
        "accordion-toggle-open-mb"
      ],
      "defaultContent": [
        "div.bcls-aeo-faqs > h2"
      ]
    },
    {
      "id": "sidebar",
      "name": "Sidebar: author box + Talk to an Expert form",
      "selector": [
        "div.two-columns-holder__right > div.bcls-aeo-author",
        "div.two-columns-holder__right"
      ],
      "style": "sidebar",
      "blocks": [
        "columns-mb",
        "form-mb"
      ],
      "defaultContent": [
        "div.bcls-aeo-author__bio > h6",
        "div.bcls-aeo-author__bio > p",
        "div.two-columns-holder__right > div.bc-rich-text > h3"
      ]
    }
  ]
};

const parsers = {
  'table-striped-mb': tableStripedMbParser,
  'cards-grid-accent-mb': cardsGridAccentMbParser,
  'accordion-toggle-mb': accordionToggleMbParser,
  'accordion-toggle-open-mb': accordionToggleOpenMbParser,
  'columns-mb': columnsMbParser,
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
