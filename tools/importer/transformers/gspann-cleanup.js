/* eslint-disable */
/* global WebImporter */

/**
 * Cleanup transformer for the GSPANN "services" template
 * (https://www.gspann.com/services/application-services-and-modernization).
 *
 * Only runs when payload.template.name === 'services' (every import script
 * loads all transformers in this folder). Must run before gspann-sections.js
 * within the same hook.
 *
 * Selectors come from migration-work/cleaned.html and the "excluded" list in
 * migration-work/page-structure.json.
 *
 * beforeTransform (before the parsers):
 *  - removes global chrome: CookieHub banner (body > div.ch2), skip link,
 *    header nav.navbar, mobile off-canvas menu (.mobile-menu-overlay /
 *    .mobile-menu-backdrop), footer.footer, Next.js route announcer, the
 *    hidden SVG sprite holder and anything else outside #main-content
 *  - removes the visually hidden key-takeaways SEO list and other .sr-only
 *    content
 *  - removes the decorative divider between the capability cards and the
 *    capability carousel (#services hr.capabilities-divider), so it does not
 *    become a section break
 *  - removes script/style/noscript/link/iframe and tracking attributes
 *  - converts span.section-tag eyebrows to <p class="section-tag"> so they
 *    import as default-content paragraphs above each H2
 *
 * afterTransform:
 *  - final sweep of non-authorable leftovers (scripts, styles, chrome)
 *  - appends the page Metadata block incl. "template: gspann" (body class
 *    "gspann" -> styles/gspann.css), mirroring mybeckman-cleanup.js, and
 *    removes the head entries WebImporter.rules.createMetadata would read so
 *    no second Metadata block is created.
 *
 * HTML comments are never removed in afterTransform (XWalk field hints).
 */

const TEMPLATE_NAME = 'services';
const PAGE_TEMPLATE_STYLE = 'gspann';

const CHROME_SELECTORS = [
  'body > div.ch2',
  'div.ch2.ch2-region-c3',
  'div.ch2-container',
  'a.skip-to-main',
  'nav.navbar',
  'div.mobile-menu-overlay',
  'div.mobile-menu-backdrop',
  'footer.footer',
  'next-route-announcer',
];

const HIDDEN_SELECTORS = [
  '#main-content > section.key-takeaways-section.sr-only',
  'section.key-takeaways-section',
  '.sr-only',
];

const DECORATIVE_SELECTORS = [
  '#services hr.capabilities-divider',
  '#services hr',
  '#services div[class*="divider"]',
];

const NON_CONTENT_SELECTORS = [
  'script',
  'style',
  'noscript',
  'link',
  'iframe',
  'meta',
];

function clean(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function safeQueryAll(root, selector) {
  try {
    return [...root.querySelectorAll(selector)];
  } catch (e) {
    return [];
  }
}

function removeAll(root, selectors) {
  selectors.forEach((sel) => safeQueryAll(root, sel).forEach((el) => el.remove()));
}

/** remove everything outside #main-content (chrome around the article) */
function isolateMain(element) {
  const main = element.querySelector('#main-content');
  if (!main) return;
  let node = main;
  while (node && node !== element && node.parentElement) {
    const parent = node.parentElement;
    [...parent.children].forEach((sib) => {
      if (sib !== node) sib.remove();
    });
    if (parent === element) break;
    node = parent;
  }
}

/** span.section-tag eyebrow -> <p class="section-tag"> */
function convertSectionTags(element) {
  const doc = element.ownerDocument;
  safeQueryAll(element, 'span.section-tag').forEach((span) => {
    const p = doc.createElement('p');
    p.className = 'section-tag';
    while (span.firstChild) p.append(span.firstChild);
    span.replaceWith(p);
  });
}

function stripTrackingAttributes(element) {
  safeQueryAll(element, '*').forEach((el) => {
    [...el.attributes].forEach(({ name }) => {
      if (
        name.startsWith('on')
        || name.startsWith('data-gtm')
        || name.startsWith('data-analytics')
        || name.startsWith('data-track')
        || name.startsWith('data-ga')
      ) {
        el.removeAttribute(name);
      }
    });
  });
}

function headMeta(doc, attr, name) {
  const head = doc.head || doc;
  return [...head.querySelectorAll(`meta[${attr}="${name}"]`)]
    .map((m) => clean(m.getAttribute('content')))
    .filter(Boolean)
    .join(', ');
}

/** page Metadata block, same mechanism as mybeckman-cleanup.js */
function appendMetadata(element) {
  const doc = element.ownerDocument;
  const cells = {};
  const title = doc.querySelector('head title') || doc.querySelector('title');
  if (title && clean(title.textContent)) cells.Title = clean(title.textContent);
  const description = headMeta(doc, 'name', 'description') || headMeta(doc, 'property', 'og:description');
  if (description) cells.Description = description;
  const keywords = headMeta(doc, 'name', 'keywords');
  // lowercase: md2jcr maps this row to the page model's "keywords" field by name
  if (keywords) cells.keywords = keywords;
  // body class "gspann" -> styles/gspann.css (page model "template" field)
  cells.template = PAGE_TEMPLATE_STYLE;
  const ogImage = headMeta(doc, 'property', 'og:image') || headMeta(doc, 'name', 'og:image');
  if (ogImage) {
    // the page model's "image" reference field is mapped only from a link
    const src = ogImage.split(', ')[0];
    const a = doc.createElement('a');
    a.href = src;
    a.textContent = src;
    cells.image = a;
  }
  element.append(WebImporter.Blocks.createBlock(doc, { name: 'Metadata', cells }));

  // WebImporter.rules.createMetadata (run by the import script afterwards)
  // reads title/description/og:*/twitter:* from the head: remove them so it
  // does not append a second Metadata block
  const { head } = doc;
  if (!head) return;
  safeQueryAll(doc, 'title').forEach((t) => t.remove());
  safeQueryAll(head, 'meta[name="description"], meta[property^="og:"], meta[name^="twitter:"], meta[property^="twitter:"], link[rel="canonical"]')
    .forEach((m) => m.remove());
}

export default function transform(hookName, element, payload) {
  const template = payload && payload.template;
  if (!template || template.name !== TEMPLATE_NAME) return;
  if (!element || !element.querySelectorAll) return;

  if (hookName === 'beforeTransform') {
    removeAll(element, CHROME_SELECTORS);
    isolateMain(element);
    removeAll(element, HIDDEN_SELECTORS);
    removeAll(element, DECORATIVE_SELECTORS);
    removeAll(element, NON_CONTENT_SELECTORS);
    stripTrackingAttributes(element);
    convertSectionTags(element);
  }

  if (hookName === 'afterTransform') {
    WebImporter.DOMUtils.remove(element, [
      ...NON_CONTENT_SELECTORS,
      ...CHROME_SELECTORS,
      'section.key-takeaways-section',
    ]);
    appendMetadata(element);
  }
}
