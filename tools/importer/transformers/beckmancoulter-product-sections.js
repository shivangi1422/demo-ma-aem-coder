/* eslint-disable */
/* global WebImporter */

/**
 * Section transformer for beckmancoulter.com PRODUCT pages:
 *  - product-detail-informatics, product-detail-automation, product-category
 *
 * Every import script loads all transformers in this folder, so this one
 * early-returns unless payload.template.name is in PRODUCT_TEMPLATES.
 *
 * Locating sections (template.sections[]):
 *  - selectors are tried in order; when a selector matches several elements
 *    (e.g. div.media-showcase-simple for the Video and Brochure rows) the
 *    candidate is picked by `name` (heading / text prefix, case-insensitive,
 *    whitespace- and punctuation-normalised); elements already claimed by
 *    another section are skipped
 *  - no selector hit -> search by name across the content
 *  - the hit is climbed to its top-level sibling: a direct child of
 *    #main-container (hero div.sublayout-two-column-dynamic, tabs sublayout)
 *    or of a `#main-container > div.sublayout...grid.container` wrapper
 *
 * beforeTransform (reverse walk, parser targets still present):
 *  - <hr> before every non-first section; styled sections get a temporary
 *    data-excat-section-id on their <hr> (a styled first section gets a
 *    temporary marked <hr> that is removed later)
 *  - styled sections also get an empty end placeholder
 *    (div[data-excat-section-end]) right before the next section's <hr>
 *    (or at the end of the content), because sections span nesting levels
 * afterTransform (reverse walk):
 *  - Section Metadata (style) replaces the end placeholder (fallback: before
 *    the next sibling <hr> after the marker), markers removed, first
 *    section's temporary <hr> removed
 */

// Templates this transformer runs for - extend here. (Top-level const, not an
// ES `export`: the transformer validator evaluates the file as a classic
// script where only `export default` is rewritten.)
const PRODUCT_TEMPLATES = [
  'product-detail-informatics',
  'product-detail-automation',
  'product-category',
];

const MARKER_ATTR = 'data-excat-section-id';
const END_ATTR = 'data-excat-section-end';
const FIRST_ATTR = 'data-excat-section-first';
// direct children of #main-container that hold several sections
// (div.sublayout.ui.one.column.stackable.grid.container, and on automation
// pages div.sublayout.ui.aligned.segment.grid with photo-feature, features,
// embed and tabs)
const WRAPPER_SELECTOR = 'div.sublayout.grid';
const BG_ATTR = 'data-excat-section-bg';
// section styles whose background image comes from the recorded data attribute
const BACKGROUND_STYLES = ['image-panel'];
const BG_HOLDER_SELECTOR = '.image-container.bg-parallax, .bg-parallax, .image-container, .floating-bg';
const URL_RE = /url\(\s*['"]?([^'")]+)['"]?\s*\)/i;

/** background URL recorded by the cleanup (data-bg-src) or read directly */
function sectionBackground(el) {
  if (!el) return '';
  const recorded = el.getAttribute('data-bg-src')
    || (el.querySelector('[data-bg-src]') && el.querySelector('[data-bg-src]').getAttribute('data-bg-src'));
  if (recorded) return recorded;
  const holders = [el, ...safeQueryAll(el, BG_HOLDER_SELECTOR)];
  for (const h of holders) {
    const m = (h.getAttribute('style') || '').match(URL_RE);
    if (m && m[1]) return m[1].replace(/&amp;/g, '&').trim();
  }
  const img = safeQueryAll(el, BG_HOLDER_SELECTOR)
    .map((h) => h.querySelector(':scope > img[src]')).find(Boolean);
  return img ? img.getAttribute('src') : '';
}

function safeQueryAll(root, selector) {
  try {
    return [...root.querySelectorAll(selector)];
  } catch (e) {
    return [];
  }
}

/** lowercase, punctuation -> space, collapse */
function key(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function contentRoot(element) {
  return element.querySelector('#main-container') || element;
}

function isWrapper(el, root) {
  return el.parentElement === root && el.matches(WRAPPER_SELECTOR);
}

/** direct child of #main-container, or of a section wrapper under it */
function topLevel(el, element) {
  const root = contentRoot(element);
  if (!root.contains(el) || el === root) return null;
  let node = el;
  while (node.parentElement && node.parentElement !== root) {
    if (isWrapper(node.parentElement, root)) return node;
    node = node.parentElement;
  }
  return node;
}

function headingText(h) {
  const clone = h.cloneNode(true);
  clone.querySelectorAll('.data-uw-rm-autofix-hide').forEach((s) => s.remove());
  return clone.textContent;
}

/** does the candidate start with / contain a heading or text block starting with name */
function matchesName(el, name) {
  const target = key(name);
  if (!target) return false;
  const headings = el.matches('h1, h2, h3, h4, h5, h6')
    ? [el]
    : safeQueryAll(el, 'h1, h2, h3, h4, h5, h6');
  if (headings.some((h) => key(headingText(h)).startsWith(target))) return true;
  if (headings.some((h) => {
    // eyebrow label inside the heading: "Video Community ..." -> "video"
    const label = h.querySelector('.label, .eyebrow');
    return label && key(label.textContent).startsWith(target);
  })) return true;
  if (key(el.textContent).startsWith(target)) return true;
  return safeQueryAll(el, 'p, blockquote, .quote').some((p) => key(p.textContent).startsWith(target));
}

function findByName(element, name, used) {
  const target = key(name);
  if (!target) return null;
  const root = contentRoot(element);
  const pools = ['h1, h2, h3, h4, h5, h6', 'p, blockquote, .quote', 'div, span'];
  for (const sel of pools) {
    const hits = safeQueryAll(root, sel).filter((n) => {
      if (sel === 'div, span') {
        // own text only (avoid matching big wrappers)
        const own = [...n.childNodes].filter((c) => c.nodeType === 3).map((c) => c.textContent).join(' ');
        return key(own).startsWith(target) || key(n.textContent).startsWith(target) && !n.querySelector('div');
      }
      return key(sel.startsWith('h') ? headingText(n) : n.textContent).startsWith(target);
    });
    for (const hit of hits) {
      const top = topLevel(hit, element);
      if (top && !used.has(top)) return top;
    }
  }
  return null;
}

function findSection(element, section, used) {
  const selectors = (Array.isArray(section.selector) ? section.selector : [section.selector]).filter(Boolean);
  for (const sel of selectors) {
    const candidates = safeQueryAll(element, sel);
    if (!candidates.length) continue;
    const tops = [];
    candidates.forEach((c) => {
      const top = topLevel(c, element);
      if (top && !tops.some((t) => t.top === top)) tops.push({ el: c, top });
    });
    const free = tops.filter((t) => !used.has(t.top));
    if (!free.length) continue;
    if (free.length === 1 && tops.length === 1) return free[0].top;
    const named = free.find((t) => matchesName(t.el, section.name) || matchesName(t.top, section.name));
    if (named) return named.top;
    // ambiguous selector without a name match: fall through to name search,
    // then the first unclaimed candidate
    const byName = findByName(element, section.name, used);
    if (byName && free.some((t) => t.top === byName)) return byName;
    return free[0].top;
  }
  return findByName(element, section.name, used);
}

/** resolve all sections forward so ambiguous selectors claim distinct elements */
function resolveSections(element, sections) {
  const used = new Set();
  const resolved = sections.map(() => null);
  // pass 1: unambiguous selector hits claim first
  sections.forEach((section, i) => {
    const selectors = (Array.isArray(section.selector) ? section.selector : [section.selector]).filter(Boolean);
    for (const sel of selectors) {
      const tops = [...new Set(safeQueryAll(element, sel).map((c) => topLevel(c, element)).filter(Boolean))];
      if (!tops.length) continue;
      if (tops.length === 1 && !used.has(tops[0])) {
        resolved[i] = tops[0];
        used.add(tops[0]);
      }
      break;
    }
  });
  // pass 2: ambiguous / name-only sections
  sections.forEach((section, i) => {
    if (resolved[i]) return;
    const el = findSection(element, section, used);
    if (el) {
      resolved[i] = el;
      used.add(el);
    }
  });
  return resolved;
}

function docOrder(a, b) {
  if (a === b) return 0;
  return a.compareDocumentPosition(b) & 4 /* FOLLOWING */ ? -1 : 1;
}

export default function transform(hookName, element, payload) {
  const template = payload && payload.template;
  if (!template || !PRODUCT_TEMPLATES.includes(template.name)) return;
  const sections = template.sections || [];
  if (sections.length < 2) return;
  if (!element || !element.querySelectorAll) return;
  const document = element.ownerDocument;

  if (hookName === 'beforeTransform') {
    const resolved = resolveSections(element, sections);
    const found = sections
      .map((section, i) => ({ section, i, el: resolved[i] }))
      .filter((s) => s.el)
      .sort((a, b) => docOrder(a.el, b.el));

    for (let k = found.length - 1; k >= 0; k -= 1) {
      const { section, el } = found[k];
      const isFirst = k === 0;
      const next = found[k + 1];

      // end placeholder for styled sections (before the next section's <hr>)
      if (section.style) {
        const end = document.createElement('div');
        end.setAttribute(END_ATTR, section.id);
        if (BACKGROUND_STYLES.includes(section.style)) {
          // copy now: the cleanup strips data-bg-src in afterTransform
          const bg = sectionBackground(el);
          if (bg) end.setAttribute(BG_ATTR, bg);
        }
        const nextHr = next && next.el.previousElementSibling
          && next.el.previousElementSibling.tagName === 'HR'
          ? next.el.previousElementSibling : null;
        if (nextHr) nextHr.before(end);
        else if (next) next.el.before(end);
        else contentRoot(element).append(end);
      }

      if (isFirst && !section.style) continue;
      const hr = document.createElement('hr');
      if (section.style) hr.setAttribute(MARKER_ATTR, section.id);
      if (isFirst) hr.setAttribute(FIRST_ATTR, 'true');
      el.before(hr);
    }
  }

  if (hookName === 'afterTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;
      const marker = element.querySelector(`hr[${MARKER_ATTR}="${section.id}"]`);
      const end = element.querySelector(`[${END_ATTR}="${section.id}"]`);
      if (!marker && !end) continue;

      const cells = { style: section.style };
      const bg = end && end.getAttribute(BG_ATTR);
      if (bg) {
        const img = document.createElement('img');
        img.src = bg;
        img.alt = '';
        cells.background = img;
      }
      // one Section Metadata block carrying style (+ background)
      const metadata = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells,
      });

      if (end) {
        end.replaceWith(metadata);
      } else {
        // fallback: before the next sibling <hr>, else end of the parent
        let next = marker.nextElementSibling;
        while (next && next.tagName !== 'HR') next = next.nextElementSibling;
        if (next) next.before(metadata);
        else marker.parentElement.append(metadata);
      }

      if (marker) {
        // the first section's <hr> was temporary (would open an empty section)
        if (marker.hasAttribute(FIRST_ATTR)) marker.remove();
        else marker.removeAttribute(MARKER_ATTR);
      }
    }
    // any leftover temporary nodes
    safeQueryAll(element, `hr[${FIRST_ATTR}]`).forEach((hr) => hr.remove());
    safeQueryAll(element, `[${END_ATTR}]`).forEach((el) => el.remove());
  }
}
