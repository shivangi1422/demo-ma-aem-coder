/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-features (Columns block, no option): product feature columns.
 * Source: https://www.mybeckman.in/flow-cytometry/software/cytobank-enterprise
 * Selector: #features-wrapper .bc-columns
 * Model: columns (no field hints for Columns blocks).
 * One row, one cell per .bc-column: H3 title + bullet list (H4 in the source,
 * raised to H3 under the section's H2).
 */

export default function parse(element, { document }) {
  const cols = Array.from(element.querySelectorAll(':scope > .bc-column'));
  const row = cols.map((col) => {
    const cell = [];
    col.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol').forEach((node) => {
      if (node.parentElement.closest('ul, ol')) return;
      if (!node.textContent.trim()) return;
      if (/^H[4-6]$/.test(node.tagName)) {
        const h = document.createElement('h3');
        h.innerHTML = node.innerHTML;
        cell.push(h);
        return;
      }
      cell.push(node);
    });
    return cell;
  });
  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns', cells: [row] });
  element.replaceWith(block);
}
