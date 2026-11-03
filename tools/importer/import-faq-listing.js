/* eslint-disable */
/* global WebImporter */

import breadcrumbParser from './parsers/breadcrumb.js';
import faqSearchParser from './parsers/faq-search.js';
import faqListParser from './parsers/faq-list.js';
import cardsCategoryParser from './parsers/cards-category.js';
import mybeckmanFaqListingPrepareTransformer from './transformers/mybeckman-faq-listing-prepare.js';
import mybeckmanCleanupTransformer from './transformers/mybeckman-cleanup.js';
import mybeckmanSectionsTransformer from './transformers/mybeckman-sections.js';

const PAGE_TEMPLATE = {
  "name": "faq-listing",
  "urls": [
    "https://www.mybeckman.in/support/faq",
    "https://www.mybeckman.in/support/faq/careers",
    "https://www.mybeckman.in/support/faq/ecommerce",
    "https://www.mybeckman.in/support/faq/industry-standards",
    "https://www.mybeckman.in/support/faq/other",
    "https://www.mybeckman.in/support/faq/product",
    "https://www.mybeckman.in/support/faq/product/clearllab-ls-ifu-sample-types",
    "https://www.mybeckman.in/support/faq/product/clearllab-ls-intended-use",
    "https://www.mybeckman.in/support/faq/research",
    "https://www.mybeckman.in/support/faq/scientific",
    "https://www.mybeckman.in/support/faq/services",
    "https://www.mybeckman.in/support/faq/services/already-installed-tv-via-email",
    "https://www.mybeckman.in/support/faq/services/are-beckmanconnect-servers-gdpr-compliant",
    "https://www.mybeckman.in/support/faq/services/bc-installer-provides-network-error",
    "https://www.mybeckman.in/support/faq/services/bc-installer-says-my-instrument-is-ineligible",
    "https://www.mybeckman.in/support/faq/services/beckmanconnect-differences",
    "https://www.mybeckman.in/support/faq/services/beckmanconnect-file-transfers",
    "https://www.mybeckman.in/support/faq/services/beckmanconnect-installation",
    "https://www.mybeckman.in/support/faq/services/beckmanconnect-installer",
    "https://www.mybeckman.in/support/faq/services/beckmanconnect-installer-not-running",
    "https://www.mybeckman.in/support/faq/services/beckmanconnect-instrument-controller-pc",
    "https://www.mybeckman.in/support/faq/services/beckmanconnect-medical-devices",
    "https://www.mybeckman.in/support/faq/services/beckmanconnect-which-instruments",
    "https://www.mybeckman.in/support/faq/services/completed-registration-but-no-email-with-link",
    "https://www.mybeckman.in/support/faq/services/content-for-2-acknowledge-boxes-not-loading",
    "https://www.mybeckman.in/support/faq/services/do-i-need-to-remove-tv-if-installed",
    "https://www.mybeckman.in/support/faq/services/i-want-to-remove-beckmanconnect",
    "https://www.mybeckman.in/support/faq/services/is-download-link-for-bc-installer-or-teamviewer",
    "https://www.mybeckman.in/support/faq/services/is-info-collected-from-bc-installer",
    "https://www.mybeckman.in/support/faq/services/what-is-installed-with-the-installer",
    "https://www.mybeckman.in/support/faq/services/why-did-i-receive-a-download-link-for-tv"
  ],
  "coverageGaps": [],
  "description": "Breadcrumb, title and intro text, then a grid of FAQ category tiles or a filterable list of FAQ links, with a narrow right sidebar column",
  "blocks": [
    {
      "name": "breadcrumb",
      "instances": [
        ".main-holder > .container.custome-container nav.breadcrumbs",
        "nav.breadcrumbs"
      ]
    },
    {
      "name": "faq-search",
      "instances": [
        "#content-holder .faq-search-source"
      ]
    },
    {
      "name": "faq-list",
      "instances": [
        "#content-holder .table-block"
      ]
    },
    {
      "name": "cards-category",
      "instances": [
        "#content-holder > div.row:has(a.faq-item)"
      ]
    }
  ],
  "representativeUrl": "https://www.mybeckman.in/support/faq/product",
  "sections": [
    {
      "id": "fl1",
      "name": "breadcrumb",
      "selector": [
        ".main-holder > .container.custome-container"
      ],
      "style": null,
      "blocks": [
        "breadcrumb"
      ],
      "defaultContent": []
    },
    {
      "id": "fl2",
      "name": "faq-listing",
      "selector": [
        ".main-holder .two-columns-holder.faq-section",
        ".main-holder > .container:nth-of-type(2)"
      ],
      "style": "listing",
      "blocks": [
        "faq-search",
        "faq-list",
        "cards-category"
      ],
      "defaultContent": [
        "#content-holder > h1",
        "#content-holder > p"
      ]
    }
  ]
};

const parsers = {
  breadcrumb: breadcrumbParser,
  'faq-search': faqSearchParser,
  'faq-list': faqListParser,
  'cards-category': cardsCategoryParser,
};
// prepare first (keeps filters, row categories and tile images that cleanup would drop),
// then cleanup (chrome removal, text normalisation), then section breaks + page metadata
const transformers = [mybeckmanFaqListingPrepareTransformer, mybeckmanCleanupTransformer, mybeckmanSectionsTransformer];

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
      try { parser(block.element, { document, url, params }); }
      catch (e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); }
    });

    // the sections transformer appends the Metadata block (Title, Description),
    // so WebImporter.rules.createMetadata is not called here (it would add a second one)
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
