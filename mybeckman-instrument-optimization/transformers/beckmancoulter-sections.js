/* eslint-disable */
/* global WebImporter */

/**
 * Beckman Coulter sections transformer (mybeckman.in service template).
 *
 * Sections come from payload.template.sections (selectors tried in order;
 * the first matching element is the section element):
 *   1. hero            #main .bc-rich-text:has(> .hero)
 *   2. stats           #main .bc-rich-text:has(.Section__intro)   style highlight
 *   3. service cards   #main .bc-rich-text:has(.ServiceCards)
 *   4. get in touch    #main .bc-rich-text:has(> #getInTouch)     style highlight
 *
 * beforeTransform (while parser target elements still exist):
 *   - tags each section element with [data-excat-section="<id>"]
 *   - inserts a protected <hr data-excat-section-break data-excat-break-for="<id>">
 *     before every non-first section
 *   - for a styled LAST section, inserts a temporary
 *     <hr data-excat-section-end="<id>"> after it (end-of-section anchor)
 *   - a styled FIRST section gets no break (it would open an empty section);
 *     its Section Metadata goes before the next section's break
 *
 * afterTransform (parsers have replaced the section elements):
 *   - for every styled section, inserts a Section Metadata block at the end
 *     of that section: right before the next section's break, or in place of
 *     the end marker for the last section
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

function getSections(payload) {
  const tpl = payload && payload.template;
  if (tpl && Array.isArray(tpl.sections) && tpl.sections.length) return tpl.sections;
  return FALLBACK_SECTIONS;
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

function createSectionMetadata(document, style) {
  if (typeof WebImporter !== 'undefined' && WebImporter.Blocks && WebImporter.Blocks.createBlock) {
    return WebImporter.Blocks.createBlock(document, {
      name: 'Section Metadata',
      cells: { style },
    });
  }
  // Fallback (outside the importer runtime): equivalent block table.
  const table = document.createElement('table');
  table.innerHTML = `<tr><th colspan="2">Section Metadata</th></tr><tr><td>style</td><td>${style}</td></tr>`;
  return table;
}

export default function transform(hookName, element, payload) {
  const document = (element && element.ownerDocument) || (payload && payload.document);
  if (!document) return;
  const sections = getSections(payload);

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

    // Styled last section: end-of-section anchor for its Section Metadata.
    const last = found[found.length - 1];
    if (last && last.section.style) {
      const end = document.createElement('hr');
      end.setAttribute(END_ATTR, String(last.section.id));
      last.el.after(end);
    }
  }

  if (hookName === 'afterTransform') {
    // Reverse walk: Section Metadata at the end of each styled section.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;
      const id = String(section.id);
      const endMarker = document.querySelector(`hr[${END_ATTR}="${id}"]`);
      if (endMarker) {
        endMarker.replaceWith(createSectionMetadata(document, section.style));
        continue;
      }
      // Next section that actually has a break in the document.
      let nextBreak = null;
      for (let j = i + 1; j < sections.length && !nextBreak; j += 1) {
        nextBreak = document.querySelector(`hr[${BREAK_FOR_ATTR}="${sections[j].id}"]`);
      }
      if (nextBreak) {
        nextBreak.before(createSectionMetadata(document, section.style));
        continue;
      }
      const sectionEl = document.querySelector(`[${SECTION_ATTR}="${id}"]`);
      if (sectionEl) sectionEl.after(createSectionMetadata(document, section.style));
    }

    document.querySelectorAll(`hr[${END_ATTR}]`).forEach((el) => el.remove());
    document.querySelectorAll(`[${SECTION_ATTR}]`).forEach((el) => el.removeAttribute(SECTION_ATTR));
    document.querySelectorAll(`[${BREAK_FOR_ATTR}]`).forEach((el) => el.removeAttribute(BREAK_FOR_ATTR));
    document.querySelectorAll(`[${BREAK_ATTR}]`).forEach((el) => el.removeAttribute(BREAK_ATTR));
  }
}
