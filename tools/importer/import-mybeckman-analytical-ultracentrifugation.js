/* eslint-disable */
/* global WebImporter */

import heroHomeMbParser from './parsers/hero-home-mb.js';
import embedMbParser from './parsers/embed-mb.js';
import columnsMbParser from './parsers/columns-mb.js';
import cardsGridPhotoMbParser from './parsers/cards-grid-photo-mb.js';
import cardsGridProductsMbParser from './parsers/cards-grid-products-mb.js';
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
  "name": "mybeckman-analytical-ultracentrifugation",
  "urls": [
    "https://www.mybeckman.in/resources/technologies/analytical-ultracentrifugation"
  ],
  "representativeUrl": "https://www.mybeckman.in/resources/technologies/analytical-ultracentrifugation",
  "urlPattern": "/resources/technologies/analytical-ultracentrifugation",
  "description": "Technology landing page (Sitecore bc-rich-text family): dark-overlay top-banner hero, quick-nav jump buttons, introduction, Wistia intro video, benefits and methods text|photo columns, grey applications band with photo cards, resource cards, testimonial Wistia player, related panels, Marketo contact form (3101).",
  "blocks": [
    {
      "name": "hero-home-mb",
      "instances": [
        "div.top-banner"
      ]
    },
    {
      "name": "embed-mb",
      "instances": [
        "div.embeded-video__wrapper"
      ]
    },
    {
      "name": "columns-mb",
      "instances": [
        "#benefits > div.copy.row",
        "#methods > div.copy.row"
      ]
    },
    {
      "name": "cards-grid-photo-mb",
      "instances": [
        "#applications div.cards-row",
        "div.col-md-12.text-center + div.row:has(> div.panel-wrapper)"
      ]
    },
    {
      "name": "cards-grid-products-mb",
      "instances": [
        "div.cards-row:has(div.badge-resources)"
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
      "name": "Top photo banner (AUC)",
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
      "id": "jump-nav",
      "name": "Contents jump links",
      "selector": [
        "#quick-nav"
      ],
      "style": "jump-links, accent-headings",
      "blocks": [],
      "defaultContent": [
        "#quick-nav > h2",
        "#quick-nav > div.quick-nav-row"
      ]
    },
    {
      "id": "introduction",
      "name": "Introduction",
      "selector": [
        "#introduction"
      ],
      "style": "accent-headings",
      "blocks": [],
      "defaultContent": [
        "#introduction > h2",
        "#introduction > p",
        "#introduction > a.primary-btn"
      ]
    },
    {
      "id": "intro-video",
      "name": "Introduction to AUC video",
      "selector": [
        "div.bc-rich-text:has(#quick-nav) + div.embeded-video"
      ],
      "style": "divider",
      "blocks": [
        "embed-mb"
      ],
      "defaultContent": []
    },
    {
      "id": "benefits",
      "name": "Key Benefits of AUC",
      "selector": [
        "#benefits"
      ],
      "style": "divider, accent-headings",
      "blocks": [
        "columns-mb"
      ],
      "defaultContent": []
    },
    {
      "id": "applications",
      "name": "Applications of Analytical Ultracentrifugation",
      "selector": [
        "#applications"
      ],
      "style": "highlight, accent-headings",
      "blocks": [
        "cards-grid-photo-mb"
      ],
      "defaultContent": [
        "#applications > div.copy > h2",
        "#applications > div.copy > p",
        "#applications > div.copy > a.primary-btn"
      ]
    },
    {
      "id": "methods",
      "name": "Optima AUC: Multiple Methods in One + SV / SE / DGE methods",
      "selector": [
        "#methods"
      ],
      "style": "accent-headings",
      "blocks": [
        "columns-mb",
        "cards-grid-products-mb"
      ],
      "defaultContent": [
        "#methods > div.copy:not(.row) > h2",
        "#methods > div.copy:not(.row) > p",
        "#methods div.cards-row:has(> a.resources-no-img)"
      ]
    },
    {
      "id": "testimonial",
      "name": "Testimonial video",
      "selector": [
        "div.bc-rich-text:has(#methods) + div.embeded-video"
      ],
      "style": "centered, accent-headings",
      "blocks": [
        "embed-mb"
      ],
      "defaultContent": [
        "div.bc-rich-text:has(#methods) + div.embeded-video > h2",
        "div.bc-rich-text:has(#methods) + div.embeded-video > p.embeded-video__caption"
      ]
    },
    {
      "id": "related",
      "name": "Related Content",
      "selector": [
        "div.col-md-12.text-center:has(> h3)"
      ],
      "style": "centered",
      "blocks": [
        "cards-grid-photo-mb"
      ],
      "defaultContent": [
        "div.col-md-12.text-center > h3"
      ]
    },
    {
      "id": "contact",
      "name": "Talk to an Expert on Analytical Ultracentrifugation (contact form)",
      "selector": [
        "div.bc-rich-text:has(> #anchor)"
      ],
      "style": "highlight, centered",
      "blocks": [
        "form-mb"
      ],
      "defaultContent": [
        "#anchor > p.formtitle",
        "#anchor > p.formtext"
      ]
    }
  ]
};

const parsers = {
  'hero-home-mb': heroHomeMbParser,
  'embed-mb': embedMbParser,
  'columns-mb': columnsMbParser,
  'cards-grid-photo-mb': cardsGridPhotoMbParser,
  'cards-grid-products-mb': cardsGridProductsMbParser,
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
