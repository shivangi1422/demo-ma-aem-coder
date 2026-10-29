/* eslint-disable */
/* global WebImporter */

import columnsAnchorNavParser from './parsers/columns-anchor-nav.js';
import heroOverlayLeftParser from './parsers/hero-overlay-left.js';
import cardsCapabilityParser from './parsers/cards-capability.js';
import carouselSplitDetailParser from './parsers/carousel-split-detail.js';
import cardsLogoGroupParser from './parsers/cards-logo-group.js';
import formParser from './parsers/form.js';
import cardsStatsParser from './parsers/cards-stats.js';
import cardsResourcesParser from './parsers/cards-resources.js';
import cardsLeaderParser from './parsers/cards-leader.js';
import cardsVerticalParser from './parsers/cards-vertical.js';
import gspannCleanupTransformer from './transformers/gspann-cleanup.js';
import gspannSectionsTransformer from './transformers/gspann-sections.js';

const PAGE_TEMPLATE = {
  "name": "services",
  "urls": [
    "https://www.gspann.com/services/application-services-and-modernization",
    "https://www.gspann.com/services/managed-services-operations",
    "https://www.gspann.com/services/data-analytics",
    "https://www.gspann.com/services/devops",
    "https://www.gspann.com/services/digital-commerce",
    "https://www.gspann.com/services/quality-engineering",
    "https://www.gspann.com/services/mobility"
  ],
  "representativeUrl": "https://www.gspann.com/services/application-services-and-modernization",
  "urlPattern": "/services/*",
  "description": "GSPANN service landing pages: sticky gradient anchor nav, photo hero, capabilities cards + detail carousel, technology partner logo cards, navy email CTA, impact stats, insights resource scroller, leadership cards.",
  "blocks": [
    {
      "name": "columns-anchor-nav",
      "instances": [
        "#main-content > nav.secondary-nav div.secondary-nav-content"
      ]
    },
    {
      "name": "hero-overlay-left",
      "instances": [
        "#main-content > section.service-hero"
      ]
    },
    {
      "name": "cards-capability",
      "instances": [
        "#services div.capabilities-flat-grid"
      ]
    },
    {
      "name": "carousel-split-detail",
      "instances": [
        "#services div.capability-carousel"
      ]
    },
    {
      "name": "cards-logo-group",
      "instances": [
        "#platforms div.platforms-categories-wrapper"
      ]
    },
    {
      "name": "cards-vertical",
      "instances": [
        "#verticals div.verticals-grid"
      ]
    },
    {
      "name": "form",
      "instances": [
        "#approach form"
      ]
    },
    {
      "name": "cards-stats",
      "instances": [
        "#results div.impact-metrics-grid"
      ]
    },
    {
      "name": "cards-resources",
      "instances": [
        "#insights div.rc-track"
      ]
    },
    {
      "name": "cards-leader",
      "instances": [
        "#connect div.leadership-grid"
      ]
    }
  ],
  "sections": [
    {
      "id": "section-1",
      "name": "Sticky service anchor navigation",
      "selector": [
        "#main-content > nav.secondary-nav"
      ],
      "style": "blue-red-gradient",
      "blocks": [
        "columns-anchor-nav"
      ],
      "defaultContent": []
    },
    {
      "id": "section-2",
      "name": "Service hero",
      "selector": [
        "#main-content > section.service-hero"
      ],
      "style": null,
      "blocks": [
        "hero-overlay-left"
      ],
      "defaultContent": []
    },
    {
      "id": "section-3",
      "name": "Our Capabilities",
      "selector": [
        "#services"
      ],
      "style": null,
      "blocks": [
        "cards-capability",
        "carousel-split-detail"
      ],
      "defaultContent": [
        "#services .section-tag",
        "#services h2",
        "#services h2 + p"
      ]
    },
    {
      "id": "section-4",
      "name": "Technology Partners",
      "selector": [
        "#platforms"
      ],
      "style": "light-blue",
      "blocks": [
        "cards-logo-group"
      ],
      "defaultContent": [
        "#platforms .section-tag",
        "#platforms h2",
        "#platforms h2 + p"
      ]
    },
    {
      "id": "section-operating-model",
      "name": "Operating Model",
      "selector": [
        "#operating-model"
      ],
      "style": "light-blue",
      "blocks": [],
      "defaultContent": [
        "#operating-model .section-tag",
        "#operating-model h2",
        "#operating-model h2 + p",
        "#operating-model figure"
      ]
    },
    {
      "id": "section-verticals",
      "name": "Verticals",
      "selector": [
        "#verticals"
      ],
      "style": "spacious",
      "blocks": [
        "cards-vertical"
      ],
      "defaultContent": [
        "#verticals .section-tag",
        "#verticals h2",
        "#verticals h2 + p"
      ]
    },
    {
      "id": "section-5",
      "name": "Modernization partner CTA",
      "selector": [
        "#approach"
      ],
      "style": "navy-gradient, centered",
      "blocks": [
        "form"
      ],
      "defaultContent": [
        "#approach h2",
        "#approach h2 + p"
      ]
    },
    {
      "id": "section-6",
      "name": "Our Impact",
      "selector": [
        "#results"
      ],
      "style": "light-grey",
      "blocks": [
        "cards-stats"
      ],
      "defaultContent": [
        "#results .section-tag",
        "#results h2",
        "#results h2 + p"
      ]
    },
    {
      "id": "section-7",
      "name": "Insights resources",
      "selector": [
        "#insights"
      ],
      "style": "light-grey",
      "blocks": [
        "cards-resources"
      ],
      "defaultContent": [
        "#insights .section-tag",
        "#insights h2",
        "#insights h2 + p"
      ]
    },
    {
      "id": "section-8",
      "name": "Connect with Us",
      "selector": [
        "#connect"
      ],
      "style": null,
      "blocks": [
        "cards-leader"
      ],
      "defaultContent": [
        "#connect .section-tag",
        "#connect h2"
      ]
    }
  ]
};

const parsers = {
  'columns-anchor-nav': columnsAnchorNavParser,
  'hero-overlay-left': heroOverlayLeftParser,
  'cards-capability': cardsCapabilityParser,
  'carousel-split-detail': carouselSplitDetailParser,
  'cards-logo-group': cardsLogoGroupParser,
  'form': formParser,
  'cards-stats': cardsStatsParser,
  'cards-resources': cardsResourcesParser,
  'cards-leader': cardsLeaderParser,
  'cards-vertical': cardsVerticalParser,
};

// GSPANN only: cleanup must run before sections within each hook
const transformers = [gspannCleanupTransformer, gspannSectionsTransformer];

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

const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

/**
 * Live page only: the capability carousel renders just the active slide, so click
 * "Next capability" through every slide and keep a hidden copy of each one inside the
 * carousel for the carousel-split-detail parser.
 */
async function captureCarouselSlides(document) {
  const carousel = document.querySelector('#services .capability-carousel');
  if (!carousel) return;
  const next = carousel.querySelector('button[aria-label="Next capability"]')
    || carousel.querySelectorAll('.capability-carousel-btn')[1];
  const count = carousel.querySelectorAll('.capability-carousel-dots .carousel-dot').length || 1;
  const captured = document.createElement('div');
  captured.className = 'capability-carousel-captured';
  captured.hidden = true;
  const seen = new Set();
  const grabNew = () => {
    const card = [...carousel.querySelectorAll(':scope > .capability-carousel-card')]
      .find((c) => {
        const title = c.querySelector('h3')?.textContent.trim();
        return title && !seen.has(title);
      });
    if (!card) return false;
    seen.add(card.querySelector('h3').textContent.trim());
    captured.append(card.cloneNode(true));
    return true;
  };
  grabNew();
  for (let i = 1; i < count && next; i += 1) {
    next.click();
    // wait for the next slide to render (up to ~3s)
    for (let t = 0; t < 30 && !grabNew(); t += 1) {
      // eslint-disable-next-line no-await-in-loop
      await wait(100);
    }
  }
  carousel.append(captured);
}

export default {
  onLoad: async ({ document }) => {
    try { await captureCarouselSlides(document); }
    catch (e) { console.error('Carousel capture failed:', e); }
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
    const metaTable = [...main.querySelectorAll('table')].find((table) => {
      const first = table.querySelector('tr > th, tr > td');
      return first && /^metadata$/i.test(first.textContent.trim());
    });
    if (metaTable && metaTable !== main.lastElementChild) main.append(metaTable);
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
