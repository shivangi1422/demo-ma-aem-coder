/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-icon-list (template: reagent-product).
 * Source: https://www.mybeckman.in/reagents/particle/valita-titer-assays
 * Selector: .product-spotlight-wrapper .spotlight-content-wrapper > .bc-rich-text > .row
 *
 * Columns convention: one row, two cells
 *   cell 1: large image (first .col-md-6)
 *   cell 2: per .vertical-align-vk item: icon image paragraph, then one text
 *           paragraph "label<br><strong><a>link</a></strong>"
 * Block names starting with "columns" are converted by md2jcr into the core
 * columns component (rows/cols), so no xwalk field hints are emitted.
 * blocks/columns-icon-list/columns-icon-list.js normalises this document shape
 * (picture-only paragraph = icon, next paragraph = item text).
 */
export default function parse(element, { document }) {
  const clean = (s) => (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();

  const makeImg = (src) => {
    if (!src || !src.getAttribute('src')) return null;
    const img = document.createElement('img');
    img.setAttribute('src', src.getAttribute('src'));
    img.setAttribute('alt', clean(src.getAttribute('alt')));
    return img;
  };

  const cols = Array.from(element.querySelectorAll(':scope > div'));
  const left = cols[0];
  const right = cols[1] || null;

  // Cell 1: large image
  let imageCell = '';
  const big = left && left.querySelector('img');
  const bigImg = makeImg(big);
  if (bigImg) imageCell = bigImg;

  // Cell 2: icon + text pairs
  const listCell = document.createDocumentFragment();
  const items = right ? Array.from(right.querySelectorAll('.vertical-align-vk')) : [];
  items.forEach((item) => {
    const icon = makeImg(item.querySelector('img'));
    if (icon) {
      const p = document.createElement('p');
      p.appendChild(icon);
      listCell.appendChild(p);
    }
    const srcP = Array.from(item.querySelectorAll('p')).find((p) => clean(p.textContent));
    if (!srcP) return;
    const p = document.createElement('p');
    // label: text before the first <br> / <strong>
    let label = '';
    for (const node of Array.from(srcP.childNodes)) {
      if (node.nodeName === 'BR' || node.nodeName === 'STRONG' || node.nodeName === 'A') break;
      label += node.textContent;
    }
    label = clean(label);
    if (label) {
      p.appendChild(document.createTextNode(label));
      p.appendChild(document.createElement('br'));
    }
    const a = srcP.querySelector('a[href]');
    if (a && clean(a.textContent)) {
      const strong = document.createElement('strong');
      const link = document.createElement('a');
      link.setAttribute('href', a.getAttribute('href'));
      link.textContent = clean(a.textContent);
      strong.appendChild(link);
      p.appendChild(strong);
    }
    if (clean(p.textContent)) listCell.appendChild(p);
  });

  const cells = [[imageCell, listCell.childNodes.length ? listCell : '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-icon-list', cells });
  element.replaceWith(block);
}
