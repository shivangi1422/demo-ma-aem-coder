/* eslint-disable */
/* global WebImporter */

/**
 * Parser for tabs-workflow (new block). Base: tabs.
 * Source: https://www.mybeckman.in/resources/industries/synthetic-biology
 *   ("Interactive Synthetic Biology Workflow": .tab-scroll > .tabs with label.active /
 *    label.inactive stage tabs and #content-N panels holding .stepname-N steps and
 *    .stepimg-M product tiles)
 * Selector: .tab-scroll
 * Model: container "tabs-workflow" (no fields), items
 *   tabs-workflow-stage   (title, description, state)
 *   tabs-workflow-step    (label, state)
 *   tabs-workflow-product (image/imageAlt, link/linkText, steps, imageHeight)
 * Deviation from the library Tabs convention (label | content per row): the workflow
 * needs typed items (stage / step / product) for the per-step product highlighting.
 * Each row's first cell names the item component, so md2jcr maps it to its model.
 * Rows in order: each stage, then (for clickable stages) its steps and products.
 * Step -> product mapping: the source keeps it in CSS rules
 * (.stepname-N.active-stepname ~ .stepimg-M ...), read from the page's <style>
 * elements (still present while parsers run); each product lists the exact
 * labels of the steps it lights up for.
 */

const norm = (s) => (s || '').replace(/[\u200b\u00a0\s]+/g, ' ').trim();

// https://www.mybeckman.in/x -> /x
const toRelative = (href) => {
  if (!href) return '';
  const m = href.match(/^https?:\/\/(?:www\.)?mybeckman\.in(\/.*)?$/i);
  if (m) return m[1] || '/';
  return href;
};

// absolute media.beckman.com URL; drop Sitecore resize params but keep rev
const cleanImageSrc = (src) => {
  if (!src) return src;
  let abs = src.trim();
  if (abs.startsWith('//')) abs = `https:${abs}`;
  else if (abs.startsWith('/-/media/')) abs = `https://media.beckman.com${abs}`;
  if (!/^https?:/i.test(abs)) return abs;
  try {
    const url = new URL(abs);
    ['h', 'w', 'iar', 'hash', 'sc_lang'].forEach((p) => url.searchParams.delete(p));
    return url.toString();
  } catch (e) {
    return abs;
  }
};

const pageCss = (document) => Array.from(document.querySelectorAll('style'))
  .map((s) => s.textContent || '').join('\n').replace(/\/\*[\s\S]*?\*\//g, '');

// { 'stepname-1': Set('stepimg-1', ...) } from the page CSS
const readMapping = (css) => {
  const map = {};
  const re = /\.(stepname-\d+)\.active-stepname\s*~\s*\.(stepimg-\d+)/g;
  let m;
  while ((m = re.exec(css))) {
    (map[m[1]] = map[m[1]] || new Set()).add(m[2]);
  }
  return map;
};

// greyed steps: the source CSS gives them a #f0f0f0 background
const readGreyed = (css) => {
  const greyed = new Set();
  const re = /([^{}]+)\{[^{}]*background(?:-color)?\s*:\s*#f0f0f0[^{}]*\}/gi;
  let m;
  while ((m = re.exec(css))) {
    (m[1].match(/\.stepname-\d+/g) || []).forEach((c) => greyed.add(c.slice(1)));
  }
  return greyed;
};

const classOf = (el, prefix) => Array.from(el.classList).find((c) => new RegExp(`^${prefix}-\\d+$`).test(c));

const cell = (document, hint, content) => {
  const frag = document.createDocumentFragment();
  frag.appendChild(document.createComment(` field:${hint} `));
  if (typeof content === 'string') frag.appendChild(document.createTextNode(content));
  else if (content) frag.appendChild(content);
  return frag;
};

export default function parse(element, { document }) {
  const css = pageCss(document);
  const mapping = readMapping(css);
  const greyed = readGreyed(css);
  const tabs = element.querySelector('.tabs') || element;
  const rows = [];

  Array.from(tabs.querySelectorAll(':scope > label')).forEach((label) => {
    const descEl = label.querySelector('span');
    const description = norm(descEl && descEl.textContent);
    const clone = label.cloneNode(true);
    clone.querySelectorAll('span').forEach((s) => s.remove());
    const title = norm(clone.textContent);
    const panelId = label.getAttribute('data-content-id');
    const panel = panelId && tabs.querySelector(`#${panelId}`);
    const inactive = label.classList.contains('inactive') || !panel;

    rows.push([
      'tabs-workflow-stage',
      cell(document, 'title', title),
      cell(document, 'description', description),
      cell(document, 'state', inactive ? 'stage-inactive' : 'stage'),
    ]);
    if (inactive) return;

    // steps
    const steps = Array.from(panel.querySelectorAll('[class*="stepname-"]')).map((el) => ({
      cls: classOf(el, 'stepname'),
      label: norm(el.textContent),
    })).filter((s) => s.cls);
    steps.forEach((step) => {
      const off = greyed.has(step.cls) || !mapping[step.cls];
      rows.push([
        'tabs-workflow-step',
        cell(document, 'label', step.label),
        cell(document, 'state', off ? 'step-inactive' : 'step'),
      ]);
    });

    // products
    Array.from(panel.querySelectorAll('[class*="stepimg-"]')).forEach((tile) => {
      const cls = classOf(tile, 'stepimg');
      const img = tile.querySelector('img');
      const nameEl = tile.querySelector('.productname, .productname2');
      const link = (nameEl && nameEl.querySelector('a[href]')) || tile.querySelector('a[href]');
      const name = norm((nameEl || link || tile).textContent);
      const href = toRelative(link && link.getAttribute('href'));
      const height = img && ((img.getAttribute('style') || '').match(/height\s*:\s*(\d+)px/i) || [])[1];
      const lit = steps.filter((s) => mapping[s.cls] && mapping[s.cls].has(cls)).map((s) => s.label);

      let imageFrag = '';
      if (img && img.getAttribute('src')) {
        const pic = document.createElement('img');
        pic.setAttribute('src', cleanImageSrc(img.getAttribute('src')));
        pic.setAttribute('alt', '');
        imageFrag = cell(document, 'image', pic);
      }
      let linkFrag = cell(document, 'link', name);
      if (href) {
        const a = document.createElement('a');
        a.setAttribute('href', href);
        a.textContent = name;
        linkFrag = cell(document, 'link', a);
      }
      rows.push([
        'tabs-workflow-product',
        imageFrag,
        linkFrag,
        cell(document, 'steps', lit.join(', ')),
        cell(document, 'imageHeight', height || ''),
      ]);
    });
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'Tabs Workflow', cells: rows });
  element.replaceWith(block);
}
