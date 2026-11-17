/* eslint-disable */
/* global WebImporter */

import heroCenteredBannerParser from './parsers/hero-centered-banner.js';
import columnsWideFirstParser from './parsers/columns-wide-first.js';
import tabsWorkflowParser from './parsers/tabs-workflow.js';
import accordionTwoColumnParser from './parsers/accordion-two-column.js';
import cardsGridVideosParser from './parsers/cards-grid-videos.js';
import columnsMediaWideParser from './parsers/columns-media-wide.js';
import marketoFormCompactParser from './parsers/marketo-form-compact.js';
import cleanupTransformer from './transformers/mybeckman-cleanup.js';
import sectionsTransformer from './transformers/mybeckman-sections.js';

const PAGE_TEMPLATE = {
  "name": "resources-industries",
  "urls": [
    "https://www.mybeckman.in/resources/industries/synthetic-biology"
  ],
  "representativeUrl": "https://www.mybeckman.in/resources/industries/synthetic-biology",
  "description": "Industry landing page (Synthetic Biology): full-width banner with centered title, intro text|graphic, interactive workflow (stages, steps, highlighted products), two-column featured-resources accordion, Wistia video gallery, testimonial video + spotlight download, grey contact form band, footnote",
  "urlPattern": "/resources/industries/*",
  "blocks": [
    {
      "name": "hero-centered-banner",
      "instances": [
        ".bc-rich-text > .outimg:has(#topbannertext)"
      ]
    },
    {
      "name": "columns-wide-first",
      "instances": [
        ".intro:has(> .intro-text):has(> .intro-image)"
      ]
    },
    {
      "name": "tabs-workflow",
      "instances": [
        ".tab-scroll"
      ]
    },
    {
      "name": "accordion-two-column",
      "instances": [
        ".row:has(> [class*=\"col-sm-6\"] > .accordion)"
      ]
    },
    {
      "name": "cards-grid-videos",
      "instances": [
        ".wistia_channel"
      ]
    },
    {
      "name": "columns-media-wide",
      "instances": [
        ".row:has(> .col-md-8 wistia-player):has(> .col-md-3)"
      ]
    },
    {
      "name": "marketo-form-compact",
      "instances": [
        "#main .formassembly-container.marketo-two-column"
      ]
    }
  ],
  "sections": [
    {
      "id": "section-1",
      "name": "Banner",
      "selector": [
        ".bc-rich-text:has(> .outimg)"
      ],
      "style": null,
      "blocks": [
        "hero-centered-banner"
      ],
      "defaultContent": []
    },
    {
      "id": "section-2",
      "name": "Intro",
      "selector": [
        ".bc-rich-text:has(.intro)"
      ],
      "style": null,
      "blocks": [
        "columns-wide-first"
      ],
      "defaultContent": []
    },
    {
      "id": "section-3",
      "name": "Interactive workflow",
      "selector": [
        ".bc-rich-text:has(.tab-scroll)"
      ],
      "style": null,
      "blocks": [
        "tabs-workflow"
      ],
      "defaultContent": [
        ".containercustom > h2",
        ".containercustom > p",
        ".containercustom > div > a.btn"
      ]
    },
    {
      "id": "section-4",
      "name": "Featured resources",
      "selector": [
        ".bc-rich-text:has(.accordion)"
      ],
      "style": null,
      "blocks": [
        "accordion-two-column"
      ],
      "defaultContent": [
        ".containercustom > h2"
      ]
    },
    {
      "id": "section-5",
      "name": "Video gallery",
      "selector": [
        ".bc-rich-text:has(.wistia_channel)"
      ],
      "style": null,
      "blocks": [
        "cards-grid-videos"
      ],
      "defaultContent": [
        ".containercustom > h2"
      ]
    },
    {
      "id": "section-6",
      "name": "Customer testimonial",
      "selector": [
        ".bc-rich-text:has(.col-md-8)"
      ],
      "style": null,
      "blocks": [
        "columns-media-wide"
      ],
      "defaultContent": [
        ".containercustom > h2"
      ]
    },
    {
      "id": "section-7",
      "name": "Contact form",
      "selector": [
        "#form",
        ".bc-rich-text:has(> a[name=\"form\"])",
        ".bc-rich-text:has(+ .formassembly-container)"
      ],
      "style": "grey",
      "blocks": [
        "marketo-form-compact"
      ],
      "defaultContent": [
        ".containercustom > h2",
        ".containercustom > p"
      ],
      "anchor": "form"
    },
    {
      "id": "section-8",
      "name": "Footnote",
      "selector": [
        ".formassembly-container + .bc-rich-text"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        ".containercustom > p"
      ]
    }
  ]
};

const parsers = {
  'hero-centered-banner': heroCenteredBannerParser,
  'columns-wide-first': columnsWideFirstParser,
  'tabs-workflow': tabsWorkflowParser,
  'accordion-two-column': accordionTwoColumnParser,
  'cards-grid-videos': cardsGridVideosParser,
  'columns-media-wide': columnsMediaWideParser,
  'marketo-form-compact': marketoFormCompactParser,
};

const transformers = [cleanupTransformer, sectionsTransformer];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((fn) => {
    try { fn(hookName, element, enhancedPayload); } catch (e) { console.error(`Transformer failed at ${hookName}:`, e); }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const seen = new Set();
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        if (seen.has(element)) return;
        seen.add(element);
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    executeTransformers('beforeTransform', main, payload);

    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (!parser) return;
      try { parser(block.element, { document, url, params }); } catch (e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); }
    });

    executeTransformers('afterTransform', main, payload);

    main.appendChild(document.createElement('hr'));
    // page metadata from the head, plus the flag that turns on the URL-based breadcrumb
    const meta = WebImporter.Blocks.getMetadata(document);
    meta.breadcrumbs = 'true';
    meta.template = 'industries';
    main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
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
