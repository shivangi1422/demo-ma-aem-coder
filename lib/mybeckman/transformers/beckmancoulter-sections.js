/* eslint-disable */
/* global WebImporter */

/**
 * Beckman Coulter sections transformer (mybeckman.in inner-page templates).
 * Same logic as the home template's copy (mybeckman-home/transformers): section styles
 * and, when the template has `sectionAnchors` (keys = section ids), an `anchor` row.
 *
 * Sections come from payload.template.sections (selectors tried in order;
 * the first matching element is the section element); anchors come from
 * payload.template.sectionAnchors (keys are section ids). Without template sections the
 * service-template fallback below is used (styles only, no anchors).
 *
 * beforeTransform (while parser target elements still exist):
 *   - tags each section element with [data-excat-section="<id>"]
 *   - inserts a protected <hr data-excat-section-break data-excat-break-for="<id>">
 *     before every non-first section
 *   - for a LAST section with metadata, inserts a temporary
 *     <hr data-excat-section-end="<id>"> after it (end-of-section anchor)
 *   - a FIRST section with metadata gets no break (it would open an empty
 *     section); its Section Metadata goes before the next section's break
 *
 * afterTransform (parsers have replaced the block elements):
 *   - for every section with a style and/or anchor, inserts a Section
 *     Metadata block (rows: style, anchor) at the end of that section: right
 *     before the next section's break, or in place of the end marker for the
 *     last section
 *   - removes the temporary attributes and end markers
 *
 * The cleanup transformer never removes tagged elements, protected breaks or
 * end markers, so the result is the same whichever transformer runs first.
 */

const SECTION_ATTR = 'data-excat-section';
const BREAK_ATTR = 'data-excat-section-break';
const BREAK_FOR_ATTR = 'data-excat-break-for';
const END_ATTR = 'data-excat-section-end';

const FALLBACK_SECTIONS = [
  { id: '1', selector: ['#main .bc-rich-text:has(> .hero)'], style: null },
  { id: '2', selector: ['#main .bc-rich-text:has(.Section__intro)'], style: 'highlight' },
  { id: '3', selector: ['#main .bc-rich-text:has(.ServiceCards)'], style: null },
  { id: '4', selector: ['#main .bc-rich-text:has(> #getInTouch)'], style: 'highlight' },
];

const FALLBACK_ANCHORS = {};

function getSections(payload) {
  const tpl = payload && payload.template;
  if (tpl && Array.isArray(tpl.sections) && tpl.sections.length) return tpl.sections;
  return FALLBACK_SECTIONS;
}

function getAnchors(payload) {
  const tpl = payload && payload.template;
  if (tpl && Array.isArray(tpl.sections) && tpl.sections.length) return tpl.sectionAnchors || {};
  return FALLBACK_ANCHORS;
}

/** Ordered metadata cells for a section; null when it has none. */
function metadataCells(section, anchors) {
  const cells = {};
  if (section.style) cells.style = String(section.style);
  const anchor = anchors[String(section.id)];
  if (anchor) cells.anchor = String(anchor);
  return Object.keys(cells).length ? cells : null;
}

function findSectionElement(document, selectors) {
  const list = Array.isArray(selectors) ? selectors : [selectors];
  for (let i = 0; i < list.length; i += 1) {
    let el = null;
    try {
      el = document.querySelector(list[i]);
    } catch (e) {
      el = null;
    }
    if (el) return el;
  }
  return null;
}

function createSectionMetadata(document, cells) {
  if (typeof WebImporter !== 'undefined' && WebImporter.Blocks && WebImporter.Blocks.createBlock) {
    return WebImporter.Blocks.createBlock(document, {
      name: 'Section Metadata',
      cells,
    });
  }
  // Fallback (outside the importer runtime): equivalent block table.
  const table = document.createElement('table');
  const head = document.createElement('tr');
  const th = document.createElement('th');
  th.setAttribute('colspan', '2');
  th.textContent = 'Section Metadata';
  head.append(th);
  table.append(head);
  Object.entries(cells).forEach(([k, v]) => {
    const tr = document.createElement('tr');
    const key = document.createElement('td');
    key.textContent = k;
    const val = document.createElement('td');
    val.textContent = v;
    tr.append(key, val);
    table.append(tr);
  });
  return table;
}

export default function transform(hookName, element, payload) {
  const document = (element && element.ownerDocument) || (payload && payload.document);
  if (!document) return;
  const sections = getSections(payload);
  const anchors = getAnchors(payload);

  if (hookName === 'beforeTransform') {
    // Idempotent: if sections are already tagged, do nothing.
    if (document.querySelector(`[${SECTION_ATTR}]`)) return;

    const found = [];
    sections.forEach((section) => {
      const el = findSectionElement(document, section.selector);
      if (el && !found.some((f) => f.el === el)) found.push({ section, el });
    });

    found.forEach(({ section, el }) => el.setAttribute(SECTION_ATTR, String(section.id)));

    // Reverse walk: insert protected breaks before every non-first section.
    for (let i = found.length - 1; i >= 1; i -= 1) {
      const { section, el } = found[i];
      const before = el.previousElementSibling;
      if (before && before.matches(`hr[${BREAK_ATTR}]`)) continue;
      const hr = document.createElement('hr');
      hr.setAttribute(BREAK_ATTR, '');
      hr.setAttribute(BREAK_FOR_ATTR, String(section.id));
      el.before(hr);
    }

    // Last section with metadata: end-of-section anchor for its Section Metadata.
    const last = found[found.length - 1];
    if (last && metadataCells(last.section, anchors)) {
      const end = document.createElement('hr');
      end.setAttribute(END_ATTR, String(last.section.id));
      last.el.after(end);
    }
  }

  if (hookName === 'afterTransform') {
    // Reverse walk: Section Metadata at the end of each section with style/anchor.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const cells = metadataCells(section, anchors);
      if (!cells) continue;
      const id = String(section.id);
      const endMarker = document.querySelector(`hr[${END_ATTR}="${id}"]`);
      if (endMarker) {
        endMarker.replaceWith(createSectionMetadata(document, cells));
        continue;
      }
      // Next section that actually has a break in the document.
      let nextBreak = null;
      for (let j = i + 1; j < sections.length && !nextBreak; j += 1) {
        nextBreak = document.querySelector(`hr[${BREAK_FOR_ATTR}="${sections[j].id}"]`);
      }
      if (nextBreak) {
        nextBreak.before(createSectionMetadata(document, cells));
        continue;
      }
      const sectionEl = document.querySelector(`[${SECTION_ATTR}="${id}"]`);
      if (sectionEl) sectionEl.after(createSectionMetadata(document, cells));
    }

    document.querySelectorAll(`hr[${END_ATTR}]`).forEach((el) => el.remove());
    document.querySelectorAll(`[${SECTION_ATTR}]`).forEach((el) => el.removeAttribute(SECTION_ATTR));
    document.querySelectorAll(`[${BREAK_FOR_ATTR}]`).forEach((el) => el.removeAttribute(BREAK_FOR_ATTR));
    document.querySelectorAll(`[${BREAK_ATTR}]`).forEach((el) => el.removeAttribute(BREAK_ATTR));
  }
}
