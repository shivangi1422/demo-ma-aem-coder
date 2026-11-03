/* eslint-disable */
/* global WebImporter */

import breadcrumbParser from './parsers/breadcrumb.js';
import heroBannerParser from './parsers/hero-banner.js';
import columnsCalloutParser from './parsers/columns-callout.js';
import cardsStatsParser from './parsers/cards-stats.js';
import columnsActionsParser from './parsers/columns-actions.js';
import columnsParser from './parsers/columns.js';
import cardsTileParser from './parsers/cards-tile.js';
import accordionFaqParser from './parsers/accordion-faq.js';
import mybeckmanCleanupTransformer from './transformers/mybeckman-cleanup.js';
import mybeckmanServiceSectionsTransformer from './transformers/mybeckman-service-sections.js';
import mybeckmanSectionsTransformer from './transformers/mybeckman-sections.js';

const PAGE_TEMPLATE = {
  "name": "service-content-page",
  "description": "Breadcrumb, single article column with title, subheading, text and buttons, followed by mixed content blocks (columns, cards, forms, callouts, video)",
  "urls": [
    "https://www.mybeckman.in/service/instrument-optimization",
    "https://www.mybeckman.in/service/instrument-optimization/beckmanconnect-support-tools",
    "https://www.mybeckman.in/service/instrument-optimization/beckmanconnect-support-tools/remote-support",
    "https://www.mybeckman.in/service/instrument-optimization/beckmanconnect-support-tools/remote-support/certificate-updater",
    "https://www.mybeckman.in/service/instrument-optimization/beckmanconnect-support-tools/remote-support/notifications",
    "https://www.mybeckman.in/service/instrument-optimization/beckmanconnect-support-tools/security",
    "https://www.mybeckman.in/service/instrument-optimization/installation",
    "https://www.mybeckman.in/service/instrument-optimization/preventive-maintenance",
    "https://www.mybeckman.in/service/instrument-qualification-calibration",
    "https://www.mybeckman.in/service/plans",
    "https://www.mybeckman.in/service/plans/centrifuge",
    "https://www.mybeckman.in/service/plans/flow-cytometry",
    "https://www.mybeckman.in/service/plans/liquid-handling",
    "https://www.mybeckman.in/service/plans/particle-analysis",
    "https://www.mybeckman.in/service/plans/request",
    "https://www.mybeckman.in/service/tech-support",
    "https://www.mybeckman.in/service/tech-support/repairs",
    "https://www.mybeckman.in/service/tech-support/windows-10",
    "https://www.mybeckman.in/service/tech-support/windows-10/biomek",
    "https://www.mybeckman.in/service/tech-support/windows-10/vi-cell-metaflex",
    "https://www.mybeckman.in/service/tech-support/windows-10/vi-cell-xr",
    "https://www.mybeckman.in/service/training",
    "https://www.mybeckman.in/support",
    "https://www.mybeckman.in/support/customer-relations",
    "https://www.mybeckman.in/support/customer-relations/apache-log4j-critical-vulnerability",
    "https://www.mybeckman.in/support/customer-relations/product-recalls",
    "https://www.mybeckman.in/support/customer-relations/product-recalls/fc500-and-epic-series-instruments",
    "https://www.mybeckman.in/support/customer-relations/windows-print-spooler-vulnerability",
    "https://www.mybeckman.in/support/ecommerce",
    "https://www.mybeckman.in/support/ecommerce/account-setup-assistance",
    "https://www.mybeckman.in/support/faq/product/size-selection-with-ampure-xp-beads",
    "https://www.mybeckman.in/support/technical-documents",
    "https://www.mybeckman.in/support/technical-documents/mercury"
  ],
  "blocks": [
    {
      "name": "breadcrumb",
      "instances": [
        "nav.breadcrumbs"
      ]
    },
    {
      "name": "hero-banner",
      "instances": [
        ".bc-rich-text > .hero"
      ]
    },
    {
      "name": "columns-callout",
      "instances": [
        ".Intro:has(> .Intro__title):has(> .Intro__body)"
      ]
    },
    {
      "name": "cards-stats",
      "instances": [
        ".Section__intro:has(> div > p > strong)"
      ]
    },
    {
      "name": "columns-actions",
      "instances": [
        ".Contact:has(> .Contact__body)"
      ]
    },
    {
      "name": "columns",
      "instances": [
        ".Section__two-column"
      ]
    },
    {
      "name": "cards-tile",
      "instances": [
        ".ProductCards"
      ]
    },
    {
      "name": "accordion-faq",
      "instances": [
        ".Section:has(> label + .Content)"
      ]
    }
  ],
  "sections": []
};

const parsers = {
  'breadcrumb': breadcrumbParser,
  'hero-banner': heroBannerParser,
  'columns-callout': columnsCalloutParser,
  'cards-stats': cardsStatsParser,
  'columns-actions': columnsActionsParser,
  'columns': columnsParser,
  'cards-tile': cardsTileParser,
  'accordion-faq': accordionFaqParser,
};
// cleanup (chrome removal), then service sections (section breaks, buttons, videos),
// then page metadata (mybeckman-sections with no template sections only adds the Metadata block)
const transformers = [mybeckmanCleanupTransformer, mybeckmanServiceSectionsTransformer, mybeckmanSectionsTransformer];

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
