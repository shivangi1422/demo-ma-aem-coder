import { moveInstrumentation } from '../../scripts/scripts.js';

const PAGE_SIZE = 5;
const DEFAULT_HEADERS = ['Title', 'Document Type', 'Doc Id', 'Lot Number(s)'];

/**
 * Adds a simple client-side pager when the table exceeds the page size.
 * Skipped inside Universal Editor so authors can see every row.
 * @param {Element} block
 * @param {HTMLTableSectionElement} tbody
 */
function paginate(block, tbody) {
  const rows = [...tbody.rows];
  const pages = Math.ceil(rows.length / PAGE_SIZE);
  if (pages <= 1 || block.closest('[data-aue-resource]')) return;

  const nav = document.createElement('nav');
  nav.className = 'cards-doc-table-pager';
  nav.setAttribute('aria-label', 'Document pages');
  const buttons = [];
  let current = 0;

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.textContent = 'Previous';
  const next = document.createElement('button');
  next.type = 'button';
  next.textContent = 'Next';

  const show = (page) => {
    current = page;
    rows.forEach((tr, i) => {
      tr.hidden = Math.floor(i / PAGE_SIZE) !== page;
    });
    buttons.forEach((b, i) => {
      if (i === page) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
    prev.disabled = page === 0;
    next.disabled = page === pages - 1;
  };

  prev.addEventListener('click', () => show(Math.max(0, current - 1)));
  next.addEventListener('click', () => show(Math.min(pages - 1, current + 1)));

  nav.append(prev);
  for (let p = 0; p < pages; p += 1) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = `${p + 1}`;
    button.setAttribute('aria-label', `Page ${p + 1}`);
    button.addEventListener('click', () => show(p));
    buttons.push(button);
    nav.append(button);
  }
  nav.append(next);
  block.append(nav);
  show(0);
}

/**
 * Decorates the cards-doc-table block: a tabular list of technical documents.
 *
 * Authored structure:
 *   optional row 0: one cell with comma-separated column headings
 *     (defaults to "Title, Document Type, Doc Id, Lot Number(s)")
 *   rows 1..N: one document each: linked title | document type | doc id | lot number(s)
 * Rendered as a semantic table; on narrow screens each row stacks with its
 * column heading shown as a label.
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];
  let headers = DEFAULT_HEADERS;

  const first = rows[0];
  if (first && first.children.length <= 1 && !first.querySelector('a[href]')) {
    const text = first.textContent.trim();
    if (text) headers = text.split(',').map((h) => h.trim());
    rows.shift();
  }

  const table = document.createElement('table');
  const thead = table.createTHead();
  const headRow = thead.insertRow();
  headers.forEach((label) => {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = label;
    headRow.append(th);
  });

  const tbody = table.createTBody();
  rows.forEach((row) => {
    const cells = [...row.children];
    if (cells.every((c) => c.textContent.trim() === '')) return;
    const tr = document.createElement('tr');
    moveInstrumentation(row, tr);
    headers.forEach((label, i) => {
      const td = document.createElement('td');
      td.dataset.label = label;
      const cell = cells[i];
      if (cell) {
        moveInstrumentation(cell, td);
        // Unwrap a lone paragraph so cells hold inline content.
        const only = cell.children.length === 1 && cell.firstElementChild.tagName === 'P'
          ? cell.firstElementChild : cell;
        while (only.firstChild) td.append(only.firstChild);
      }
      td.querySelectorAll('a.button').forEach((a) => a.classList.remove('button', 'primary', 'secondary', 'accent'));
      tr.append(td);
    });
    tbody.append(tr);
  });

  const scroller = document.createElement('div');
  scroller.className = 'cards-doc-table-scroller';
  scroller.append(table);
  block.replaceChildren(scroller);
  paginate(block, tbody);
}
