/* eslint-disable */
/* global WebImporter */

import heroGradientParser from './parsers/hero-gradient.js';
import columnsTextParser from './parsers/columns-text.js';
import columnsMediaParser from './parsers/columns-media.js';
import contentReversedStoryParser from './parsers/content-reversed-story.js';
import quoteTestimonialParser from './parsers/quote-testimonial.js';
import columnsTagsParser from './parsers/columns-tags.js';
import columnsAuthorParser from './parsers/columns-author.js';
import cardsGridProductlinesParser from './parsers/cards-grid-productlines.js';
import beckmancoulterCleanupTransformer from './transformers/beckmancoulter-cleanup.js';
import beckmancoulterSectionsTransformer from './transformers/beckmancoulter-sections.js';

const PAGE_TEMPLATE = {
  "name": "blog",
  "urls": [
    "https://www.beckmancoulter.com/en/blog/diagnostics/modernize-sti-diagnostics-and-surveillance",
    "https://www.beckmancoulter.com/en/blog/diagnostics/three-advantages-of-advantaged-workflows-at-nhls-sebokeng",
    "https://www.beckmancoulter.com/en/blog/diagnostics/the-silent-epidemic-of-hepatitis-c-virus",
    "https://www.beckmancoulter.com/en/blog/diagnostics/when-efficiency-meets-clinical-excellence"
  ],
  "representativeUrl": "https://www.beckmancoulter.com/en/blog/diagnostics/when-efficiency-meets-clinical-excellence",
  "description": "Beckman Coulter diagnostics blog article (variable body sections)",
  "urlPattern": "/en/blog/diagnostics/*",
  "blocks": [
    {
      "name": "hero-gradient",
      "instances": [
        "#main-container > .sublayout.ui.aligned.segment.grid > .blog-post-header"
      ]
    },
    {
      "name": "columns-text",
      "instances": [
        "#main-container > .sublayout.ui.one.column.stackable.grid.container > .page-content.nested-padding",
        "#main-container > .sublayout.ui.one.column.stackable.grid.container > .disclaimer-text",
        "#main-container > .sublayout.ui.one.column.stackable.grid.container > .product-ordering.stand-alone"
      ]
    },
    {
      "name": "columns-media",
      "instances": [
        "#main-container > .sublayout.ui.one.column.stackable.grid.container > .sublayout-two-column-dynamic",
        "#main-container > .sublayout.ui.one.column.stackable.grid.container > .adjustable-two-column-display"
      ]
    },
    {
      "name": "content-reversed-story",
      "instances": [
        "#main-container > .sublayout.ui.one.column.stackable.grid.container > .social-proof-section",
        "#main-container > .sublayout.ui.one.column.stackable.grid.container > .media-showcase-simple"
      ]
    },
    {
      "name": "quote-testimonial",
      "instances": [
        "#main-container > .sublayout.ui.one.column.stackable.grid.container > .customer-testimonial"
      ]
    },
    {
      "name": "columns-tags",
      "instances": [
        "#main-container > .sublayout.ui.one.column.stackable.grid.container > .blog-post-tag-list"
      ]
    },
    {
      "name": "columns-author",
      "instances": [
        "#main-container > .sublayout.ui.one.column.stackable.grid.container > .contributor-detail.summary"
      ]
    },
    {
      "name": "cards-grid-productlines",
      "instances": [
        "#main-container > .sublayout.ui.aligned.segment.grid.light-gray > .blog-post-list"
      ]
    }
  ],
  "sections": [
    {
      "id": "1",
      "name": "Blog Header",
      "selector": [
        "#main-container > .sublayout.ui.aligned.segment.grid > .blog-post-header"
      ],
      "style": null,
      "blocks": [
        "hero-gradient"
      ],
      "defaultContent": []
    },
    {
      "id": "2",
      "name": "Body (each non-empty child of the body wrapper is its own section)",
      "selector": [
        "#main-container > .sublayout.ui.one.column.stackable.grid.container > *"
      ],
      "style": null,
      "blocks": [
        "columns-text",
        "columns-media",
        "content-reversed-story",
        "quote-testimonial",
        "columns-tags",
        "columns-author"
      ],
      "defaultContent": []
    },
    {
      "id": "3",
      "name": "Related / Featured Articles",
      "selector": [
        "#main-container > .sublayout.ui.aligned.segment.grid.light-gray > .blog-post-list"
      ],
      "style": null,
      "blocks": [
        "cards-grid-productlines"
      ],
      "defaultContent": []
    }
  ]
};

const parsers = {
  'hero-gradient': heroGradientParser,
  'columns-text': columnsTextParser,
  'columns-media': columnsMediaParser,
  'content-reversed-story': contentReversedStoryParser,
  'quote-testimonial': quoteTestimonialParser,
  'columns-tags': columnsTagsParser,
  'columns-author': columnsAuthorParser,
  'cards-grid-productlines': cardsGridProductlinesParser,
};

const transformers = [
  beckmancoulterCleanupTransformer,
  beckmancoulterSectionsTransformer,
];

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

    // Blog tags become page keywords (read before cleanup/parsing changes the DOM).
    const tags = [...document.querySelectorAll('.blog-post-tag-list a')]
      .map((a) => a.textContent.trim()).filter((tag) => tag && !/^share$/i.test(tag));

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
    const meta = WebImporter.Blocks.getMetadata(document);
    if (tags.length) meta.keywords = [...new Set(tags)].join(', ');
    if (Object.keys(meta).length) main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
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
