import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Moves a cell's content into a table cell, unwrapping a lone paragraph so
 * single-line names/labels do not carry paragraph margins.
 * @param {Element} from authored cell
 * @param {Element} to table cell
 */
function moveContent(from, to) {
  const only = from.children.length === 1 && from.firstElementChild;
  const source = only && only.tagName === 'P' && from.textContent.trim() === only.textContent.trim()
    ? only : from;
  while (source.firstChild) to.append(source.firstChild);
}

/**
 * Decorates the table-grouped block: a two-column table with no header row,
 * grouped by full-width label rows.
 * Authored structure: one row per entry.
 *   - group row: one cell (or an empty second cell) holding the group label
 *   - data row:  name cell (may contain a link) | description cell
 * @param {Element} block
 */
export default function decorate(block) {
  const table = document.createElement('table');
  const tbody = document.createElement('tbody');

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const [nameCell, descCell] = cells;
    if (!nameCell || (row.textContent.trim() === '' && !row.querySelector('img'))) return;

    const tr = document.createElement('tr');
    moveInstrumentation(row, tr);

    const isGroup = !descCell || descCell.textContent.trim() === '';
    if (isGroup) {
      tr.className = 'table-grouped-group';
      const th = document.createElement('th');
      th.colSpan = 2;
      th.scope = 'colgroup';
      moveContent(nameCell, th);
      tr.append(th);
    } else {
      const th = document.createElement('th');
      th.scope = 'row';
      th.className = 'table-grouped-name';
      moveContent(nameCell, th);
      const td = document.createElement('td');
      td.className = 'table-grouped-description';
      moveContent(descCell, td);
      tr.append(th, td);
    }
    tbody.append(tr);
  });

  // name the table after the nearest heading above it (screen-reader caption);
  // a real caption also keeps the full-width first group row from reading as a fake one
  let label = null;
  let prev = (block.parentElement || block).previousElementSibling;
  while (prev && !label) {
    label = [...prev.querySelectorAll('h1, h2, h3, h4, h5, h6')].pop()
      || (prev.matches('h1, h2, h3, h4, h5, h6') ? prev : null);
    prev = prev.previousElementSibling;
  }
  if (label) {
    const caption = document.createElement('caption');
    caption.className = 'table-grouped-caption';
    caption.textContent = label.textContent.trim();
    table.append(caption);
  }

  table.append(tbody);
  block.replaceChildren(table);
}
