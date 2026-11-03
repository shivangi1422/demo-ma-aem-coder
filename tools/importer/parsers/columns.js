/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns (boilerplate xwalk columns: free default content per cell).
 * Source: div.Section__two-column > .Section__two-column-left | .Section__two-column-right
 * (or .Section__two-column-item children); also bootstrap .row of two .col-md-6 / .col-sm-6 columns. Images, text, lists, buttons and video links
 * (made by the mybeckman-service-sections transformer) are moved as they are.
 * Output: one row, one cell per source column.
 */
export default function parse(element, { document }) {
  const cols = [...element.children].filter((c) => c.tagName === 'DIV');
  const row = cols.map((col) => {
    const cell = document.createDocumentFragment();
    // zoom overlays around images (.container-overlay-full-width > img + .overlay link): keep the image
    col.querySelectorAll('.overlay').forEach((o) => o.remove());
    col.querySelectorAll('.container-overlay-full-width').forEach((w) => w.replaceWith(...w.childNodes));
    // a bare image becomes its own paragraph
    [...col.childNodes].forEach((n) => {
      if (n.nodeType === 1 && n.tagName === 'IMG') {
        const p = document.createElement('p');
        p.append(n.cloneNode(true));
        cell.appendChild(p);
      } else if (n.nodeType === 1 || (n.nodeType === 3 && n.textContent.trim())) {
        cell.appendChild(n);
      }
    });
    return cell;
  });
  if (!row.length) return;
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns', cells: [row] });
  element.replaceWith(block);
}
