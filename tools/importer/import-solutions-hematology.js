/* eslint-disable */
/* global WebImporter */

import heroLeftVideoParser from './parsers/hero-left-video.js';
import embedVidyardParser from './parsers/embed-vidyard.js';
import quoteCustomerTestimonialParser from './parsers/quote-customer-testimonial.js';
import columnsParser from './parsers/columns.js';
import columnsHematologyParser from './parsers/columns-hematology.js';
import quotePhotoCarouselParser from './parsers/quote-photo-carousel.js';
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

const PAGE_TEMPLATE = {
  "name": "solutions-hematology",
  "description": "Solution story page: video hero, intro with inline Vidyard player, coloured testimonial bands, three pillar sections (heading, text+image columns, video+text columns, statement + button), testimonial slider, contact heading (Marketo form not migrated).",
  "urls": [
    "https://www.beckmancoulter.com/en/solutions/hematology-solution"
  ],
  "blocks": [
    {
      "name": "hero-left-video",
      "instances": [
        "div.video-hero-carousel"
      ]
    },
    {
      "name": "embed-vidyard",
      "instances": [
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.page-content p.VideoAdj"
      ]
    },
    {
      "name": "quote-customer-testimonial",
      "instances": [
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.customer-testimonial"
      ]
    },
    {
      "name": "columns",
      "instances": [
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.adjustable-two-column-display"
      ]
    },
    {
      "name": "columns-hematology",
      "instances": [
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.social-proof-section",
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.sublayout-two-column-dynamic"
      ]
    },
    {
      "name": "quote-photo-carousel",
      "instances": [
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.photo-hero-carousel"
      ]
    }
  ],
  "sections": [
    {
      "id": "section-1",
      "name": "Hero",
      "selector": [
        "div.video-hero-carousel"
      ],
      "style": null,
      "blocks": [
        "hero-left-video"
      ],
      "defaultContent": []
    },
    {
      "id": "section-2",
      "name": "Find more answers in a single blood draw",
      "selector": [
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.page-content:has(#WatchVideo)"
      ],
      "style": "centered",
      "blocks": [
        "embed-vidyard"
      ],
      "defaultContent": [
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.page-content:has(#WatchVideo)"
      ]
    },
    {
      "id": "section-3",
      "name": "Testimonial Joe Meyer",
      "selector": [
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.customer-testimonial:has(#Intel)"
      ],
      "style": null,
      "blocks": [
        "quote-customer-testimonial"
      ],
      "defaultContent": []
    },
    {
      "id": "section-4",
      "name": "Intelligent Efficiency",
      "selector": [
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.page-content"
      ],
      "style": "centered",
      "blocks": [
        "columns",
        "columns-hematology"
      ],
      "defaultContent": [
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.page-content",
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.intro-content"
      ]
    },
    {
      "id": "section-5",
      "name": "Testimonial John Waugh",
      "selector": [
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.customer-testimonial:has(#Clinical)"
      ],
      "style": null,
      "blocks": [
        "quote-customer-testimonial"
      ],
      "defaultContent": []
    },
    {
      "id": "section-6",
      "name": "Clinical Confidence",
      "selector": [
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.page-content"
      ],
      "style": "centered",
      "blocks": [
        "columns",
        "columns-hematology"
      ],
      "defaultContent": [
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.page-content",
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.intro-content"
      ]
    },
    {
      "id": "section-7",
      "name": "Testimonial Nima Sarani",
      "selector": [
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.customer-testimonial:has(#Adapt)"
      ],
      "style": null,
      "blocks": [
        "quote-customer-testimonial"
      ],
      "defaultContent": []
    },
    {
      "id": "section-8",
      "name": "Adaptive Collaboration",
      "selector": [
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.page-content"
      ],
      "style": "centered",
      "blocks": [
        "columns-hematology"
      ],
      "defaultContent": [
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.page-content",
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.intro-content"
      ]
    },
    {
      "id": "section-9",
      "name": "Testimonial slider",
      "selector": [
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.photo-hero-carousel"
      ],
      "style": null,
      "blocks": [
        "quote-photo-carousel"
      ],
      "defaultContent": []
    },
    {
      "id": "section-10",
      "name": "Let\u2019s talk digital hematology solutions",
      "selector": [
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.page-content"
      ],
      "style": "centered",
      "blocks": [],
      "defaultContent": [
        "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.page-content"
      ]
    }
  ]
};

const parsers = {
  'hero-left-video': heroLeftVideoParser,
  'embed-vidyard': embedVidyardParser,
  'quote-customer-testimonial': quoteCustomerTestimonialParser,
  columns: columnsParser,
  'columns-hematology': columnsHematologyParser,
  'quote-photo-carousel': quotePhotoCarouselParser,
};

// every template's transformers are registered; each guards on PAGE_TEMPLATE.name.
// cleanup must run before sections within each template.
const transformers = [cleanupTransformer, sectionsTransformer, solutionsCleanupTransformer, solutionsSectionsTransformer, dxsCleanupTransformer, dxsSectionsTransformer, productCleanupTransformer, productSectionsTransformer, hematologyCleanupTransformer, hematologySectionsTransformer];

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
    // author-requested page names that differ from the source URL
    const PATH_OVERRIDES = {
      '/en/solutions/hematology-solution': '/en/solutions/hematology-solution1',
    };
    const targetPath = PATH_OVERRIDES[rawPath] || rawPath;
    const path = WebImporter.FileUtils.sanitizePath(targetPath === '' ? '/index' : targetPath);

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }];
  },
};
