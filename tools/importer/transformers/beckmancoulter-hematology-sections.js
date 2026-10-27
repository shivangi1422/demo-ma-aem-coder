/* eslint-disable */
/* global WebImporter */

/**
 * Section transformer for the beckmancoulter.com `solutions-hematology` page
 * (/en/solutions/hematology-solution). Same logic as
 * beckmancoulter-solutions-sections.js, guarded on its own template name.
 *
 * Only runs when payload.template.name === 'solutions-hematology' (every import script
 * loads all transformers in this folder).
 *
 * Most section selectors in page-templates.json are generic
 * (`... > div.page-content`, `... > div.intro-content`) and match the first
 * such element on the page, so each section is located by its `name`
 * (case-insensitive, whitespace-normalised heading prefix match). Sections
 * with a specific class selector (hero, infection, companies, solutions,
 * resources, disclaimer) use the selector first, the heading second.
 *
 * The matched element is climbed to the top-level sibling under
 * `#main-container > div.sublayout`, so the <hr> is never inserted into
 * nested markup. Multi-element sections (story, biomarkers, partnering) need
 * no extra handling: they run until the next section's <hr>.
 *
 * beforeTransform: reverse walk, <hr> before each non-first section; styled
 *   sections get a temporary data-excat-section-id marker on their <hr>
 *   (a styled first section would get a temporary marked <hr>).
 * afterTransform: reverse walk, Section Metadata (style) appended at the end
 *   of each styled section (before the next <hr>), marker removed; the first
 *   section's temporary <hr> is removed.
 */

const TEMPLATE_NAME = 'solutions-hematology';
const MARKER_ATTR = 'data-excat-section-id';
const GENERIC_SELECTOR = /div\.(page-content|intro-content)\s*(:[\w-]+(\([^)]*\))?)?\s*$/;

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

function contentRoot(element) {
  return element.querySelector('#main-container') || element;
}

/** climb to the direct child of `#main-container > div.sublayout` */
function topLevel(el, element) {
  const root = contentRoot(element);
  let node = el;
  while (node && node.parentElement && node.parentElement !== root && node.parentElement !== element) {
    const parent = node.parentElement;
    if (parent.matches('div.sublayout') && parent.parentElement === root) return node;
    node = parent;
  }
  return el;
}

function findByName(element, name) {
  const target = norm(name);
  if (!target) return null;
  const headings = [...contentRoot(element).querySelectorAll('h1, h2, h3, h4, h5, h6')];
  const h = headings.find((hd) => norm(hd.textContent).startsWith(target));
  return h ? topLevel(h, element) : null;
}

function findBySelector(element, section) {
  const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
  for (const sel of selectors) {
    if (!sel) continue;
    const el = safeQuery(element, sel);
    if (el) return topLevel(el, element);
  }
  return null;
}

function isGeneric(section) {
  const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
  return selectors.every((sel) => !sel || GENERIC_SELECTOR.test(sel));
}

function findSectionElement(element, section) {
  if (isGeneric(section)) {
    return findByName(element, section.name) || findBySelector(element, section);
  }
  return findBySelector(element, section) || findByName(element, section.name);
}

export default function transform(hookName, element, payload) {
  const template = payload && payload.template;
  if (!template || template.name !== TEMPLATE_NAME) return;
  const sections = template.sections || [];
  if (sections.length < 2) return;
  const document = element.ownerDocument;

  if (hookName === 'beforeTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const el = findSectionElement(element, section);
      if (!el) continue;
      if (i === 0 && !section.style) continue;
      const hr = document.createElement('hr');
      if (section.style) hr.setAttribute(MARKER_ATTR, section.id);
      el.before(hr);
    }
  }

  if (hookName === 'afterTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;
      const marker = element.querySelector(`hr[${MARKER_ATTR}="${section.id}"]`);
      let anchor = marker;
      if (!anchor) {
        anchor = findSectionElement(element, section);
        if (!anchor) continue;
      }

      const metadata = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      // end of section: before the next sibling <hr>, else end of the parent
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
