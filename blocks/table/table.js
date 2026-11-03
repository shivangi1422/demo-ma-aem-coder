import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Table: one table row per block row, the first row is the header. Scrolls sideways when wider
 * than the content column.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  const header = !block.classList.contains('no-header');
  [...block.children].forEach((row, r) => {
    const tr = document.createElement('tr');
    moveInstrumentation(row, tr);
    [...row.children].forEach((col) => {
      const cell = document.createElement(header && r === 0 ? 'th' : 'td');
      moveInstrumentation(col, cell);
      // single-paragraph cells hold plain text
      const only = col.children.length === 1 && col.firstElementChild.tagName === 'P' ? col.firstElementChild : col;
      cell.append(...only.childNodes);
      tr.append(cell);
    });
    (header && r === 0 ? thead : tbody).append(tr);
  });
  if (thead.children.length) table.append(thead);
  table.append(tbody);
  const scroll = document.createElement('div');
  scroll.className = 'table-scroll';
  scroll.append(table);
  block.replaceChildren(scroll);
}
