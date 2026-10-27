/* eslint-disable */
/* global WebImporter */

import heroHomeMbParser from './parsers/hero-home-mb.js';
import columnsMbParser from './parsers/columns-mb.js';
import tabsWorkflowMbParser from './parsers/tabs-workflow-mb.js';
import cardsGridIconsMbParser from './parsers/cards-grid-icons-mb.js';
import cardsGridProductsMbParser from './parsers/cards-grid-products-mb.js';
import cardsGridPhotoMbParser from './parsers/cards-grid-photo-mb.js';
import carouselTestimonialsMbParser from './parsers/carousel-testimonials-mb.js';
import formMbParser from './parsers/form-mb.js';
import cleanupTransformer from './transformers/beckmancoulter-cleanup.js';
import sectionsTransformer from './transformers/beckmancoulter-sections.js';
import solutionsCleanupTransformer from './transformers/beckmancoulter-solutions-cleanup.js';
import solutionsSectionsTransformer from './transformers/beckmancoulter-solutions-sections.js';
import dxsCleanupTransformer from './transformers/beckmancoulter-dxs-cleanup.js';
import dxsSectionsTransformer from './transformers/beckmancoulter-dxs-sections.js';
import productCleanupTransformer from './transformers/beckmancoulter-product-cleanup.js';
import productSectionsTransformer from './transformers/beckmancoulter-product-sections.js';
import hematologyCleanupTransformer from './transformers/beckmancoulter-hematology-cleanup.js';
import hematologySectionsTransformer from './transformers/beckmancoulter-hematology-sections.js';
import mybeckmanCleanupTransformer from './transformers/mybeckman-cleanup.js';
import mybeckmanSectionsTransformer from './transformers/mybeckman-sections.js';

const PAGE_TEMPLATE = {
  "name": "mybeckman-next-generation-sequencing",
  "urls": [
    "https://www.mybeckman.in/resources/technologies/next-generation-sequencing"
  ],
  "representativeUrl": "https://www.mybeckman.in/resources/technologies/next-generation-sequencing",
  "urlPattern": "/resources/technologies/next-generation-sequencing",
  "description": "Technology landing page (Sitecore bc-rich-text family): Wistia background-video hero with CTAs, intro text|photo columns, red instruction bar + tab-scroll workflow, benefit icon cards, partners list band, featured resource cards, insightful article cards, testimonial slideshow, Marketo contact form (3101) with disclaimers.",
  "blocks": [
    {
      "name": "hero-home-mb",
      "instances": [
        "div.bc-rich-text > div.section:has(iframe.responsive-iframe)"
      ]
    },
    {
      "name": "columns-mb",
      "instances": [
        "div.containercustom > div.row:has(p.introimg)"
      ]
    },
    {
      "name": "tabs-workflow-mb",
      "instances": [
        "div.tab-scroll"
      ]
    },
    {
      "name": "cards-grid-icons-mb",
      "instances": [
        "div.containercustom > div.row:has(> div.col-sm-3 > p > img)"
      ]
    },
    {
      "name": "cards-grid-products-mb",
      "instances": [
        "div.featres"
      ]
    },
    {
      "name": "cards-grid-photo-mb",
      "instances": [
        "div.row.InsArt"
      ]
    },
    {
      "name": "carousel-testimonials-mb",
      "instances": [
        "div.slideshow-container"
      ]
    },
    {
      "name": "form-mb",
      "instances": [
        "#main div.formassembly-container"
      ]
    }
  ],
  "sections": [
    {
      "id": "hero",
      "name": "Top video banner",
      "selector": [
        "div.bc-rich-text > div.section:has(iframe.responsive-iframe)"
      ],
      "style": null,
      "blocks": [
        "hero-home-mb"
      ],
      "defaultContent": []
    },
    {
      "id": "intro",
      "name": "Generate High-Quality Data Faster (text beside image)",
      "selector": [
        "div.containercustom:has(> div.row p.introimg)"
      ],
      "style": null,
      "blocks": [
        "columns-mb"
      ],
      "defaultContent": [
        "div.containercustom:has(> div.row p.introimg) > h2"
      ]
    },
    {
      "id": "solutions",
      "name": "Our NGS Library Prep Automated Solutions (intro)",
      "selector": [
        "div.containercustom:has(> h2#Solutions)"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        "div.containercustom > h2#Solutions",
        "div.containercustom:has(> h2#Solutions) > p"
      ]
    },
    {
      "id": "workflow-callout",
      "name": "Red instruction bar",
      "selector": [
        "div.containercustom:has(> div.tab-scroll) > div:first-child"
      ],
      "style": "red",
      "blocks": [],
      "defaultContent": [
        "div.containercustom:has(> div.tab-scroll) > div:first-child"
      ]
    },
    {
      "id": "workflow",
      "name": "NGS library prep workflow stage tabs",
      "selector": [
        "div.containercustom > div.tab-scroll"
      ],
      "style": null,
      "blocks": [
        "tabs-workflow-mb"
      ],
      "defaultContent": [
        "div.containercustom:has(> div.tab-scroll) > div:last-child"
      ]
    },
    {
      "id": "benefits",
      "name": "Benefits of Our NGS Library Prep Automated Solutions",
      "selector": [
        "div.containercustom:has(> div.row > div.col-sm-3 > p > img)"
      ],
      "style": null,
      "blocks": [
        "cards-grid-icons-mb"
      ],
      "defaultContent": [
        "div.containercustom:has(> div.row > div.col-sm-3 > p > img) > h2"
      ]
    },
    {
      "id": "partners",
      "name": "Our NGS Library Prep Automation Partners",
      "selector": [
        "div.containercustom:has(ul.partners)"
      ],
      "style": "highlight",
      "blocks": [],
      "defaultContent": [
        "div.containercustom:has(ul.partners) > h2",
        "ul.partners"
      ]
    },
    {
      "id": "featured-resources",
      "name": "Featured Resources",
      "selector": [
        "div.containercustom:has(> div.featres)"
      ],
      "style": null,
      "blocks": [
        "cards-grid-products-mb"
      ],
      "defaultContent": [
        "div.containercustom:has(> div.featres) > h2"
      ]
    },
    {
      "id": "articles",
      "name": "Insightful Articles",
      "selector": [
        "div.containercustom:has(> div.row.InsArt)"
      ],
      "style": null,
      "blocks": [
        "cards-grid-photo-mb"
      ],
      "defaultContent": [
        "div.containercustom:has(> div.row.InsArt) > h2",
        "div.containercustom.buttflex > a"
      ]
    },
    {
      "id": "testimonials",
      "name": "Hear from Our Customers (testimonial carousel)",
      "selector": [
        "div.containercustom:has(> div.slideshow-container)"
      ],
      "style": null,
      "blocks": [
        "carousel-testimonials-mb"
      ],
      "defaultContent": [
        "div.containercustom:has(> div.slideshow-container) > h2"
      ]
    },
    {
      "id": "contact",
      "name": "Ready to get started? (contact form)",
      "selector": [
        "div.bc-rich-text:has(> a[name=form])"
      ],
      "style": "highlight",
      "blocks": [
        "form-mb"
      ],
      "defaultContent": [
        "div.containercustom > div.formtitle",
        "div.containercustom > div.formtext",
        "div.formassembly-container + div.bc-rich-text div.containercustom > p"
      ]
    }
  ]
};

const parsers = {
  'hero-home-mb': heroHomeMbParser,
  'columns-mb': columnsMbParser,
  'tabs-workflow-mb': tabsWorkflowMbParser,
  'cards-grid-icons-mb': cardsGridIconsMbParser,
  'cards-grid-products-mb': cardsGridProductsMbParser,
  'cards-grid-photo-mb': cardsGridPhotoMbParser,
  'carousel-testimonials-mb': carouselTestimonialsMbParser,
  'form-mb': formMbParser,
};

// every template's transformers are registered; each guards on PAGE_TEMPLATE.name.
// cleanup must run before sections within each template.
const transformers = [cleanupTransformer, sectionsTransformer, solutionsCleanupTransformer, solutionsSectionsTransformer, dxsCleanupTransformer, dxsSectionsTransformer, productCleanupTransformer, productSectionsTransformer, hematologyCleanupTransformer, hematologySectionsTransformer, mybeckmanCleanupTransformer, mybeckmanSectionsTransformer];

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

export default {
  // live page, before html2md copies the DOM (computed styles still available)
  onLoad: ({ document }) => {
    executeTransformers('onLoad', document.body, { document });
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
