/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroParser from './parsers/hero.js';
import cardsGridParser from './parsers/cards-grid.js';
import columnsParser from './parsers/columns.js';
import contentReversedParser from './parsers/content-reversed.js';
import quoteParser from './parsers/quote.js';
import formRequestParser from './parsers/form-request.js';
import tabsProductsParser from './parsers/tabs-products.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/beckmancoulter-cleanup.js';
import sectionsTransformer from './transformers/beckmancoulter-sections.js';

// PARSER REGISTRY
const parsers = {
  hero: heroParser,
  'cards-grid': cardsGridParser,
  columns: columnsParser,
  'content-reversed': contentReversedParser,
  quote: quoteParser,
  'form-request': formRequestParser,
  'tabs-products': tabsProductsParser,
};

// Section selectors (DOM-verified from the dxs-service-and-supports page).
// Hero sits in the breadcrumb+hero segment; main content lives under one wrapper.
const HERO_SEG = '#main-container > div.sublayout.ui.aligned.segment.grid:nth-of-type(1)';
const MC = '#main-container > div.sublayout.ui.one.column.stackable.grid.container';

const S1 = `${HERO_SEG} > div.video-hero-carousel`;                    // hero
const S2 = `${MC} > div.data-visualization-container`;                 // cards-grid (solutions) — stat cards
const S3 = `${MC} > div.media-showcase-simple`;                        // content-reversed — video promo
const S4 = `${MC} > div.page-content.nested-padding:nth-of-type(4)`;   // columns — "Service Solutions…" heading
const S5 = `${MC} > div.related-products:nth-of-type(5)`;              // cards-grid (productlines) — service cards
const S6 = `${MC} > div.related-products:nth-of-type(6)`;              // cards-grid (productlines) — service cards
const S7 = `${MC} > div.testimonial-slim`;                            // quote — testimonial band
const S8 = `${MC} > div.education-filter-carousel`;                    // tabs-products — Articles and Stories (filter tabs)
const S9 = '#main-container > form';                                   // form-request — Marketo contact form
const S10 = '#main-container > div.wysiwyg-content.gtm-page-body-link'; // columns — disclaimer

const PAGE_TEMPLATE = {
  name: 'dxs-service-and-supports',
  description: 'Beckman Coulter product page — DxS Service and Support',
  urls: ['https://www.beckmancoulter.com/en/products/dxs-service-and-supports'],
  blocks: [
    { name: 'hero', instances: [S1] },
    { name: 'cards-grid', instances: [S2, S5, S6] },
    { name: 'content-reversed', instances: [S3] },
    { name: 'columns', instances: [S10] },
    { name: 'quote', instances: [S7] },
    { name: 'tabs-products', instances: [S8] },
    { name: 'form-request', instances: [S9] },
  ],
  sections: [
    { id: '1', selector: S1, style: null },
    { id: '2', selector: S2, style: null },
    { id: '3', selector: S3, style: 'light-gray' },
    { id: '5', selector: S5, style: null },
    { id: '6', selector: S6, style: null },
    { id: '7', selector: S7, style: null },
    { id: '8', selector: S8, style: null },
    { id: '9', selector: S9, style: null },
    { id: '10', selector: S10, style: null },
  ],
};

const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      elements.forEach((element) => {
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const {
      document, url, params,
    } = payload;
    const main = document.body;

    executeTransformers('beforeTransform', main, payload);

    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    executeTransformers('afterTransform', main, payload);

    const hr = document.createElement('hr');
    main.appendChild(hr);
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
