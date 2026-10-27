/* eslint-disable */
/* global WebImporter */

/**
 * Beckman Coulter sections transformer (solutions template).
 *
 * The solution-story body varies per page, so sections are derived
 * generically from payload.template.sections (selectors tried in order):
 *   - the video hero (.video-hero-carousel)
 *   - EACH non-empty element child of the body wrapper, in DOM order.
 *     Inline <style>/<script> siblings, style-only wrappers, text-empty,
 *     media-less children (spacers, empty .page-content), .line-break and
 *     the hidden #confirmform thank-you message are never sections.
 *   - EXCEPTION: a Marketo form joins the section of the .page-content
 *     immediately before it (its heading), so no break goes before the form.
 *
 * beforeTransform tags every section element with [data-excat-section]
 * and inserts a protected <hr data-excat-section-break> before the first
 * element of every section except the first. The cleanup transformer never
 * removes tagged elements, their ancestors or protected breaks, so the
 * result is the same whichever transformer runs first.
 *
 * No section styles exist for this template, so no Section Metadata blocks
 * are created. afterTransform only removes the temporary markers.
 */

const SECTION_ATTR = 'data-excat-section';
const BREAK_ATTR = 'data-excat-section-break';

const FALLBACK_SECTIONS = [
  { id: '1', selector: ['#main-container > .sublayout.ui.aligned > .video-hero-carousel'] },
  { id: '2', selector: ['#main-container > .sublayout.stackable > *'] },
];

const NON_CONTENT = 'style, script, noscript, link, template, hr, iframe#MktoForms2XDIframe';
const NEVER_SECTION = '.line-break, #confirmform';
const FORM_SELECTOR = 'form';
const FORM_HEADING_SELECTOR = '.page-content';
const MEDIA_SELECTOR = 'img, picture, video, iframe, form';

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
  return !el.matches(MEDIA_SELECTOR) && !el.querySelector(MEDIA_SELECTOR) && meaningfulText(el) === '';
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

function inDocumentOrder(a, b) {
  if (a === b) return 0;
  // eslint-disable-next-line no-bitwise
  return a.compareDocumentPosition(b) & 4 ? -1 : 1;
}

export default function transform(hookName, element, payload) {
  const document = (element && element.ownerDocument) || (payload && payload.document);
  if (!document) return;

  if (hookName === 'beforeTransform') {
    // Idempotent: if sections are already tagged, do nothing.
    if (document.querySelector(`[${SECTION_ATTR}]`)) return;

    // 1. Collect candidate section elements (deduplicated, document order).
    const candidates = [];
    getSections(payload).forEach((section) => {
      queryFirstMatching(document, section.selector).forEach((el) => {
        if (candidates.includes(el)) return;
        if (el.matches(NON_CONTENT) || el.matches(NEVER_SECTION)) return;
        if (isContentEmpty(el)) return;
        candidates.push(el);
      });
    });
    candidates.sort(inDocumentOrder);

    // 2. Group: every element starts a new section, except a form that
    //    directly follows its .page-content heading (same parent).
    const groups = [];
    candidates.forEach((el) => {
      const last = groups[groups.length - 1];
      const prev = last && last[last.length - 1];
      if (
        prev
        && el.matches(FORM_SELECTOR)
        && prev.matches(FORM_HEADING_SELECTOR)
        && prev.parentElement === el.parentElement
        && last.length === 1
      ) {
        last.push(el);
        return;
      }
      groups.push([el]);
    });

    // 3. Tag and insert protected breaks (reverse so earlier nodes are untouched).
    groups.forEach((group, i) => {
      group.forEach((el) => el.setAttribute(SECTION_ATTR, String(i + 1)));
    });
    for (let i = groups.length - 1; i >= 1; i -= 1) {
      const first = groups[i][0];
      const before = first.previousElementSibling;
      if (before && before.matches(`hr[${BREAK_ATTR}]`)) continue;
      const hr = document.createElement('hr');
      hr.setAttribute(BREAK_ATTR, '');
      first.before(hr);
    }
  }

  if (hookName === 'afterTransform') {
    document.querySelectorAll(`[${SECTION_ATTR}]`).forEach((el) => el.removeAttribute(SECTION_ATTR));
    document.querySelectorAll(`[${BREAK_ATTR}]`).forEach((el) => el.removeAttribute(BREAK_ATTR));
  }
}
