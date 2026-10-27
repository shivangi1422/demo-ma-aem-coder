/* eslint-disable */
/* global WebImporter */

import heroHomeMbParser from './parsers/hero-home-mb.js';
import cardsGridVideoMbParser from './parsers/cards-grid-video-mb.js';
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
  "name": "mybeckman-monoclonal-antibodies",
  "urls": [
    "https://www.mybeckman.in/resources/disease-research/monoclonal-antibodies"
  ],
  "representativeUrl": "https://www.mybeckman.in/resources/disease-research/monoclonal-antibodies",
  "urlPattern": "/resources/disease-research/monoclonal-antibodies",
  "description": "Disease-research landing page (Sitecore bc-rich-text family): top-banner hero, intro, grey mission band, Wistia channel video gallery, related-content panels, application-note resource cards, Marketo contact form (3797), references.",
  "blocks": [
    {
      "name": "hero-home-mb",
      "instances": [
        "div.top-banner"
      ]
    },
    {
      "name": "cards-grid-video-mb",
      "instances": [
        "div.wistia_channel"
      ]
    },
    {
      "name": "cards-grid-photo-mb",
      "instances": [
        "div.row:has(> div.panel-wrapper)"
      ]
    },
    {
      "name": "cards-grid-products-mb",
      "instances": [
        "div.cards-row:has(div.badge-resources):not(div.cards-row + div.cards-row)"
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
      "name": "Intro",
      "selector": [
        "div.bc-rich-text > div:has(> h1)"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        "div.bc-rich-text > div:has(> h1) > h1",
        "div.bc-rich-text > div:has(> h1) > p",
        "div.bc-rich-text > div:has(> h1) > a.primary-btn"
      ]
    },
    {
      "id": "mission",
      "name": "The Mission",
      "selector": [
        "div.bc-rich-text > div.row:has(a.primary-btn)"
      ],
      "style": "highlight",
      "blocks": [],
      "defaultContent": [
        "div.bc-rich-text > div.row:has(a.primary-btn) > div > div > p",
        "div.bc-rich-text > div.row:has(a.primary-btn) div.container-overlay-full-width > img",
        "div.bc-rich-text > div.row:has(a.primary-btn) a.primary-btn"
      ]
    },
    {
      "id": "videos",
      "name": "Wistia video gallery",
      "selector": [
        "div.bc-rich-text > div:has(> div.wistia_channel)"
      ],
      "style": null,
      "blocks": [
        "cards-grid-video-mb"
      ],
      "defaultContent": []
    },
    {
      "id": "related",
      "name": "Related Content",
      "selector": [
        "div.col-md-12.text-center:has(> h3)"
      ],
      "style": null,
      "blocks": [
        "cards-grid-photo-mb"
      ],
      "defaultContent": [
        "div.col-md-12.text-center > h3"
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
      "id": "contact",
      "name": "Our Team is Ready to Help (contact form)",
      "selector": [
        "div.bc-rich-text:has(> #anchor)"
      ],
      "style": "highlight",
      "blocks": [
        "form-mb"
      ],
      "defaultContent": [
        "#anchor > p.formtitle",
        "#anchor > p.formtext"
      ]
    },
    {
      "id": "references",
      "name": "References",
      "selector": [
        "div.bc-rich-text:has(h2 + h5)"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        "div.bc-rich-text div:has(> h2 + h5) > h2",
        "div.bc-rich-text div:has(> h2 + h5) > h5"
      ]
    }
  ]
};

const parsers = {
  'hero-home-mb': heroHomeMbParser,
  'cards-grid-video-mb': cardsGridVideoMbParser,
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
