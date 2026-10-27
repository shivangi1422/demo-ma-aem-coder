/* eslint-disable */
/* global WebImporter */

/**
 * Beckman Coulter sections transformer (blog template).
 *
 * The blog body varies per page, so sections are derived generically:
 *   - the blog header (.blog-post-header)
 *   - EACH non-empty element child of the body wrapper, in DOM order
 *     (inline <style> siblings / style-only wrappers and text-empty,
 *     image-less children are dropped)
 *   - the related articles list (.blog-post-list)
 *
 * beforeTransform tags every section element with [data-excat-section]
 * and inserts a protected <hr data-excat-section-break> before every
 * section element except the first. The cleanup transformer never removes
 * tagged elements, their ancestors or protected breaks, so the result is
 * the same whichever transformer runs first.
 *
 * No section styles exist for this template, so no Section Metadata
 * blocks are created. afterTransform only removes the temporary markers.
 */

const SECTION_ATTR = 'data-excat-section';
const BREAK_ATTR = 'data-excat-section-break';

const FALLBACK_SECTIONS = [
  { id: '1', selector: ['#main-container > .sublayout.ui.aligned.segment.grid > .blog-post-header'] },
  { id: '2', selector: ['#main-container > .sublayout.ui.one.column.stackable.grid.container > *'] },
  { id: '3', selector: ['#main-container > .sublayout.ui.aligned.segment.grid.light-gray > .blog-post-list'] },
];

const NON_CONTENT = 'style, script, noscript, link, template, hr';
const MEDIA_SELECTOR = 'img, picture, video';

function normText(s) {
  return (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

/** Text ignoring style/script and empty / UserWay "Empty heading" headings. */
function meaningfulText(el) {
  const clone = el.cloneNode(true);
  clone.querySelectorAll('style, script, noscript, template, link').forEach((n) => n.remove());
  clone.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
    const t = normText(h.textContent);
    if (!h.querySelector(MEDIA_SELECTOR) && (t === '' || /^empty heading$/i.test(t))) h.remove();
  });
  return normText(clone.textContent);
}

function isContentEmpty(el) {
  return !el.querySelector(MEDIA_SELECTOR) && meaningfulText(el) === '';
}

function queryFirstMatching(document, selectors) {
  const list = Array.isArray(selectors) ? selectors : [selectors];
  for (let i = 0; i < list.length; i += 1) {
    let found = [];
    try {
      found = [...document.querySelectorAll(list[i])];
    } catch (e) {
      found = [];
    }
    if (found.length) return found;
  }
  return [];
}

function getSections(payload) {
  const tpl = payload && payload.template;
  if (tpl && Array.isArray(tpl.sections) && tpl.sections.length) return tpl.sections;
  return FALLBACK_SECTIONS;
}

export default function transform(hookName, element, payload) {
  const document = (element && element.ownerDocument) || (payload && payload.document);
  if (!document) return;

  if (hookName === 'beforeTransform') {
    // Idempotent: if sections are already tagged, do nothing.
    if (document.querySelector(`[${SECTION_ATTR}]`)) return;

    const sections = getSections(payload);
    const tagged = [];

    sections.forEach((section) => {
      const candidates = queryFirstMatching(document, section.selector);
      candidates.forEach((el) => {
        if (el.matches(NON_CONTENT)) {
          // inline <style>/<script> siblings in the body wrapper are not sections
          if (!el.matches('hr')) el.remove();
          return;
        }
        if (isContentEmpty(el)) {
          // style-only wrappers and empty children (e.g. empty .page-content)
          el.remove();
          return;
        }
        if (tagged.includes(el)) return;
        el.setAttribute(SECTION_ATTR, section.id || String(tagged.length + 1));
        tagged.push(el);
      });
    });

    // Insert breaks in document order; walk in reverse so earlier nodes are untouched.
    const ordered = tagged.slice().sort((a, b) => {
      if (a === b) return 0;
      // eslint-disable-next-line no-bitwise
      return a.compareDocumentPosition(b) & 4 ? -1 : 1;
    });
    for (let i = ordered.length - 1; i >= 1; i -= 1) {
      const el = ordered[i];
      const prev = el.previousElementSibling;
      if (prev && prev.matches(`hr[${BREAK_ATTR}]`)) continue;
      const hr = document.createElement('hr');
      hr.setAttribute(BREAK_ATTR, '');
      el.before(hr);
    }
  }

  if (hookName === 'afterTransform') {
    document.querySelectorAll(`[${SECTION_ATTR}]`).forEach((el) => el.removeAttribute(SECTION_ATTR));
    document.querySelectorAll(`[${BREAK_ATTR}]`).forEach((el) => el.removeAttribute(BREAK_ATTR));
  }
}
