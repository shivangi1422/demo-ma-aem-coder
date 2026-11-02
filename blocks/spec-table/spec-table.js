import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Decorates the spec-table block: one row per specification (label | value),
 * rendered as a semantic table that shows two specifications per line on desktop.
 * @param {Element} block
 */
export default function decorate(block) {
  const table = document.createElement('table');
  const tbody = document.createElement('tbody');
  [...block.children].forEach((row) => {
    const [labelCell, valueCell] = row.children;
    if (!labelCell) return;
    const tr = document.createElement('tr');
    moveInstrumentation(row, tr);
    const th = document.createElement('th');
    th.scope = 'row';
    th.textContent = labelCell.textContent.trim();
    const td = document.createElement('td');
    if (valueCell) {
      moveInstrumentation(valueCell, td);
      // a single paragraph is unwrapped so the value sits on the cell's own line box
      const only = valueCell.children.length === 1 && valueCell.firstElementChild.tagName === 'P'
        ? valueCell.firstElementChild : null;
      td.append(...(only || valueCell).childNodes);
    }
    tr.append(th, td);
    tbody.append(tr);
  });
  table.append(tbody);
  block.replaceChildren(table);
}
