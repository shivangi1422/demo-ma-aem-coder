/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-grid variant (style: productlines).
 * Templates:
 *   - reagents: https://www.beckmancoulter.com/reagents (+ category pages such as
 *     /reagents/coulter-flow-cytometry, /reagents/genomic with the same markup).
 *     Selector: .product-series-selector-wrapper .product-series-callouts
 *   - reagent-product: /reagents/particle/valita-titer-assays, /valita-aggregation-pure
 *     Selector: .product-spotlight-wrapper .spotlight-content-wrapper > .product-series-callouts
 *     Items use .product-series-callouts__image-holder / __description-wrap; the
 *     inner __image-wrap / __description are optional (both shapes supported).
 *
 * Model (blocks/cards-grid/_cards-grid.json):
 *   block "cards-grid": text (richtext, heading/intro), classes (style select)
 *   item  "cards-grid-item": image (reference) [+ imageAlt collapsed], text (richtext)
 *
 * Output rows:
 *   row 0  : heading/intro cell (empty on these pages, kept so cards-grid.js
 *            never mistakes an image-less first card for the heading row)
 *   row 1..: [image, text] per .product-series-callouts__item
 */
export default function parse(element, { document }) {
  const INLINE_TAGS = new Set([
    'A', 'ABBR', 'B', 'BR', 'CITE', 'CODE', 'EM', 'I', 'MARK', 'S', 'SMALL',
    'SPAN', 'STRONG', 'SUB', 'SUP', 'U',
  ]);
  const DROP_SELECTOR = 'input, button, script, style, noscript, iframe, form, select, textarea';
  const ZERO_WIDTH = /[\u200B-\u200D\uFEFF]/g;

  /** Pick the visible <img> in the wrap: prefer one carrying an alt attribute. */
  const pickImage = (scope) => {
    if (!scope) return null;
    const wrap = scope.querySelector('.product-series-callouts__image-wrap') || scope;
    const imgs = Array.from(wrap.querySelectorAll('img')).filter((i) => i.getAttribute('src'));
    if (!imgs.length) return null;
    const src = imgs.find((i) => i.hasAttribute('alt')) || imgs[0];
    const img = document.createElement('img');
    img.setAttribute('src', src.getAttribute('src'));
    const alt = imgs.map((i) => i.getAttribute('alt')).find((a) => a && a.trim());
    img.setAttribute('alt', alt ? alt.trim() : '');
    return img;
  };

  /**
   * Normalise description content into block-level nodes: keep headings,
   * paragraphs, lists; wrap loose text / inline nodes (e.g. <em> notes) in <p>.
   */
  const buildDescription = (container) => {
    const nodes = [];
    if (!container) return nodes;
    const clone = container.cloneNode(true);
    clone.querySelectorAll(DROP_SELECTOR).forEach((el) => el.remove());

    let para = null;
    const flush = () => {
      if (para && para.textContent.trim()) nodes.push(para);
      para = null;
    };

    Array.from(clone.childNodes).forEach((node) => {
      if (node.nodeType === 3) {
        if (!node.textContent.replace(ZERO_WIDTH, '').trim()) {
          if (para) para.appendChild(document.createTextNode(' '));
          return;
        }
        if (!para) para = document.createElement('p');
        para.appendChild(document.createTextNode(
          node.textContent.replace(ZERO_WIDTH, '').replace(/\s+/g, ' '),
        ));
        return;
      }
      if (node.nodeType !== 1) return;
      if (INLINE_TAGS.has(node.tagName)) {
        if (!node.textContent.trim()) return;
        if (!para) para = document.createElement('p');
        para.appendChild(node);
        return;
      }
      flush();
      if (node.tagName === 'DIV') {
        // Unwrap generic wrappers recursively.
        buildDescription(node).forEach((n) => nodes.push(n));
        return;
      }
      if (node.textContent.trim() || node.querySelector('img')) nodes.push(node);
    });
    flush();
    return nodes;
  };

  const isHeading = (el) => /^H[1-6]$/.test(el.tagName);

  const cells = [];

  // Row 0: Heading / Intro (no content on these pages -> empty cell, no hint).
  cells.push(['']);

  const items = Array.from(element.querySelectorAll('.product-series-callouts__item'));
  items.forEach((item) => {
    const link = item.querySelector('a.product-series-callouts__block[href]')
      || item.querySelector('a[href]');
    const href = link ? link.getAttribute('href') : '';

    // reagents: __description; product pages may only carry __description-wrap.
    let desc = item.querySelector('.product-series-callouts__description')
      || item.querySelector('.product-series-callouts__description-wrap');
    // Descend through single generic wrappers until the heading level is reached.
    while (desc && !Array.from(desc.children).some(isHeading)
      && desc.children.length === 1 && desc.firstElementChild.tagName === 'DIV'
      && desc.querySelector('h1, h2, h3, h4, h5, h6')) {
      desc = desc.firstElementChild;
    }

    // Title: the direct heading of the description (fallback: first heading in item).
    let titleEl = null;
    if (desc) titleEl = Array.from(desc.children).find(isHeading) || null;
    if (!titleEl) titleEl = item.querySelector('h2, h3, h4, h5');
    const titleText = titleEl
      ? titleEl.textContent.replace(ZERO_WIDTH, '').replace(/\s+/g, ' ').trim()
      : '';

    // Description body: <description> > div
    const bodyNodes = [];
    if (desc) {
      Array.from(desc.children)
        .filter((c) => c.tagName === 'DIV')
        .forEach((div) => buildDescription(div).forEach((n) => bodyNodes.push(n)));
    }

    // Column 1: image (__image-holder > optional __image-wrap)
    const img = pickImage(item.querySelector('.product-series-callouts__image-holder')
      || item.querySelector('.product-series-callouts__image-wrap')
      || item);
    let imageCell = '';
    if (img) {
      imageCell = document.createDocumentFragment();
      imageCell.appendChild(document.createComment(' field:image '));
      imageCell.appendChild(img);
    }

    // Column 2: text (linked h4 title + description)
    let textCell = '';
    if (titleText || bodyNodes.length) {
      textCell = document.createDocumentFragment();
      textCell.appendChild(document.createComment(' field:text '));
      if (titleText) {
        const h = document.createElement('h4');
        if (href) {
          const a = document.createElement('a');
          a.setAttribute('href', href);
          a.textContent = titleText;
          h.appendChild(a);
        } else {
          h.textContent = titleText;
        }
        textCell.appendChild(h);
      }
      bodyNodes.forEach((n) => textCell.appendChild(n));
    }

    if (!imageCell && !textCell) return;
    cells.push([imageCell, textCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'cards-grid',
    variants: ['productlines'],
    cells,
  });
  element.replaceWith(block);
}
