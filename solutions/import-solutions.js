/* eslint-disable */
/* global WebImporter */

import heroHomeParser from './parsers/hero-home.js';
import formRequestMarketoParser from './parsers/form-request-marketo.js';
import columnsTextParser from './parsers/columns-text.js';
import columnsCtaParser from './parsers/columns-cta.js';
import columnsMediaParser from './parsers/columns-media.js';
import contentReversedStoryParser from './parsers/content-reversed-story.js';
import quoteTestimonialParser from './parsers/quote-testimonial.js';
import carouselTestimonialParser from './parsers/carousel-testimonial.js';
import beckmancoulterCleanupTransformer from './transformers/beckmancoulter-cleanup.js';
import beckmancoulterSectionsTransformer from './transformers/beckmancoulter-sections.js';

const PAGE_TEMPLATE = {
  "name": "solutions",
  "urls": [
    "https://www.beckmancoulter.com/en/solutions/hematology-solution"
  ],
  "representativeUrl": "https://www.beckmancoulter.com/en/solutions/hematology-solution",
  "description": "Beckman Coulter solution story page (hematology solution)",
  "urlPattern": "/en/solutions/*",
  "blocks": [
    {
      "name": "hero-home",
      "instances": [
        "#main-container > .sublayout.ui.aligned > .video-hero-carousel"
      ]
    },
    {
      "name": "form-request-marketo",
      "instances": [
        "#main-container > .sublayout.stackable > form.mktoForm"
      ]
    },
    {
      "name": "columns-text",
      "instances": [
        "#main-container > .sublayout.stackable > .page-content.nested-padding"
      ]
    },
    {
      "name": "columns-cta",
      "instances": [
        "#main-container > .sublayout.stackable > .intro-content"
      ]
    },
    {
      "name": "columns-media",
      "instances": [
        "#main-container > .sublayout.stackable > .adjustable-two-column-display",
        "#main-container > .sublayout.stackable > .sublayout-two-column-dynamic"
      ]
    },
    {
      "name": "content-reversed-story",
      "instances": [
        "#main-container > .sublayout.stackable > .social-proof-section"
      ]
    },
    {
      "name": "quote-testimonial",
      "instances": [
        "#main-container > .sublayout.stackable > .customer-testimonial"
      ]
    },
    {
      "name": "carousel-testimonial",
      "instances": [
        "#main-container > .sublayout.stackable > .photo-hero-carousel"
      ]
    }
  ],
  "sections": [
    {
      "id": "1",
      "name": "Video Hero",
      "selector": [
        "#main-container > .sublayout.ui.aligned > .video-hero-carousel"
      ],
      "style": null,
      "blocks": [
        "hero-home"
      ],
      "defaultContent": []
    },
    {
      "id": "2",
      "name": "Body (each non-empty child of the body wrapper is its own section; the form heading joins the form)",
      "selector": [
        "#main-container > .sublayout.stackable > *"
      ],
      "style": null,
      "blocks": [
        "form-request-marketo",
        "columns-text",
        "columns-cta",
        "columns-media",
        "content-reversed-story",
        "quote-testimonial",
        "carousel-testimonial"
      ],
      "defaultContent": []
    }
  ]
};

const parsers = {
  'hero-home': heroHomeParser,
  'form-request-marketo': formRequestMarketoParser,
  'columns-text': columnsTextParser,
  'columns-cta': columnsCtaParser,
  'columns-media': columnsMediaParser,
  'content-reversed-story': contentReversedStoryParser,
  'quote-testimonial': quoteTestimonialParser,
  'carousel-testimonial': carouselTestimonialParser,
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
