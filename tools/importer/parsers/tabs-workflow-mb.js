/* eslint-disable */
/* global WebImporter */

/**
 * Parser for tabs-workflow-mb (block: tabs-workflow) - process stepper.
 * Sources on mybeckman.in:
 *   1. div.tab-scroll > div.tabs (biomanufacturing, synthetic-biology):
 *        label.inactive (disabled stage, no panel)
 *        [input#tab-btn-N +] label.active (title <br> span subtitle) -> div#content-N
 *          (label[for=tab-btn-N] or label[data-content-id])
 *        panel: div.trapeze-container-N (CSS art, ignored) + div.steps >
 *          div.stepname-* (step names, in order) + div.stepimg-* (p.product > a > img
 *          + p.productname / p.productname2, optionally linked)
 *   2. div.tab-scroll (next-generation-sequencing): 3 label.active stages, panels
 *        div#content-1..3 > div.products > div.prodimg-* (p.product > a > img + p.productname);
 *        #content-0 (default greyed state) is removed by the cleanup and ignored
 *   3. div.workflow-container > div.wf-row (cell-line-development):
 *        div.wf-element[data-target] > h4 (6 stage titles) + the sibling div.content >
 *        div.content-section#<data-target> (description p + div.img-container >
 *        div.img-link-container > a > img + p). The sibling div.content is read and
 *        removed; div.wf-grid-mobile (mobile duplicate) is removed by the cleanup.
 *        The "Request more information" CTA stays default content.
 *
 * Library convention (Tabs): one row per tab, tab label | tab content.
 * xwalk item model `tabs-workflow-item`: title (text), image (reference,
 * imageAlt collapsed), text (richtext). No container model.
 *
 * Rows (one per stage, 3 cells):
 *   <!-- field:title --> plain title (no <br>) | image (empty) | <!-- field:text -->
 *     [<p>subtitle / description</p>] [<ol><li>step</li>...</ol>]
 *     per product: <p><a href="{image file}">{alt or product name}</a></p>
 *                  <p><a href="{product}">{product name}</a></p>
 *   Disabled stage: title only (empty image and text).
 *   Product links lose target=_blank. Image files without an extension
 *   (Sitecore media URLs) get ".jpg" so the block recognises them as images
 *   (Sitecore resolves media items regardless of the extension).
 */

const clean = (str) => (str || '').replace(/[\s ​]+/g, ' ').trim();

const isUsableHref = (href) => !!href && href.trim() !== '' && href.trim() !== '#'
  && !/^javascript:/i.test(href.trim());

const IMAGE_EXT = /\.(?:png|jpe?g|webp|gif|avif|svg)$/i;

/** image file URL the block recognises as an image (path must end in an image extension) */
function imageFileUrl(src) {
  const raw = (src || '').trim();
  if (!raw || /^data:/i.test(raw)) return '';
  const m = raw.match(/^([^?#]*)(.*)$/);
  const path = m[1];
  if (IMAGE_EXT.test(path)) return raw;
  return `${path}.jpg${m[2]}`;
}

/** text of an element with <br> as a space ("Transformation/<br>Strain" -> "Transformation/Strain") */
function textOf(el) {
  if (!el) return '';
  const copy = el.cloneNode(true);
  copy.querySelectorAll('br').forEach((br) => br.replaceWith(' '));
  return clean(copy.textContent).replace(/\/\s+/g, '/');
}

/** title = text before the first <br>; subtitle = the rest (span) */
function splitLabel(label) {
  const copy = label.cloneNode(true);
  const span = copy.querySelector('span');
  const subtitle = span ? clean(span.textContent) : '';
  if (span) span.remove();
  copy.querySelectorAll('br').forEach((br) => br.replaceWith(' '));
  return { title: clean(copy.textContent), subtitle };
}

function linkParagraph(href, text, document) {
  const p = document.createElement('p');
  if (isUsableHref(href)) {
    const a = document.createElement('a');
    a.href = href.trim();
    a.textContent = text;
    p.append(a);
  } else {
    p.textContent = text;
  }
  return p;
}

/** product: image-file link paragraph + linked name paragraph */
function productNodes(unit, document) {
  const img = unit.querySelector('img[src]');
  const nameEl = unit.querySelector('p.productname, p.productname2, [class*="productname"]')
    || [...unit.querySelectorAll('p')].reverse().find((p) => clean(p.textContent));
  const name = clean(nameEl && nameEl.textContent);
  const link = (nameEl && nameEl.querySelector('a[href]'))
    || (img && img.closest('a[href]')) || unit.querySelector('a[href]');
  const out = [];
  const file = img && imageFileUrl(img.getAttribute('src'));
  if (file) out.push(linkParagraph(file, clean(img.getAttribute('alt')) || name || 'Product', document));
  if (name) out.push(linkParagraph(link && link.getAttribute('href'), name, document));
  return out;
}

/*
 * next-generation-sequencing: every panel lists all 8 products; the stage's
 * own products are only told apart by CSS (#content-N > .products >
 * .prodimg-M ... img { filter: grayscale(0%) } vs grayscale(100%)). The
 * cleanup removes #main <style> before the parsers run, so the rules are read
 * from any remaining <style> and otherwise from this map (measured on the
 * snapshot).
 */
const STAGE_PRODUCTS_FALLBACK = {
  'content-1': [1, 2, 3, 4, 5, 8],
  'content-2': [4, 5, 6, 7, 8],
  'content-3': [5, 7, 8],
};

function stageProducts(document) {
  const map = {};
  document.querySelectorAll('style').forEach((style) => {
    const css = style.textContent || '';
    const re = /([^{}]*img\.productimg[^{}]*)\{([^}]*)\}/g;
    let m = re.exec(css);
    while (m) {
      if (/grayscale\(\s*0%\s*\)/.test(m[2])) {
        const sel = m[1];
        const pairs = sel.match(/#content-\d+\s*>\s*\.products\s*>\s*\.prodimg-\d+/g) || [];
        pairs.forEach((pair) => {
          const [, c, p] = pair.match(/#(content-\d+).*prodimg-(\d+)/);
          map[c] = map[c] || [];
          if (!map[c].includes(Number(p))) map[c].push(Number(p));
        });
      }
      m = re.exec(css);
    }
  });
  return Object.keys(map).length ? map : STAGE_PRODUCTS_FALLBACK;
}

/** product units of a panel; for the "all products, CSS highlight" layout only the stage's own */
function productUnits(panel) {
  const units = [...panel.querySelectorAll('[class*="stepimg-"], [class*="prodimg-"], .img-link-container')]
    .filter((u, i, arr) => !arr.some((o) => o !== u && o.contains(u)));
  if (!panel.querySelector(':scope > .products > [class*="prodimg-"]')) return units;
  const active = stageProducts(panel.ownerDocument)[panel.id];
  if (!active) return units;
  return units.filter((u) => {
    const m = (u.className || '').match(/prodimg-(\d+)/);
    return !m || active.includes(Number(m[1]));
  });
}

function panelNodes(panel, subtitle, document) {
  const nodes = [];
  if (subtitle) {
    const p = document.createElement('p');
    p.textContent = subtitle;
    nodes.push(p);
  }
  if (!panel) return nodes;
  // description paragraphs (cell-line-development)
  panel.querySelectorAll(':scope > p').forEach((p) => {
    const value = clean(p.textContent);
    if (!value) return;
    const out = document.createElement('p');
    out.textContent = value;
    nodes.push(out);
  });
  // step names
  const steps = [...panel.querySelectorAll('[class*="stepname-"]')].map(textOf).filter(Boolean);
  if (steps.length) {
    const ol = document.createElement('ol');
    steps.forEach((s) => {
      const li = document.createElement('li');
      li.textContent = s;
      ol.append(li);
    });
    nodes.push(ol);
  }
  // products, in document order
  productUnits(panel).forEach((unit) => nodes.push(...productNodes(unit, document)));
  return nodes;
}

/** stages of the radio-tab component (variants 1 and 2) */
function radioStages(element) {
  const root = element.querySelector('.tabs') || element;
  const doc = element.ownerDocument;
  const labels = [...root.querySelectorAll(':scope > label')];
  let activeIndex = 0;
  return labels.map((label) => {
    const { title, subtitle } = splitLabel(label);
    if (label.matches('.inactive') || (!label.matches('.active') && !label.getAttribute('for') && !label.dataset.contentId)) {
      return { title, disabled: true };
    }
    activeIndex += 1;
    let panel = null;
    const contentId = label.getAttribute('data-content-id');
    if (contentId) panel = root.querySelector(`[id="${contentId}"]`) || doc.getElementById(contentId);
    const forId = label.getAttribute('for');
    const n = forId && (forId.match(/(\d+)$/) || [])[1];
    if (!panel && n) panel = root.querySelector(`[id="content-${n}"]`);
    if (!panel) panel = root.querySelector(`[id="content-${activeIndex}"]`);
    return { title, subtitle, panel };
  });
}

/** stages of the cell-line-development workflow grid (variant 3) */
function gridStages(element, content) {
  return [...element.querySelectorAll('.wf-element')].map((el) => {
    const title = clean((el.querySelector('h1, h2, h3, h4, h5, h6') || el).textContent);
    const target = el.getAttribute('data-target');
    const panel = target && content ? content.querySelector(`[id="${target}"]`) : null;
    return { title, subtitle: '', panel, disabled: !panel };
  });
}

export default function parse(element, { document }) {
  let content = null;
  let stages;
  if (element.querySelector('.wf-element')) {
    let next = element.nextElementSibling;
    while (next && !next.matches('div.content') && !next.querySelector('.content-section')) {
      if (next.tagName === 'HR' || next.matches('[data-excat-section-end]')) break;
      next = next.nextElementSibling;
    }
    content = next && (next.matches('div.content') || next.querySelector('.content-section')) ? next : null;
    stages = gridStages(element, content);
  } else {
    stages = radioStages(element);
  }

  const cells = [];
  stages.forEach((stage) => {
    if (!stage.title) return;
    const titleCell = [document.createComment(' field:title '), document.createTextNode(stage.title)];
    if (stage.disabled) {
      cells.push([titleCell, '', '']);
      return;
    }
    const nodes = panelNodes(stage.panel, stage.subtitle, document);
    cells.push([titleCell, '', nodes.length ? [document.createComment(' field:text '), ...nodes] : '']);
  });

  if (content) content.remove();

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-workflow', cells });
  element.replaceWith(block);
}
