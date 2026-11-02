/* eslint-disable */
/* global WebImporter */

/**
 * Section transformer for www.mybeckman.in.
 * beforeTransform: insert <hr> section breaks (while parser targets still exist),
 *   marking styled sections with a temporary data-excat-section-id.
 * afterTransform: insert Section Metadata blocks for styled sections and
 *   clean up temporary markers.
 */

const MARKER = 'data-excat-section-id';

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

export default function transform(hookName, element, payload) {
  const sections = payload && payload.template && payload.template.sections;
  if (!sections || sections.length < 2) return;
  const doc = element.ownerDocument || document;

  if (hookName === 'beforeTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const el = findSectionEl(element, section);
      if (!el) continue;
      if (i > 0 || section.style) {
        const hr = doc.createElement('hr');
        if (section.style) hr.setAttribute(MARKER, section.id);
        el.before(hr);
      }
    }
  }

  if (hookName === 'afterTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;
      const marker = element.querySelector(`hr[${MARKER}="${section.id}"]`);
      const sectionEl = marker ? null : findSectionEl(element, section);
      const meta = WebImporter.Blocks.createBlock(doc, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });

      if (marker) {
        // Place metadata at the end of this section: before the next <hr> or at end of parent
        let end = marker.nextElementSibling;
        while (end && end.tagName !== 'HR') end = end.nextElementSibling;
        if (end) end.before(meta);
        else marker.parentNode.appendChild(meta);

        if (i === 0) marker.remove();
        else marker.removeAttribute(MARKER);
      } else if (sectionEl) {
        sectionEl.after(meta);
      }
    }
  }
}
