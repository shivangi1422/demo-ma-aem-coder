/* eslint-disable */
/* global WebImporter */

import columnsJumplinksParser from './parsers/columns-jumplinks.js';
import heroCenteredStripParser from './parsers/hero-centered-strip.js';
import cardsGridCalloutsParser from './parsers/cards-grid-callouts.js';
import columnsTextFirstParser from './parsers/columns-text-first.js';
import accordionParser from './parsers/accordion.js';
import cleanupTransformer from './transformers/mybeckman-cleanup.js';
import sectionsTransformer from './transformers/mybeckman-sections.js';

const PAGE_TEMPLATE = {
  "name": "resources-disease-research",
  "urls": [
    "https://www.mybeckman.in/resources/disease-research/leukemia-and-lymphoma"
  ],
  "representativeUrl": "https://www.mybeckman.in/resources/disease-research/leukemia-and-lymphoma",
  "description": "Disease research gateway page (Leukemia and Lymphoma): H1 + intro, sticky jump-link bar, contained strip banners per topic, bordered callout tile grids, text|infographic columns, expandable advantages (accordion), bordered workflow diagrams, references",
  "urlPattern": "/resources/disease-research/*",
  "blocks": [
    {
      "name": "columns-jumplinks",
      "instances": [
        ".bc-rich-text > .sticky"
      ]
    },
    {
      "name": "hero-centered-strip",
      "instances": [
        ".image_wrapper_vk"
      ]
    },
    {
      "name": "cards-grid-callouts",
      "instances": [
        ".product-series-callouts"
      ]
    },
    {
      "name": "columns-text-first",
      "instances": [
        ".bc-rich-text > .row:has(> [class*=\"col-md-6\"] .container-overlay-full-width)"
      ]
    },
    {
      "name": "accordion",
      "instances": [
        ".wrap-collabsible:not(.wrap-collabsible + .wrap-collabsible)"
      ]
    }
  ],
  "sections": [
    {
      "id": "section-1",
      "name": "Main content",
      "selector": [
        "#main > div.main-holder > div.container:nth-of-type(2)",
        "#main .main-holder"
      ],
      "style": null,
      "blocks": [
        "columns-jumplinks",
        "hero-centered-strip",
        "cards-grid-callouts",
        "columns-text-first",
        "accordion"
      ],
      "defaultContent": [
        "#content-holder > h1",
        "#content-holder > p",
        ".bc-rich-text > h3",
        ".bc-rich-text > p",
        ".bc-rich-text > ul",
        ".bc-rich-text > h2",
        ".bc-rich-text > ol",
        ".container-overlay-full-width > img"
      ]
    }
  ]
};

const parsers = {
  'columns-jumplinks': columnsJumplinksParser,
  'hero-centered-strip': heroCenteredStripParser,
  'cards-grid-callouts': cardsGridCalloutsParser,
  'columns-text-first': columnsTextFirstParser,
  'accordion': accordionParser,
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
    meta.template = 'disease-research';
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
