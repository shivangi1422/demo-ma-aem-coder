import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Decorates the columns-features block: a fixed set of side-by-side feature
 * groups (heading + bullet list each).
 *
 * Accepts either authoring shape:
 *   - Universal Editor: one row per "Feature Column" item, one cell each
 *   - Document table: one row with one cell per column
 * Every non-empty cell becomes one column.
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];
  const cols = [];

  rows.forEach((row) => {
    const cells = [...row.children];
    if (cells.length <= 1) {
      // One item per row (UE container items): the row itself is the column.
      const cell = cells[0];
      if (!cell || (cell.textContent.trim() === '' && !cell.querySelector('picture, img'))) {
        row.remove();
        return;
      }
      const col = document.createElement('div');
      moveInstrumentation(row, col);
      while (cell.firstChild) col.append(cell.firstChild);
      cols.push(col);
    } else {
      cells.forEach((cell) => {
        if (cell.textContent.trim() === '' && !cell.querySelector('picture, img')) return;
        const col = document.createElement('div');
        moveInstrumentation(cell, col);
        while (cell.firstChild) col.append(cell.firstChild);
        cols.push(col);
      });
    }
  });

  cols.forEach((col) => col.classList.add('columns-features-column'));
  block.classList.add(`columns-features-${cols.length}-cols`);
  block.replaceChildren(...cols);
}
