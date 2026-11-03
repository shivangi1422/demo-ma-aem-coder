/* eslint-disable */
/* global WebImporter */

/**
 * Parser for table (table convention: one block row per table row, every row with the same number
 * of cells, first row = header; xwalk items table-row: column1 … column6, rich text).
 * Source: data tables in page text (vulnerability product lists, notification status table).
 * Without this the importer reads a page table as a block named after its first cell.
 * Cell content (text, links, images) is kept; colspans are expanded with empty cells.
 * Output: one row per table row: [<!-- field:column1 -->…] … [<!-- field:columnN -->…]
 */
export default function parse(element, { document }) {
  const rows = [...element.rows];
  if (!rows.length) return;
  const grid = rows.map((row) => [...row.cells].flatMap((cell) => {
    const span = Number(cell.getAttribute('colspan') || 1);
    return [cell, ...Array(Math.max(0, span - 1)).fill(null)];
  }));
  const width = Math.max(...grid.map((r) => r.length));
  const cells = grid.map((row) => Array.from({ length: width }, (_, i) => {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:column${i + 1} `));
    const src = row[i];
    if (src) {
      [...src.childNodes].forEach((n) => {
        if (n.nodeType === 3 && !n.textContent.trim()) return;
        frag.appendChild(n.nodeType === 3 ? document.createTextNode(n.textContent.replace(/\s+/g, ' ')) : n);
      });
    }
    return frag;
  }));
  const block = WebImporter.Blocks.createBlock(document, { name: 'table', cells });
  element.replaceWith(block);
}
