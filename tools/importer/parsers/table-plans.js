/* eslint-disable */
/* global WebImporter */

/**
 * Parser for table-plans (table convention: one block row per table row, every row with the same
 * number of cells; xwalk items table-plans-row: column1 … column7).
 * Source: #service-plans-table > table (thead: plan group headers with colspan, th.blank spacer;
 * tbody: plan names row, then feature rows; circles already turned into ● / ○ by mybeckman-service-prepare).
 * Merged header cells are expanded: the label in the first cell, the cells it spans left empty
 * (the block merges them again). The spacer column stays as an empty column.
 * Output: one row per table row: [<!-- field:column1 -->text] … [<!-- field:columnN -->text]
 */
export default function parse(element, { document }) {
  const src = element.matches('table') ? element : element.querySelector('table');
  if (!src) return;
  const grid = [...src.rows].map((row) => [...row.cells].flatMap((cell) => {
    const span = Number(cell.getAttribute('colspan') || 1);
    const text = cell.textContent.replace(/\s+/g, ' ').trim();
    return [text, ...Array(Math.max(0, span - 1)).fill('')];
  }));
  const width = Math.max(...grid.map((r) => r.length));
  const cells = grid.map((row) => Array.from({ length: width }, (_, i) => {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:column${i + 1} `));
    if (row[i]) frag.appendChild(document.createTextNode(row[i]));
    return frag;
  }));
  const block = WebImporter.Blocks.createBlock(document, { name: 'table-plans', cells });
  // only the table: the legend (.footnotes) in the same wrapper stays page text
  src.replaceWith(block);
}
