/* eslint-disable */
/* global WebImporter */

/**
 * Section transformer for the 9 mybeckman.in templates (`mybeckman-<slug>`).
 *
 * Only runs when payload.template.name starts with "mybeckman-" (every import
 * script loads all transformers in this folder). Must run after
 * mybeckman-cleanup.js within the same hook.
 *
 * Section starts: the element tagged data-mb-section="<id>" by the cleanup
 * (tagged before it restructures the DOM), else the first match of
 * template.sections[].selector (tried in order).
 *
 * Break point: if the start lies inside a block instance, the break goes
 * before the outermost instance (a block is never split). Otherwise it climbs
 * to the outermost ancestor the start is the first element of (so the <hr>
 * sits outside empty-leading wrappers such as div.bc-rich-text), without
 * climbing past #main / the page holders or another section's start.
 *
 * beforeTransform (parser targets still exist): reverse walk in document
 * order, <hr> before every non-first section; styled sections get a marker
 * on their <hr> (a styled first section gets a temporary marked <hr>) and an
 * end placeholder before the next section's <hr> (or at the end of the
 * page). The section background (clinical-trials jump nav gradient,
 * data-mb-section-bg recorded by the cleanup) is copied onto the placeholder.
 *
 * afterTransform: reverse walk, every placeholder becomes a Section Metadata
 * block (style, comma-separated; background image when recorded); markers
 * are removed and the first section's temporary <hr> is dropped.
 */

const TEMPLATE_PREFIX = 'mybeckman-';
const ORIGIN = 'https://www.mybeckman.in';
const SECTION_ATTR = 'data-mb-section';
const BG_ATTR = 'data-mb-section-bg';
const MARKER_ATTR = 'data-excat-section-id';
const FIRST_ATTR = 'data-excat-section-first';
const END_ATTR = 'data-excat-section-end';
const END_BG_ATTR = 'data-excat-section-bg';

// never climb past these (page holders around the article)
const STOP_SELECTOR = 'body, #wrapper, #main, #main > div.main-holder, #main > div.main-holder > div.container';

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

function blockInstances(element, template) {
  const set = new Set();
  ((template && template.blocks) || []).forEach((block) => {
    (block.instances || []).forEach((sel) => {
      safeQueryAll(element, sel).forEach((el) => set.add(el));
    });
  });
  return [...set];
}

function findSectionStart(element, section) {
  const id = String(section.id).replace(/["\\]/g, '');
  const tagged = safeQuery(element, `[${SECTION_ATTR}="${id}"]`);
  if (tagged) return tagged;
  const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
  for (const sel of selectors) {
    if (!sel) continue;
    const el = safeQuery(element, sel);
    if (el) return el;
  }
  return null;
}

function breakPoint(el, element, instances, starts) {
  // inside a block instance -> before the outermost instance
  const holders = instances.filter((inst) => inst !== el && inst.contains(el));
  if (holders.length) {
    return holders.reduce((outer, inst) => (inst.contains(outer) ? inst : outer));
  }
  let node = el;
  while (node.parentElement && node.parentElement !== element) {
    const parent = node.parentElement;
    if (parent.matches(STOP_SELECTOR)) break;
    if (parent.firstElementChild !== node) break;
    if (starts.includes(parent)) break;
    node = parent;
  }
  return node;
}

function docOrder(a, b) {
  if (a === b) return 0;
  // eslint-disable-next-line no-bitwise
  return (a.compareDocumentPosition(b) & 4 /* DOCUMENT_POSITION_FOLLOWING */) ? -1 : 1;
}

function backgroundOf(el) {
  const holder = el.hasAttribute(BG_ATTR) ? el : safeQuery(el, `[${BG_ATTR}]`);
  if (holder) return holder.getAttribute(BG_ATTR);
  // standalone run (no cleanup): the gradient image itself
  const img = safeQuery(el, ':scope > img[alt="gradient background"]');
  const src = img && img.getAttribute('src');
  return src ? new URL(src, `${ORIGIN}/`).href : '';
}

export default function transform(hookName, element, payload) {
  const template = payload && payload.template;
  if (!template || typeof template.name !== 'string' || !template.name.startsWith(TEMPLATE_PREFIX)) return;
  const sections = template.sections || [];
  if (sections.length < 2) return;
  if (!element || !element.querySelectorAll) return;
  const document = element.ownerDocument;

  if (hookName === 'beforeTransform') {
    const instances = blockInstances(element, template);
    const resolved = sections
      .map((section) => ({ section, start: findSectionStart(element, section) }))
      .filter((s) => s.start);
    const starts = resolved.map((s) => s.start);
    const found = resolved
      .map((s) => ({ ...s, at: breakPoint(s.start, element, instances, starts) }))
      .sort((a, b) => docOrder(a.at, b.at));

    for (let k = found.length - 1; k >= 0; k -= 1) {
      const { section, start, at } = found[k];
      const style = styleOf(section);
      const isFirst = k === 0;
      const next = found[k + 1];

      if (style) {
        // end of this section = just before the next section's <hr>
        const end = document.createElement('div');
        end.setAttribute(END_ATTR, section.id);
        const bg = backgroundOf(start);
        if (bg) end.setAttribute(END_BG_ATTR, bg);
        const nextHr = next && next.at.previousElementSibling
          && next.at.previousElementSibling.tagName === 'HR'
          ? next.at.previousElementSibling : null;
        if (nextHr) nextHr.before(end);
        else if (next) next.at.before(end);
        else element.append(end);
      }

      if (isFirst && !style) continue;
      const hr = document.createElement('hr');
      if (style) hr.setAttribute(MARKER_ATTR, section.id);
      if (isFirst) hr.setAttribute(FIRST_ATTR, 'true');
      at.before(hr);
    }

    // section tags are no longer needed
    safeQueryAll(element, `[${SECTION_ATTR}]`).forEach((el) => el.removeAttribute(SECTION_ATTR));
  }

  if (hookName === 'afterTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const style = styleOf(section);
      if (!style) continue;
      const id = String(section.id).replace(/["\\]/g, '');
      const marker = safeQuery(element, `hr[${MARKER_ATTR}="${id}"]`);
      const end = safeQuery(element, `[${END_ATTR}="${id}"]`);
      if (!marker && !end) continue;

      const cells = { style };
      const bg = end && end.getAttribute(END_BG_ATTR);
      if (bg) {
        const img = document.createElement('img');
        img.src = bg;
        img.alt = '';
        cells.background = img;
      }
      const metadata = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells,
      });

      if (end) {
        end.replaceWith(metadata);
      } else {
        // fallback: before the next <hr> in document order, else end of page
        const hrs = safeQueryAll(element, 'hr');
        const nextHr = hrs.find((hr) => docOrder(marker, hr) < 0 && hr !== marker);
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
    safeQueryAll(element, `[${BG_ATTR}]`).forEach((el) => el.removeAttribute(BG_ATTR));
  }
}
