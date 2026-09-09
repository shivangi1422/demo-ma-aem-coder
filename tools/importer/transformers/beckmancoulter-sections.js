/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Beckman Coulter section breaks + section metadata.
 * Inserts an <hr> before every non-first section (from page-templates.json
 * template.sections) so the imported document is split into 11 sections.
 * All sections in the "products" template have style: null, so no Section
 * Metadata blocks are produced — the metadata loop is retained for reuse if a
 * future template on this site introduces styled sections.
 *
 * Section selectors are DOM-verified boundaries taken directly from
 * page-templates.json (derived from migration-work/cleaned.html). See the
 * reference implementation for why breaks are inserted in beforeTransform
 * (parsers replace section elements between hooks) with a marker anchor for
 * metadata in afterTransform.
 */
const SECTION_MARKER_ATTR = 'data-excat-section-id';

export default function transform(hookName, element, payload) {
  const sections = (payload.template && payload.template.sections) || [];

  if (hookName === 'beforeTransform') {
    // Insert breaks now, before parsers can replace any section element.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (i === 0 && !section.style) continue; // first section: no leading break needed
      const sectionEl = element.querySelector(section.selector);
      if (!sectionEl) continue; // selector didn't match — skip, never guess

      const hr = document.createElement('hr');
      if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
      sectionEl.before(hr);
    }
  }

  if (hookName === 'afterTransform') {
    // Anchor each styled section's Section Metadata block to its surviving marker
    // (or the original element for section 0). No-op for products (all style null).
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;

      const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
      const anchor = marker || element.querySelector(section.selector);
      if (!anchor) continue;

      const metadataBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      anchor.after(metadataBlock);

      if (marker) {
        marker.removeAttribute(SECTION_MARKER_ATTR);
        if (i === 0) marker.remove();
      }
    }
  }
}
