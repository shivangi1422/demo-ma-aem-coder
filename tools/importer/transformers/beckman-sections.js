/* eslint-disable */
/* global WebImporter */

/**
 * Beckman section transformer.
 * Inserts <hr> section breaks between template sections (beforeTransform, while
 * section elements still exist) and adds Section Metadata for styled sections
 * (afterTransform). For the "software" template both sections have style null,
 * so only the break between rc2 and rc3 is produced.
 */
const MARKER = 'data-excat-section-id';

function findSectionElement(root, section) {
  const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
  for (let i = 0; i < selectors.length; i += 1) {
    const el = selectors[i] && root.querySelector(selectors[i]);
    if (el) return el;
  }
  return null;
}

export default function transform(hookName, element, payload) {
  const sections = (payload && payload.template && payload.template.sections) || [];
  if (sections.length < 2) return;
  const document = element.ownerDocument || payload.document;

  if (hookName === 'beforeTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const sectionEl = findSectionElement(element, section);
      if (!sectionEl) continue;
      // Non-first sections always get a break; a styled first section gets a
      // temporary marker <hr> that is removed in afterTransform.
      if (i > 0 || section.style) {
        const hr = document.createElement('hr');
        if (section.style) hr.setAttribute(MARKER, section.id);
        sectionEl.parentNode.insertBefore(hr, sectionEl);
      }
    }
  }

  if (hookName === 'afterTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;
      const marker = element.querySelector(`hr[${MARKER}="${section.id}"]`);
      const metadata = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });

      if (marker) {
        // Place metadata at the end of the section that starts at this marker
        let end = marker.nextElementSibling;
        while (end && end.nextElementSibling && end.nextElementSibling.tagName !== 'HR') {
          end = end.nextElementSibling;
        }
        if (end) end.after(metadata);
        else marker.after(metadata);
        if (i === 0) marker.remove();
        else marker.removeAttribute(MARKER);
      } else {
        const sectionEl = findSectionElement(element, section);
        if (sectionEl) sectionEl.after(metadata);
      }
    }
  }
}
