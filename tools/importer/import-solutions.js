/* eslint-disable */
/* global WebImporter */

import heroLeftParser from './parsers/hero-left.js';
import cardsGridFeaturesParser from './parsers/cards-grid-features.js';
import cardsGridVideoParser from './parsers/cards-grid-video.js';
import tableGroupedParser from './parsers/table-grouped.js';
import columnsParser from './parsers/columns.js';
import cardsGridShowcaseParser from './parsers/cards-grid-showcase.js';
import carouselResourcesParser from './parsers/carousel-resources.js';
import cleanupTransformer from './transformers/beckmancoulter-cleanup.js';
import sectionsTransformer from './transformers/beckmancoulter-sections.js';
import solutionsCleanupTransformer from './transformers/beckmancoulter-solutions-cleanup.js';
import solutionsSectionsTransformer from './transformers/beckmancoulter-solutions-sections.js';

const PAGE_TEMPLATE = {
  "name": "solutions",
  "urls": [
    "https://www.beckmancoulter.com/en/solutions/host-response-infection"
  ],
  "representativeUrl": "https://www.beckmancoulter.com/en/solutions/host-response-infection",
  "description": "Solution landing pages: left-aligned hero, intro copy, grey feature band, video row, biomarker table, centered CTA bands, partner showcase over background image, education resources carousel, contact form.",
  "blocks": [
    {
      "name": "hero-left",
      "instances": [
        "div.large-header-banner"
      ]
    },
    {
      "name": "cards-grid-features",
      "instances": [
        "div.data-visualization-container"
      ]
    },
    {
      "name": "cards-grid-video",
      "instances": [
        "div.col-3-default-padding:has(.vidyard-player-container)",
        "div.three.column.grid.container:has([class*=\"vidyard\"])"
      ]
    },
    {
      "name": "table-grouped",
      "instances": [
        "#main-container div.page-content table"
      ]
    },
    {
      "name": "columns",
      "instances": [
        "div.adjustable-two-column-display"
      ]
    },
    {
      "name": "cards-grid-showcase",
      "instances": [
        "div.double-showcase-feature",
        "div.tripple-showcase-feature"
      ]
    },
    {
      "name": "carousel-resources",
      "instances": [
        "div.education-filter-carousel"
      ]
    }
  ],
  "urlPattern": "/en/solutions/*",
  "sections": [
    {
      "id": "hero",
      "name": "Host Response to Infection",
      "selector": [
        "div.large-header-banner"
      ],
      "style": null,
      "blocks": [
        "hero-left"
      ],
      "defaultContent": []
    },
    {
      "id": "intro",
      "name": "Decoding the Host Response to Infection",
      "selector": [
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.page-content:first-child"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        "h2",
        "p"
      ]
    },
    {
      "id": "infection",
      "name": "What Constitutes an Infection?",
      "selector": [
        "div.data-visualization-container"
      ],
      "style": "highlight",
      "blocks": [
        "cards-grid-features"
      ],
      "defaultContent": []
    },
    {
      "id": "story",
      "name": "The Host Response to Infection Tells a Powerful Story",
      "selector": [
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.page-content"
      ],
      "style": null,
      "blocks": [
        "cards-grid-video"
      ],
      "defaultContent": [
        "h2",
        "p"
      ]
    },
    {
      "id": "biomarkers",
      "name": "Advancing Diagnostic Biomarkers",
      "selector": [
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.page-content"
      ],
      "style": "centered",
      "blocks": [
        "table-grouped"
      ],
      "defaultContent": [
        "h2",
        "h3",
        "p"
      ]
    },
    {
      "id": "memed-cta",
      "name": "Powering the Testing You Need",
      "selector": [
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.intro-content"
      ],
      "style": "centered",
      "blocks": [],
      "defaultContent": [
        "h1",
        "p",
        "a.button"
      ]
    },
    {
      "id": "partnering",
      "name": "Partnering to Accelerate Clinical Research",
      "selector": [
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.page-content"
      ],
      "style": "divider, centered",
      "blocks": [
        "columns"
      ],
      "defaultContent": [
        "h2",
        "p"
      ]
    },
    {
      "id": "companies",
      "name": "Cepheid",
      "selector": [
        "div.double-showcase-feature"
      ],
      "style": null,
      "blocks": [
        "cards-grid-showcase"
      ],
      "defaultContent": []
    },
    {
      "id": "ecosystem",
      "name": "Turn to the Danaher Ecosystem",
      "selector": [
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.intro-content"
      ],
      "style": "centered",
      "blocks": [],
      "defaultContent": [
        "h1",
        "p"
      ]
    },
    {
      "id": "efficiency",
      "name": "Improved Diagnostic Efficiency",
      "selector": [
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.page-content"
      ],
      "style": "divider, centered",
      "blocks": [],
      "defaultContent": [
        "h2",
        "h3",
        "p"
      ]
    },
    {
      "id": "solutions",
      "name": "Innovative Biomarker Solutions",
      "selector": [
        "div.tripple-showcase-feature"
      ],
      "style": null,
      "blocks": [
        "cards-grid-showcase"
      ],
      "defaultContent": []
    },
    {
      "id": "resources",
      "name": "Educational Resources",
      "selector": [
        "div.education-filter-carousel"
      ],
      "style": null,
      "blocks": [
        "carousel-resources"
      ],
      "defaultContent": [
        "h2"
      ]
    },
    {
      "id": "contact",
      "name": "Speak to a Representative about MeMed BV",
      "selector": [
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.page-content"
      ],
      "style": "centered",
      "blocks": [],
      "defaultContent": [
        "h2"
      ]
    },
    {
      "id": "disclaimer",
      "name": "Job code",
      "selector": [
        "div.disclaimer-text"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        "p"
      ]
    }
  ]
};

const parsers = {
  'hero-left': heroLeftParser,
  'cards-grid-features': cardsGridFeaturesParser,
  'cards-grid-video': cardsGridVideoParser,
  'table-grouped': tableGroupedParser,
  'columns': columnsParser,
  'cards-grid-showcase': cardsGridShowcaseParser,
  'carousel-resources': carouselResourcesParser,
};

// every template's transformers are registered; each guards on PAGE_TEMPLATE.name.
// cleanup must run before sections within each template.
const transformers = [cleanupTransformer, sectionsTransformer, solutionsCleanupTransformer, solutionsSectionsTransformer];

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
