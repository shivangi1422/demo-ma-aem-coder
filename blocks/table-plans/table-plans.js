import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Builds the table: one table row per block row; in the first row (plan groups) a label
 * followed by empty cells becomes one merged header cell (spacer columns, empty in every row,
 * are never merged).
 * @param {Element} block The block element
 * @returns {HTMLTableElement}
 */
function buildTable(block) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  const blockRows = [...block.children];
  const spacer = (i) => blockRows.every((row) => !row.children[i]?.textContent.trim());
  blockRows.forEach((row, r) => {
    const tr = document.createElement('tr');
    moveInstrumentation(row, tr);
    [...row.children].forEach((col, i) => {
      const cell = document.createElement(r === 0 ? 'th' : 'td');
      moveInstrumentation(col, cell);
      // single-paragraph cells hold plain text
      const only = col.children.length === 1 && col.firstElementChild.tagName === 'P' ? col.firstElementChild : col;
      cell.append(...only.childNodes);
      const prev = tr.lastElementChild;
      if (r === 0 && prev && prev.textContent.trim() && !cell.textContent.trim() && !spacer(i)) {
        prev.colSpan += 1;
        return;
      }
      tr.append(cell);
    });
    (r === 0 ? thead : tbody).append(tr);
  });
  table.append(thead, tbody);
  return table;
}

/**
 * Plan comparison table (source service plan tables): a header row of plan groups (merged cells),
 * a row of plan names, then one row per feature (● included, ○ optional).
 * Empty columns are spacers between the plan groups; the last column is the highlighted plan.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const table = buildTable(block);
  block.replaceChildren(table);
  const rows = [...table.rows];
  const rowWidth = (r) => [...r.cells].reduce((n, c) => n + (c.colSpan || 1), 0);
  const width = Math.max(...rows.map(rowWidth));

  // grid of cells by column index (colspans expanded)
  const columns = Array.from({ length: width }, () => []);
  rows.forEach((row) => {
    let col = 0;
    [...row.cells].forEach((cell) => {
      for (let i = 0; i < (cell.colSpan || 1); i += 1) columns[col + i]?.push(cell);
      cell.dataset.col = col;
      col += cell.colSpan || 1;
    });
  });

  columns.forEach((cells, i) => {
    const single = cells.filter((c) => (c.colSpan || 1) === 1);
    if (i > 0 && single.length && single.every((c) => !c.textContent.trim())) {
      single.forEach((c) => c.classList.add('table-plans-spacer'));
    }
  });
  columns[width - 1].forEach((c) => {
    if ((c.colSpan || 1) === 1 && c.closest('tbody')) c.classList.add('table-plans-highlight');
  });
  // a column after a spacer starts a group (no left rule)
  table.querySelectorAll('td, th').forEach((cell) => {
    const prev = cell.previousElementSibling;
    if (prev && prev.classList.contains('table-plans-spacer')) cell.classList.add('table-plans-group-start');
  });

  table.querySelector('tr').classList.add('table-plans-groups');
  const names = table.querySelector('tbody tr') || rows[1];
  if (names) names.classList.add('table-plans-names');
  const wrapper = document.createElement('div');
  wrapper.className = 'table-plans-scroll';
  table.replaceWith(wrapper);
  wrapper.append(table);
}
