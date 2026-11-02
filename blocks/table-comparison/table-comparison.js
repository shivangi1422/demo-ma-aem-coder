import { moveInstrumentation } from '../../scripts/scripts.js';

const MARKERS = {
  '●': { className: 'table-comparison-dot', label: 'Included' },
  '○': { className: 'table-comparison-circle', label: 'Optional at additional charge' },
};

/**
 * Builds the visual marker (aria-hidden) plus its visually-hidden label.
 * @param {string} glyph ● or ○
 * @param {boolean} withLabel add the visually-hidden text label
 * @returns {Node[]}
 */
function buildMarker(glyph, withLabel = true) {
  const { className, label } = MARKERS[glyph];
  const mark = document.createElement('span');
  mark.className = `table-comparison-marker ${className}`;
  mark.setAttribute('aria-hidden', 'true');
  if (!withLabel) return [mark];
  const text = document.createElement('span');
  text.className = 'table-comparison-sr';
  text.textContent = label;
  return [mark, text];
}

/**
 * Moves the authored cell content into a table cell, turning a lone ● / ○ into a marker.
 * @param {Element} from authored cell
 * @param {Element} to td / th
 */
function fillCell(from, to) {
  moveInstrumentation(from, to);
  const text = from.textContent.trim();
  if (MARKERS[text]) {
    to.append(...buildMarker(text));
    return;
  }
  // plain-text fields may come wrapped in a single paragraph; unwrap it
  const only = from.children.length === 1 ? from.firstElementChild : null;
  const source = only && only.tagName === 'P' && only.textContent.trim() === text ? only : from;
  if (source !== from) moveInstrumentation(source, to);
  while (source.firstChild) to.append(source.firstChild);
}

/**
 * Accessible name for the scroll region: the closest heading before the block.
 * @param {Element} block
 * @returns {string}
 */
function findLabel(block) {
  let el = block.parentElement && block.parentElement.matches('.table-comparison-wrapper')
    ? block.parentElement : block;
  while (el) {
    el = el.previousElementSibling;
    if (!el) break;
    const headings = el.matches('h1, h2, h3, h4, h5, h6') ? [el] : [...el.querySelectorAll('h1, h2, h3, h4, h5, h6')];
    if (headings.length) return headings[headings.length - 1].textContent.trim();
  }
  return 'Plan comparison';
}

/**
 * Legend paragraphs after the block ("● included", "○ optional ...") are default
 * content; render their glyphs as the same marker shapes.
 * @param {Element} block
 */
function decorateLegend(block) {
  const wrapper = block.parentElement;
  const next = wrapper && wrapper.nextElementSibling;
  if (!next || !next.classList.contains('default-content-wrapper')) return;
  next.querySelectorAll(':scope > p').forEach((p) => {
    if (!/^\s*[●○]/.test(p.textContent)) return;
    p.classList.add('table-comparison-legend');
    const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach((node) => {
      const parts = node.textContent.split(/([●○])/);
      if (parts.length === 1) return;
      node.replaceWith(...parts.filter((part) => part !== '').flatMap((part) => (
        MARKERS[part] ? buildMarker(part, false) : [document.createTextNode(part)]
      )));
    });
  });
}

/**
 * Decorates the table-comparison block into an accessible <table>.
 * Authored structure (every row has the same number of cells):
 *   row 1  = group headers: first cell empty, a group label followed by empty cells
 *            for every further column the group spans (optional)
 *   row 2  = plan names, first cell empty
 *   rows 3+ = feature label + one value per plan: "●" included, "○" optional at
 *            additional charge, free text (e.g. "10% Off") or empty
 * Option `highlight` frames the last plan column.
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const cellsOf = (row) => [...row.children];
  // leading rows whose first cell is empty are header rows (group row + plan row)
  let headerCount = 0;
  while (headerCount < Math.min(2, rows.length - 1)
    && cellsOf(rows[headerCount])[0]?.textContent.trim() === '') headerCount += 1;
  const hasGroups = headerCount === 2;

  const columnCount = Math.max(...rows.map((row) => cellsOf(row).length));

  // column index -> true when a new group (other than the first) starts there
  const groupStarts = new Set();
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  if (hasGroups) {
    const groupRow = rows[0];
    const tr = document.createElement('tr');
    moveInstrumentation(groupRow, tr);
    const cells = cellsOf(groupRow);
    let firstGroupSeen = false;
    let i = 0;
    while (i < columnCount) {
      const cell = cells[i];
      const label = cell ? cell.textContent.trim() : '';
      if (i === 0 || !label) {
        const td = document.createElement('td');
        if (cell) fillCell(cell, td);
        tr.append(td);
        i += 1;
      } else {
        let span = 1;
        while (i + span < columnCount && !(cells[i + span]?.textContent.trim())) span += 1;
        const th = document.createElement('th');
        th.scope = 'colgroup';
        if (span > 1) th.colSpan = span;
        th.className = 'table-comparison-group';
        fillCell(cell, th);
        if (firstGroupSeen) {
          groupStarts.add(i);
          th.classList.add('table-comparison-group-start');
        }
        firstGroupSeen = true;
        // keep instrumentation of the spanned (empty) cells on the group header
        for (let s = 1; s < span; s += 1) {
          if (cells[i + s]) moveInstrumentation(cells[i + s], th);
        }
        tr.append(th);
        i += span;
      }
    }
    thead.append(tr);
  }

  const markGroupStart = (el, index) => {
    if (groupStarts.has(index)) el.classList.add('table-comparison-group-start');
  };

  rows.slice(hasGroups ? 1 : 0).forEach((row, rowIndex) => {
    const isHeader = rowIndex === 0 && headerCount > 0;
    const tr = document.createElement('tr');
    moveInstrumentation(row, tr);
    const cells = cellsOf(row);
    for (let i = 0; i < columnCount; i += 1) {
      const cell = cells[i];
      let el;
      if (i === 0) {
        el = document.createElement(isHeader ? 'td' : 'th');
        if (isHeader) el.className = 'table-comparison-corner';
        else el.scope = 'row';
      } else {
        el = document.createElement(isHeader ? 'th' : 'td');
        if (isHeader) el.scope = 'col';
      }
      if (cell) fillCell(cell, el);
      markGroupStart(el, i);
      tr.append(el);
    }
    (isHeader ? thead : tbody).append(tr);
  });

  if (thead.children.length) table.append(thead);
  table.append(tbody);

  const scroller = document.createElement('div');
  scroller.className = 'table-comparison-scroll';
  scroller.tabIndex = 0;
  scroller.setAttribute('role', 'region');
  scroller.setAttribute('aria-label', findLabel(block));
  scroller.append(table);

  block.replaceChildren(scroller);
  decorateLegend(block);
}
