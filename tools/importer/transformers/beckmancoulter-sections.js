/* eslint-disable */
/* global WebImporter */

/**
 * Section transformer for beckmancoulter.com learning-and-events pages.
 *
 * Inserts an <hr> section break before each non-first section from
 * payload.template.sections. The category sections on this page are flat
 * siblings (div.page-content heading followed by media-showcase rows), so the
 * break goes directly before the heading element.
 *
 * Template section selectors include positional (:nth-of-type) fallbacks that
 * are only valid on the untouched source DOM; the cleanup transformer removes
 * spacers and wraps rows, shifting those indexes. Every candidate match is
 * therefore validated against the section name (heading text), and a
 * heading-text lookup is used as the final fallback.
 *
 * Styled sections get a Section Metadata block in afterTransform (all styles
 * are currently null for this template, so none is emitted).
 */

const MARKER_ATTR = 'data-excat-section-id';

function norm(text) {
  return (text || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function safeQuery(root, selector) {
  try {
    return root.querySelector(selector);
  } catch (e) {
    return null;
  }
}

function headingMatches(el, name) {
  if (!el || !name) return false;
  const h = el.matches('h1, h2, h3, h4, h5, h6') ? el : el.querySelector('h1, h2, h3, h4, h5, h6');
  if (!h) return false;
  return norm(h.textContent).startsWith(norm(name));
}

function findByHeading(element, name) {
  const headings = [...element.querySelectorAll('h1, h2, h3, h4, h5, h6')];
  const h = headings.find((hd) => norm(hd.textContent).startsWith(norm(name)));
  if (!h) return null;
  return h.closest('div.page-content') || h;
}

function findSectionElement(element, section, index) {
  const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
  for (const sel of selectors) {
    if (!sel) continue;
    const el = safeQuery(element, sel);
    if (!el) continue;
    // first section (intro) has no heading named after it; accept direct match
    if (index === 0 || headingMatches(el, section.name)) return el;
  }
  if (index === 0) {
    const intro = element.querySelector('.intro-content');
    return intro ? (intro.closest('div.sublayout') || intro) : null;
  }
  return findByHeading(element, section.name);
}

export default function transform(hookName, element, payload) {
  // all import scripts load every transformer; only run for this template
  if (!payload || !payload.template || payload.template.name !== 'learning-and-events') return;

  const sections = (payload && payload.template && payload.template.sections) || [];
  if (sections.length < 2) return;
  const document = element.ownerDocument;

  if (hookName === 'beforeTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const el = findSectionElement(element, section, i);
      if (!el) continue;
      if (i === 0) {
        // a styled first section needs a temporary marker to anchor metadata
        if (section.style) {
          const hr = document.createElement('hr');
          hr.setAttribute(MARKER_ATTR, section.id);
          el.before(hr);
        }
        continue;
      }
      const hr = document.createElement('hr');
      if (section.style) hr.setAttribute(MARKER_ATTR, section.id);
      el.before(hr);
    }
  }

  if (hookName === 'afterTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const marker = element.querySelector(`hr[${MARKER_ATTR}="${section.id}"]`);
      if (!section.style) {
        if (marker) marker.removeAttribute(MARKER_ATTR);
        continue;
      }
      // metadata goes at the end of the section: before the next break or at the end
      const metadata = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      let anchor = marker;
      if (!anchor) {
        const el = findSectionElement(element, section, i);
        if (!el) continue;
        anchor = el;
      }
      let end = anchor.nextElementSibling;
      while (end && end.tagName !== 'HR') end = end.nextElementSibling;
      if (end) end.before(metadata);
      else anchor.parentElement.append(metadata);

      if (marker) {
        if (i === 0) marker.remove();
        else marker.removeAttribute(MARKER_ATTR);
      }
    }
  }
}
