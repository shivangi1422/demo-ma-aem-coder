/* eslint-disable */
/* global WebImporter */

import heroBannerParser from './parsers/hero-banner.js';
import cardsStatsParser from './parsers/cards-stats.js';
import columnsActionsParser from './parsers/columns-actions.js';
import cardsIconParser from './parsers/cards-icon.js';
import mybeckmanServicePrepareTransformer from './transformers/mybeckman-service-prepare.js';
import mybeckmanCleanupTransformer from './transformers/mybeckman-cleanup.js';
import mybeckmanServiceSectionsTransformer from './transformers/mybeckman-service-sections.js';
import mybeckmanSectionsTransformer from './transformers/mybeckman-sections.js';

const PAGE_TEMPLATE = {
  "name": "service-landing",
  "description": "Landing page: full-width hero with text on photo and CTA, blue stats band, grid of icon cards, blue contact band with three action buttons",
  "urls": [
    "https://www.mybeckman.in/service"
  ],
  "pageTemplate": "service-landing",
  "blocks": [
    {
      "name": "hero-banner",
      "instances": [
        ".bc-rich-text > .hero"
      ]
    },
    {
      "name": "cards-stats",
      "instances": [
        ".Section__intro:has(> div > p > strong)"
      ]
    },
    {
      "name": "cards-icon",
      "instances": [
        ".ServiceCards:has(> .ServiceCard)"
      ]
    },
    {
      "name": "columns-actions",
      "instances": [
        ".Contact:has(> .Contact__body)"
      ]
    }
  ],
  "sections": []
};

const parsers = {
  'hero-banner': heroBannerParser,
  // the /service stats band spreads its figures (space-between)
  'cards-stats': (element, ctx) => cardsStatsParser(element, { ...ctx, variant: 'left-aligned' }),
  'cards-icon': cardsIconParser,
  'columns-actions': columnsActionsParser,
};

// /service page CSS: the hero button is a white outline button (hero-banner `_link_`), and the hero
// CTA points at the Get in Touch band (#getInTouch on the source, the h2 id get-in-touch here)
function serviceLandingTransformer(hookName, element) {
  if (hookName !== 'beforeTransform') return;
  element.querySelectorAll('.hero a.btn.btn-primary').forEach((a) => {
    a.classList.remove('btn-primary');
    a.classList.add('btn-secondary');
  });
  element.querySelectorAll('a[href="#getInTouch"]').forEach((a) => a.setAttribute('href', '#get-in-touch'));
}

// landing fixes, prepare (forms, hidden title, table marks: before cleanup drops them), cleanup (chrome removal),
// then service sections (section breaks, buttons, videos),
// then page metadata (mybeckman-sections with no template sections only adds the Metadata block)
const transformers = [serviceLandingTransformer, mybeckmanServicePrepareTransformer, mybeckmanCleanupTransformer, mybeckmanServiceSectionsTransformer, mybeckmanSectionsTransformer];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((fn) => {
    try { fn(hookName, element, enhancedPayload); }
    catch (e) { console.error(`Transformer failed at ${hookName}:`, e); }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const seen = new Set();
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      let found = [];
      try { found = [...document.querySelectorAll(selector)]; } catch (e) { console.error(`Bad selector ${selector}`, e); }
      found.forEach((element) => {
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
      if (!block.element.isConnected) return;
      const parser = parsers[block.name];
      if (!parser) return;
      try { parser(block.element, { document, url, params }); }
      catch (e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); }
    });

    executeTransformers('afterTransform', main, payload);

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
