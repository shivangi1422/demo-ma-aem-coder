/* eslint-disable */
/* global WebImporter */

/**
 * Beckman Coulter sections transformer (templates: reagents, reagent-product).
 * Inserts <hr> section breaks (beforeTransform, while parser targets still exist)
 * and Section Metadata blocks for styled sections (afterTransform).
 * Sections whose selectors match nothing on a page are skipped (e.g. reagent-product
 * sections absent on the aggregation page). The first section found on the page opens
 * the document and gets no break.
 */

const MARKER = 'data-excat-section-id';

function findSectionElement(root, section) {
  const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
  for (let i = 0; i < selectors.length; i += 1) {
    const sel = selectors[i];
    if (sel) {
      try {
        const el = root.querySelector(sel);
        if (el) return el;
      } catch (e) {
        // invalid selector: try the next one
      }
    }
  }
  return null;
}

export default function transform(hookName, element, payload) {
  const sections = payload && payload.template && payload.template.sections;
  if (!Array.isArray(sections) || sections.length < 2) return;
  const document = element.ownerDocument;

  if (hookName === 'beforeTransform') {
    // Resolve all section elements first (before any DOM change)
    const found = sections.map((section) => findSectionElement(element, section));
    const firstIdx = found.findIndex((el) => el);
    const seen = new Set();
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const el = found[i];
      if (el && !seen.has(el)) {
        seen.add(el);
        if (i !== firstIdx || section.style) {
          const hr = document.createElement('hr');
          if (section.style) hr.setAttribute(MARKER, section.id);
          if (i === firstIdx) hr.setAttribute('data-excat-first-section', '');
          el.before(hr);
        }
      }
    }
  }

  if (hookName === 'afterTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (section.style) {
        const marker = element.querySelector(`hr[${MARKER}="${section.id}"]`);
        const meta = WebImporter.Blocks.createBlock(document, {
          name: 'Section Metadata',
          cells: { style: section.style },
        });

        if (marker) {
          // Section content runs from the marker to the next <hr> sibling (or end of parent)
          let end = marker.nextElementSibling;
          while (end && end.tagName !== 'HR') end = end.nextElementSibling;
          if (end) end.before(meta);
          else marker.parentElement.append(meta);

          marker.removeAttribute(MARKER);
          // First section's temporary <hr> must not open an empty section
          if (marker.hasAttribute('data-excat-first-section')) marker.remove();
        } else {
          const el = findSectionElement(element, section);
          if (el) el.after(meta);
        }
      }
    }
  }
}
