import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Moves a cell's content into a table cell, unwrapping a lone paragraph so
 * single-line values do not carry paragraph margins.
 * @param {Element} from authored cell
 * @param {Element} to table cell
 */
function moveContent(from, to) {
  if (!from) return;
  moveInstrumentation(from, to);
  const only = from.children.length === 1 && from.firstElementChild;
  const source = only && only.tagName === 'P' && from.textContent.trim() === only.textContent.trim()
    ? only : from;
  while (source.firstChild) to.append(source.firstChild);
}

const isEmpty = (cell) => !cell || (cell.textContent.trim() === '' && !cell.querySelector('img'));

/**
 * Text of the nearest heading before the block (used as the table caption).
 * @param {Element} block
 * @returns {string}
 */
function findLabel(block) {
  let prev = (block.parentElement || block).previousElementSibling;
  while (prev) {
    const heading = prev.matches('h1, h2, h3, h4, h5, h6') ? prev
      : [...prev.querySelectorAll('h1, h2, h3, h4, h5, h6')].pop();
    if (heading) return heading.textContent.trim();
    prev = prev.previousElementSibling;
  }
  return '';
}

/**
 * Decorates the table-striped block: a data table with a header row,
 * zebra-striped body rows and horizontal scrolling on narrow screens.
 * Authored structure: row 1 = column headers, rows 2..N = data rows;
 * one cell per column (column1 .. column4). Columns that are empty in
 * every row (unused model fields) are dropped.
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children].filter((row) => [...row.children].some((c) => !isEmpty(c)));
  const cols = rows.reduce((max, row) => {
    const cells = [...row.children];
    let last = cells.length;
    while (last > 0 && isEmpty(cells[last - 1])) last -= 1;
    return Math.max(max, last);
  }, 0);

  const table = document.createElement('table');
  // 3+ columns keep a minimum width and scroll sideways on phones
  if (cols > 2) table.classList.add('table-striped-wide');
  const label = findLabel(block);
  if (label) {
    const caption = document.createElement('caption');
    caption.className = 'table-striped-caption';
    caption.textContent = label;
    table.append(caption);
  }

  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  rows.forEach((row, i) => {
    const tr = document.createElement('tr');
    moveInstrumentation(row, tr);
    const cells = [...row.children];
    for (let c = 0; c < cols; c += 1) {
      const cell = document.createElement(i === 0 ? 'th' : 'td');
      if (i === 0) cell.scope = 'col';
      moveContent(cells[c], cell);
      tr.append(cell);
    }
    (i === 0 ? thead : tbody).append(tr);
  });
  if (thead.children.length) table.append(thead);
  table.append(tbody);

  // scrollable region: focusable so keyboard users can scroll it
  const scroller = document.createElement('div');
  scroller.className = 'table-striped-scroll';
  scroller.tabIndex = 0;
  scroller.setAttribute('role', 'region');
  scroller.setAttribute('aria-label', label || 'Data table');
  scroller.append(table);
  block.replaceChildren(scroller);
}
