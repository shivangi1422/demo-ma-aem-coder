/* eslint-disable */
/* global WebImporter */

/**
 * Beckman Coulter sections transformer (products-legacy template:
 * DxS service and support, immunoassay, urinalysis).
 *
 * The section layout differs per page, so sections are derived generically
 * from payload.template:
 *   - every element matched by a block instance selector
 *     (template.blocks[].instances) or a section selector
 *     (template.sections[].selector, all selectors, all matches) is a
 *     candidate, in DOM order, de-duplicated; nested candidates collapse into
 *     their outermost candidate;
 *   - text-empty, media-less candidates (empty .page-content, the empty
 *     Marketo placeholder form of the static render) are never sections;
 *   - each remaining candidate is its own section;
 *   - EXCEPTION (merge): a heading-only .page-content whose next content
 *     element is a .related-products, a #main-container > form.mktoForm or a
 *     #main-container > .col-3-default-padding:has(.photo-card) joins that
 *     block's section (the parser consumes the heading), so no break goes
 *     between them;
 *   - a heading-only .page-content followed by a Marketo form that is not a
 *     block instance (static render: Marketo JS did not run) is a form
 *     heading without a form: it is not a section of its own and stays at
 *     the end of the previous section.
 *
 * Highlight: a section containing an element that matches
 * template.highlightSelectors gets a Section Metadata block (style
 * "highlight") at its end.
 *
 * beforeTransform (while the parser targets still exist):
 *   - tags every section element with [data-excat-section="<n>"]
 *   - inserts a protected <hr data-excat-section-break> before the first
 *     element of every section except the first. When the section before it
 *     is highlighted, the break carries data-excat-prev-style="highlight".
 *   - for a highlighted LAST section, inserts <hr data-excat-section-end="highlight">
 *     after its last element (end-of-section anchor)
 *
 * afterTransform (parsers may have replaced the section elements):
 *   - inserts Section Metadata before every break with data-excat-prev-style
 *     and in place of the end marker
 *   - removes the temporary attributes
 *
 * The cleanup transformer never removes tagged elements, protected breaks,
 * end markers or any element this transformer would tag, so the result is
 * the same whichever transformer runs first.
 */

const SECTION_ATTR = 'data-excat-section';
const BREAK_ATTR = 'data-excat-section-break';
const PREV_STYLE_ATTR = 'data-excat-prev-style';
const END_ATTR = 'data-excat-section-end';

const FALLBACK_SELECTORS = [
  '#main-container .video-hero-carousel',
  '#main-container > form.mktoForm',
  '#main-container .related-products',
  '#main-container > .col-3-default-padding:has(.photo-card)',
  '#main-container .data-visualization-container',
  '#main-container > .col-3-default-padding:not(:has(.photo-card)):has(img)',
  '#main-container .product-list',
  '#main-container .media-showcase-simple',
  '#main-container .social-proof-section',
  '#main-container .testimonial-slim',
  '#main-container .education-filter-carousel',
  '#main-container > .col-3-default-padding:has(ul):not(:has(.photo-card))',
  '#main-container .double-showcase-feature',
  '#main-container > .wysiwyg-content',
  '#main-container > .sublayout > .wysiwyg-content',
  '#main-container > .sublayout > .page-content.nested-padding',
  '#main-container > .sublayout > .intro-content',
  '#main-container .expanding-product-links-grid',
  '#main-container .disclaimer-text',
];

const FALLBACK_HIGHLIGHT = [
  '#main-container .product-list',
  '#main-container .social-proof-section',
  '#main-container .media-showcase-simple',
  '#main-container .expanding-product-links-grid',
];

// Blocks whose parser consumes the heading-only .page-content right before them.
const MERGE_TARGETS = [
  '#main-container .related-products',
  '#main-container > form.mktoForm',
  '#main-container > .col-3-default-padding:has(.photo-card)',
];
const HEADING_SELECTOR = '.page-content';
const MARKETO_FORM = '#main-container > form';

const NON_CONTENT = 'style, script, noscript, link, template, hr';
const NEVER_SECTION = 'section#demos, #videoHeroBannerEnd, #confirmform, .breadcrumbs';
const MEDIA_SELECTOR = 'img, picture, video, iframe, svg, table, input, select, textarea, button';

function normText(s) {
  return (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function isEmptyHeadingText(t) {
  return t === '' || /^empty heading$/i.test(t);
}

/** Clone without style/script and without empty / UserWay "Empty heading" headings. */
function meaningfulClone(el) {
  const clone = el.cloneNode(true);
  clone.querySelectorAll('style, script, noscript, template, link').forEach((n) => n.remove());
  clone.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
    if (!h.querySelector(MEDIA_SELECTOR) && isEmptyHeadingText(normText(h.textContent))) h.remove();
  });
  return clone;
}

function isContentEmpty(el) {
  if (el.matches(MEDIA_SELECTOR) || el.querySelector(MEDIA_SELECTOR)) return false;
  if (/url\(/i.test(el.getAttribute('style') || '') || el.querySelector('[style*="url("]')) return false;
  return normText(meaningfulClone(el).textContent) === '';
}

/** A .page-content whose only meaningful content is heading text. */
function isHeadingOnly(el) {
  if (!el.matches(HEADING_SELECTOR)) return false;
  if (el.querySelector(MEDIA_SELECTOR)) return false;
  const clone = meaningfulClone(el);
  const headings = [...clone.querySelectorAll('h1, h2, h3, h4, h5, h6')];
  if (!headings.length) return false;
  const headingText = normText(headings.map((h) => h.textContent).join(' '));
  return headingText !== '' && headingText === normText(clone.textContent);
}

function safeMatches(el, selector) {
  try {
    return el.matches(selector);
  } catch (e) {
    return false;
  }
}

function isSkippable(el) {
  if (el.matches('form')) return false;
  return el.matches(NON_CONTENT) || el.matches(NEVER_SECTION) || isContentEmpty(el);
}

/** Next content element in DOM order (climbing out of wrappers, never past #main-container). */
function nextContentElement(el) {
  let node = el;
  while (node && !node.matches('#main-container, body')) {
    let sib = node.nextElementSibling;
    while (sib && isSkippable(sib)) sib = sib.nextElementSibling;
    if (sib) return sib;
    node = node.parentElement;
  }
  return null;
}

function inDocumentOrder(a, b) {
  if (a === b) return 0;
  // eslint-disable-next-line no-bitwise
  return a.compareDocumentPosition(b) & 4 ? -1 : 1;
}

function getSelectors(payload) {
  const tpl = (payload && payload.template) || {};
  const list = [];
  (Array.isArray(tpl.sections) ? tpl.sections : []).forEach((section) => {
    const sel = Array.isArray(section.selector) ? section.selector : [section.selector];
    sel.filter(Boolean).forEach((s) => list.push(s));
  });
  (Array.isArray(tpl.blocks) ? tpl.blocks : []).forEach((block) => {
    (block.instances || []).forEach((s) => list.push(s));
  });
  return list.length ? [...new Set(list)] : FALLBACK_SELECTORS;
}

function getHighlightSelectors(payload) {
  const tpl = (payload && payload.template) || {};
  return Array.isArray(tpl.highlightSelectors) && tpl.highlightSelectors.length
    ? tpl.highlightSelectors
    : FALLBACK_HIGHLIGHT;
}

function collectCandidates(document, selectors) {
  const found = [];
  selectors.forEach((selector) => {
    let nodes = [];
    try {
      nodes = [...document.querySelectorAll(selector)];
    } catch (e) {
      nodes = [];
    }
    nodes.forEach((el) => {
      if (found.includes(el)) return;
      if (el.matches(NON_CONTENT) || el.matches(NEVER_SECTION)) return;
      if (isContentEmpty(el)) return;
      found.push(el);
    });
  });
  // nested candidates collapse into their outermost candidate
  return found
    .filter((el) => !found.some((other) => other !== el && other.contains(el)))
    .sort(inDocumentOrder);
}

function buildGroups(candidates) {
  const groups = [];
  const consumed = new Set();
  candidates.forEach((el) => {
    if (consumed.has(el)) return;
    if (isHeadingOnly(el)) {
      const next = nextContentElement(el);
      if (next && candidates.includes(next) && MERGE_TARGETS.some((s) => safeMatches(next, s))) {
        groups.push([el, next]);
        consumed.add(next);
        return;
      }
      // form heading without a usable form (Marketo not rendered): not a section
      if (next && next.matches(MARKETO_FORM) && !candidates.includes(next)) return;
    }
    groups.push([el]);
  });
  return groups;
}

function createSectionMetadata(document, style) {
  if (typeof WebImporter !== 'undefined' && WebImporter.Blocks && WebImporter.Blocks.createBlock) {
    return WebImporter.Blocks.createBlock(document, {
      name: 'Section Metadata',
      cells: { style },
    });
  }
  // Fallback (outside the importer runtime): equivalent block table.
  const table = document.createElement('table');
  table.innerHTML = `<tr><th colspan="2">Section Metadata</th></tr><tr><td>style</td><td>${style}</td></tr>`;
  return table;
}

export default function transform(hookName, element, payload) {
  const document = (element && element.ownerDocument) || (payload && payload.document) || element;
  if (!document || !document.querySelector) return;

  if (hookName === 'beforeTransform') {
    // Idempotent: if sections are already tagged, do nothing.
    if (document.querySelector(`[${SECTION_ATTR}]`)) return;

    const candidates = collectCandidates(document, getSelectors(payload));
    const groups = buildGroups(candidates);
    const highlight = getHighlightSelectors(payload);
    const styles = groups.map((group) => (
      group.some((el) => highlight.some((s) => safeMatches(el, s) || !!el.querySelector(s.replace(/^#main-container\s+/, ''))))
        ? 'highlight'
        : null
    ));

    groups.forEach((group, i) => {
      group.forEach((el) => el.setAttribute(SECTION_ATTR, String(i + 1)));
    });

    // Reverse walk: protected breaks before every section except the first.
    for (let i = groups.length - 1; i >= 1; i -= 1) {
      const first = groups[i][0];
      let hr = first.previousElementSibling;
      if (!hr || !hr.matches(`hr[${BREAK_ATTR}]`)) {
        hr = document.createElement('hr');
        hr.setAttribute(BREAK_ATTR, '');
        first.before(hr);
      }
      if (styles[i - 1]) hr.setAttribute(PREV_STYLE_ATTR, styles[i - 1]);
    }

    // Highlighted last section: end-of-section anchor for its Section Metadata.
    const lastIdx = groups.length - 1;
    if (lastIdx >= 0 && styles[lastIdx]) {
      const lastGroup = groups[lastIdx];
      const end = document.createElement('hr');
      end.setAttribute(END_ATTR, styles[lastIdx]);
      lastGroup[lastGroup.length - 1].after(end);
    }
  }

  if (hookName === 'afterTransform') {
    [...document.querySelectorAll(`hr[${BREAK_ATTR}][${PREV_STYLE_ATTR}]`)].reverse().forEach((hr) => {
      hr.before(createSectionMetadata(document, hr.getAttribute(PREV_STYLE_ATTR)));
    });
    document.querySelectorAll(`hr[${END_ATTR}]`).forEach((hr) => {
      hr.replaceWith(createSectionMetadata(document, hr.getAttribute(END_ATTR)));
    });

    document.querySelectorAll(`[${SECTION_ATTR}]`).forEach((el) => el.removeAttribute(SECTION_ATTR));
    document.querySelectorAll(`[${PREV_STYLE_ATTR}]`).forEach((el) => el.removeAttribute(PREV_STYLE_ATTR));
    document.querySelectorAll(`[${BREAK_ATTR}]`).forEach((el) => el.removeAttribute(BREAK_ATTR));
  }
}
