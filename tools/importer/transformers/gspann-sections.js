/* eslint-disable */
/* global WebImporter */

/**
 * Section transformer for the GSPANN "services" template.
 *
 * Only runs when payload.template.name === 'services' (every import script
 * loads all transformers in this folder). Must run after gspann-cleanup.js
 * within the same hook.
 *
 * Section starts: first match of template.sections[].selector (tried in
 * order). All section selectors are direct children of #main-content
 * (nav.secondary-nav, section.service-hero, #services, #platforms, #approach,
 * #results, #insights, #connect).
 *
 * beforeTransform (parser targets still exist): reverse walk in document
 * order, <hr> before every non-first section. Styled sections get a marker
 * (data-excat-section-id) on their <hr>; the styled first section
 * (blue-red-gradient anchor nav) gets a temporary marked <hr>. Each styled
 * section also gets an end placeholder right after the section element, so
 * the Section Metadata lands at the end of the section even when a parser
 * replaces the section element itself.
 *
 * afterTransform: reverse walk; every placeholder becomes a Section Metadata
 * block (style). Markers are removed and the first section's temporary <hr>
 * is dropped so it does not open an empty section.
 */

const TEMPLATE_NAME = 'services';
const MARKER_ATTR = 'data-excat-section-id';
const FIRST_ATTR = 'data-excat-section-first';
const END_ATTR = 'data-excat-section-end';

function safeQuery(root, selector) {
  try {
    return root.querySelector(selector);
  } catch (e) {
    return null;
  }
}

function safeQueryAll(root, selector) {
  try {
    return [...root.querySelectorAll(selector)];
  } catch (e) {
    return [];
  }
}

function styleOf(section) {
  const { style } = section;
  if (!style) return '';
  const list = Array.isArray(style) ? style : String(style).split(',');
  return list.map((s) => String(s).trim()).filter(Boolean).join(', ');
}

function findSectionStart(element, section) {
  const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
  for (const sel of selectors) {
    if (!sel) continue;
    const el = safeQuery(element, sel);
    if (el) return el;
  }
  return null;
}

function docOrder(a, b) {
  if (a === b) return 0;
  // eslint-disable-next-line no-bitwise
  return (a.compareDocumentPosition(b) & 4 /* DOCUMENT_POSITION_FOLLOWING */) ? -1 : 1;
}

function idOf(section) {
  return String(section.id).replace(/["\\]/g, '');
}

export default function transform(hookName, element, payload) {
  const template = payload && payload.template;
  if (!template || template.name !== TEMPLATE_NAME) return;
  const sections = template.sections || [];
  if (sections.length < 2) return;
  if (!element || !element.querySelectorAll) return;
  const document = element.ownerDocument;

  if (hookName === 'beforeTransform') {
    const found = sections
      .map((section) => ({ section, start: findSectionStart(element, section) }))
      .filter((s) => s.start)
      .sort((a, b) => docOrder(a.start, b.start));

    for (let k = found.length - 1; k >= 0; k -= 1) {
      const { section, start } = found[k];
      const style = styleOf(section);
      const isFirst = k === 0;

      if (style) {
        const end = document.createElement('div');
        end.setAttribute(END_ATTR, idOf(section));
        start.after(end);
      }

      if (isFirst && !style) continue;
      const hr = document.createElement('hr');
      if (style) hr.setAttribute(MARKER_ATTR, idOf(section));
      if (isFirst) hr.setAttribute(FIRST_ATTR, 'true');
      start.before(hr);
    }
  }

  if (hookName === 'afterTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const style = styleOf(section);
      if (!style) continue;
      const id = idOf(section);
      const marker = safeQuery(element, `hr[${MARKER_ATTR}="${id}"]`);
      const end = safeQuery(element, `[${END_ATTR}="${id}"]`);
      if (!marker && !end) continue;

      const metadata = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style },
      });

      if (end) {
        end.replaceWith(metadata);
      } else {
        // fallback: before the next <hr> after the marker, else end of page
        const nextHr = safeQueryAll(element, 'hr')
          .find((hr) => hr !== marker && docOrder(marker, hr) < 0);
        if (nextHr) nextHr.before(metadata);
        else element.append(metadata);
      }

      if (marker) {
        // the first section's <hr> was temporary (it would open an empty section)
        if (marker.hasAttribute(FIRST_ATTR)) marker.remove();
        else marker.removeAttribute(MARKER_ATTR);
      }
    }
    safeQueryAll(element, `[${END_ATTR}]`).forEach((el) => el.remove());
    safeQueryAll(element, `[${FIRST_ATTR}]`).forEach((el) => el.remove());
    safeQueryAll(element, `[${MARKER_ATTR}]`).forEach((el) => el.removeAttribute(MARKER_ATTR));
  }
}
