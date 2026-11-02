/* eslint-disable */
/* global WebImporter */

/**
 * Section transformer for www.mybeckman.in.
 * beforeTransform: insert <hr> section breaks (while parser targets still exist).
 *   Every inserted <hr> carries a temporary data-excat-section-id marker; sections
 *   whose matched element (or its first element child) has an id targeted by an
 *   in-page link (a[href="#id"]) also get data-excat-section-anchor.
 *   The first section found on the page gets no real break: if it needs metadata
 *   a temporary marker <hr> is inserted and removed again in afterTransform.
 * afterTransform: insert Section Metadata (style and/or anchor) at the end of each
 *   section, i.e. before the next section break, then remove the temporary markers.
 */

const MARKER = 'data-excat-section-id';
const ANCHOR = 'data-excat-section-anchor';
const FIRST = 'data-excat-section-first';

const findSectionEl = (root, section) => {
  const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
  for (const sel of selectors) {
    if (!sel) continue;
    try {
      const el = root.querySelector(sel);
      if (el) return el;
    } catch (e) {
      // invalid selector, try next
    }
  }
  return null;
};

const escapeAttr = (value) => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

// id of the section element (or its first element child) that an in-page link targets
const findAnchor = (root, el) => {
  const candidates = [el, el.firstElementChild].filter(Boolean);
  for (const candidate of candidates) {
    const { id } = candidate;
    if (id && root.querySelector(`a[href="#${escapeAttr(id)}"]`)) return id;
  }
  return '';
};

// next section break <hr> after `node` in document order
const nextBreak = (root, node) => [...root.querySelectorAll(`hr[${MARKER}]`)]
  .find((hr) => hr !== node
    // eslint-disable-next-line no-bitwise
    && (node.compareDocumentPosition(hr) & 4 /* DOCUMENT_POSITION_FOLLOWING */));

export default function transform(hookName, element, payload) {
  const sections = payload && payload.template && payload.template.sections;
  if (!sections || sections.length < 2) return;
  const doc = element.ownerDocument || document;

  if (hookName === 'beforeTransform') {
    const found = sections
      .map((section) => ({ section, el: findSectionEl(element, section) }))
      .filter(({ el }) => el);

    // anchors are resolved up front, while hero CTAs (a[href="#..."]) still exist
    found.forEach((entry) => { entry.anchor = findAnchor(element, entry.el); });

    for (let i = found.length - 1; i >= 0; i -= 1) {
      const { section, el, anchor } = found[i];
      // first section on the page: no break unless it needs a metadata marker
      if (i === 0 && !section.style && !anchor) continue;
      const hr = doc.createElement('hr');
      hr.setAttribute(MARKER, section.id);
      if (anchor) hr.setAttribute(ANCHOR, anchor);
      if (i === 0) hr.setAttribute(FIRST, 'true');
      el.before(hr);
    }
  }

  if (hookName === 'afterTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const marker = element.querySelector(`hr[${MARKER}="${section.id}"]`);
      const anchor = marker ? marker.getAttribute(ANCHOR) || '' : '';
      if (!section.style && !anchor) continue;

      const cells = {};
      if (section.style) cells.style = section.style;
      if (anchor) cells.anchor = anchor;
      const meta = WebImporter.Blocks.createBlock(doc, { name: 'Section Metadata', cells });

      if (marker) {
        // end of this section = just before the next section break
        const end = nextBreak(element, marker);
        if (end) end.before(meta);
        else marker.parentNode.appendChild(meta);
      } else {
        const sectionEl = findSectionEl(element, section);
        if (sectionEl) sectionEl.after(meta);
      }
    }

    element.querySelectorAll(`hr[${MARKER}]`).forEach((hr) => {
      if (hr.hasAttribute(FIRST)) {
        hr.remove();
      } else {
        hr.removeAttribute(MARKER);
        hr.removeAttribute(ANCHOR);
      }
    });
  }
}
