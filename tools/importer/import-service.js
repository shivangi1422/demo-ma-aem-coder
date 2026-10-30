/* eslint-disable */
/* global WebImporter */

import heroCenteredParser from './parsers/hero-centered.js';
import cardsStatsParser from './parsers/cards-stats.js';
import cardsGridParser from './parsers/cards-grid.js';
import columnsCtaParser from './parsers/columns-cta.js';
import cleanupTransformer from './transformers/mybeckman-cleanup.js';
import sectionsTransformer from './transformers/mybeckman-sections.js';

const PAGE_TEMPLATE = {
  name: 'service',
  urls: [
    'https://www.mybeckman.in/service',
  ],
  representativeUrl: 'https://www.mybeckman.in/service',
  description: 'Service landing page: photo hero, blue stats band, service offering cards and a blue Get in Touch contact band',
  urlPattern: '/*',
  blocks: [
    {
      name: 'hero-centered',
      instances: ['.bc-rich-text > .hero', 'div.hero'],
    },
    {
      name: 'cards-stats',
      instances: ['.Section--blue .Section__intro', '.Section__intro'],
    },
    {
      name: 'cards-grid',
      instances: ['.Section .ServiceCards', '.ServiceCards'],
    },
    {
      name: 'columns-cta',
      instances: ['#getInTouch .Contact__body', '.Contact .Contact__body'],
    },
  ],
  sections: [
    {
      id: 'section-1',
      name: 'Hero',
      selector: ['.bc-rich-text:has(> .hero)', 'div.hero'],
      style: null,
      blocks: ['hero-centered'],
      defaultContent: [],
    },
    {
      id: 'section-2',
      name: 'Service stats',
      selector: ['.Section--blue:has(.Section__intro)', '.bc-rich-text:has(.Section__intro)'],
      style: 'blue',
      blocks: ['cards-stats'],
      defaultContent: [],
    },
    {
      id: 'section-3',
      name: 'Service offerings',
      selector: ['.bc-rich-text:has(.ServiceCards)', '.Section:has(> .ServiceCards)'],
      style: null,
      blocks: ['cards-grid'],
      defaultContent: [],
    },
    {
      id: 'section-4',
      name: 'Get in Touch',
      selector: ['#getInTouch', '.Section--blue:has(.Contact)'],
      style: 'blue, centered',
      blocks: ['columns-cta'],
      defaultContent: ['#getInTouch .Contact > h2', '#getInTouch .Contact > p'],
    },
  ],
};

const parsers = {
  'hero-centered': heroCenteredParser,
  'cards-stats': cardsStatsParser,
  'cards-grid': cardsGridParser,
  'columns-cta': columnsCtaParser,
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
