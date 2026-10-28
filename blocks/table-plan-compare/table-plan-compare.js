import { moveInstrumentation, rowContentCells } from '../../scripts/scripts.js';

const MAX_PLANS = 6;
const TOKEN_RE = /:(dot-ring|dot):/g;
const HAS_TOKEN = /:(dot-ring|dot):/;
const MARKER_TEXT = {
  dot: 'Included',
  'dot-ring': 'Optional at additional charge',
};

function el(tag, className, attrs = {}) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  return node;
}

/**
 * A CSS circle marker. In table cells it carries visually-hidden text for
 * screen readers; in the legend (where the meaning is spelled out next to it)
 * it is decorative.
 * @param {'dot'|'dot-ring'} kind
 * @param {boolean} decorative
 */
function createMarker(kind, decorative) {
  const marker = el('span', `table-plan-compare-marker table-plan-compare-${kind}`);
  if (decorative) {
    marker.setAttribute('aria-hidden', 'true');
  } else {
    const sr = el('span', 'table-plan-compare-sr');
    sr.textContent = MARKER_TEXT[kind];
    marker.append(sr);
  }
  return marker;
}

/**
 * Replaces :dot: / :dot-ring: tokens (raw text or EDS icon spans) inside a
 * container with CSS markers.
 * @param {Element} root
 * @param {boolean} decorative
 */
function replaceTokens(root, decorative) {
  root.querySelectorAll('span.icon').forEach((icon) => {
    if (icon.classList.contains('icon-dot-ring')) icon.replaceWith(createMarker('dot-ring', decorative));
    else if (icon.classList.contains('icon-dot')) icon.replaceWith(createMarker('dot', decorative));
  });
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const texts = [];
  while (walker.nextNode()) texts.push(walker.currentNode);
  texts.forEach((text) => {
    const value = text.textContent;
    if (!HAS_TOKEN.test(value)) return;
    const frag = document.createDocumentFragment();
    let last = 0;
    TOKEN_RE.lastIndex = 0;
    let m = TOKEN_RE.exec(value);
    while (m) {
      if (m.index > last) frag.append(value.slice(last, m.index));
      frag.append(createMarker(m[1], decorative));
      last = m.index + m[0].length;
      m = TOKEN_RE.exec(value);
    }
    if (last < value.length) frag.append(value.slice(last));
    text.replaceWith(frag);
  });
}

/** Content nodes of a cell: a lone paragraph is unwrapped (cells hold inline text). */
function cellNodes(cell) {
  if (!cell) return [];
  const els = [...cell.children];
  const strayText = [...cell.childNodes]
    .some((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
  if (els.length === 1 && els[0].tagName === 'P' && !strayText) return [...els[0].childNodes];
  return [...cell.childNodes];
}

function hasContent(cell) {
  return !!cell && (cell.textContent.trim() !== '' || !!cell.querySelector('img, svg, .icon'));
}

/**
 * "LABEL: 3" entries (comma-separated; list items, paragraphs or lines also work). The
 * older "LABEL | 3" form is still read; ":" is the authored form because a "|" does not
 * survive the xwalk content conversion (it is a table cell delimiter there).
 */
function parseGroups(cell) {
  const items = [...cell.querySelectorAll('li, p')];
  const text = (items.length ? items.map((n) => n.textContent) : [cell.textContent]).join('\n');
  const groups = [];
  const re = /([^\n|:]+?)\s*[|:]\s*(\d+)\s*(?:[,;]|\n|$)/g;
  let m = re.exec(text);
  while (m) {
    const label = m[1].replace(/^[\s,;]+/, '').trim();
    const span = parseInt(m[2], 10);
    if (span > 0) groups.push({ label, span });
    m = re.exec(text);
  }
  return groups;
}

/**
 * Table (plan compare): a semantic comparison table with grouped plan columns,
 * a spacer between groups, an optional highlighted plan column and a legend.
 *
 * Authored structure (xwalk container: block fields, then items):
 *   row: groups    — one cell, "LABEL: span" entries, comma-separated
 *                    (e.g. "Warranty Period: 3, Post-Warranty Period: 2")
 *   row: highlight — one cell, "none" or 1..6 (authored plan column number)
 *   row: legend    — one cell, rich text (":dot: included", ":dot-ring: optional ...")
 *   rows: one per Plan Row item, cells [label, plan1 … plan6]; the first item is
 *         the column-header row (label empty). Cell values: ":dot:", ":dot-ring:",
 *         text (e.g. "10% Off") or empty. Plan columns empty in every row are dropped.
 * @param {Element} block
 */
export default function decorate(block) {
  let groupsCell = null;
  let highlight = null;
  let legendCell = null;
  const items = [];

  [...block.children].forEach((row) => {
    const cells = rowContentCells(row);
    const isItem = row.dataset.aueModel === 'table-plan-compare-row' || cells.length >= 2;
    if (isItem) {
      items.push({ row, cells });
      return;
    }
    const cell = cells[0];
    const text = cell ? cell.textContent.trim() : '';
    if (!text && !cell?.querySelector('.icon')) return;
    if (/^(none|[1-9])$/i.test(text) && highlight === null) {
      highlight = text.toLowerCase() === 'none' ? 0 : parseInt(text, 10);
    } else if (!groupsCell && !HAS_TOKEN.test(text) && !cell.querySelector('.icon') && /[|:]\s*\d+/.test(text)) {
      groupsCell = cell;
    } else if (!legendCell) {
      legendCell = cell;
    }
  });

  // plan columns that hold a value in at least one row
  const planIndexes = [];
  for (let i = 1; i <= MAX_PLANS; i += 1) {
    if (items.some(({ cells }) => hasContent(cells[i]))) planIndexes.push(i);
  }

  // column layout: plan columns, with a spacer between consecutive groups
  const groups = groupsCell ? parseGroups(groupsCell) : [];
  const layout = [];
  const headerGroups = [];
  let next = 0;
  groups.forEach((group) => {
    const span = Math.min(group.span, planIndexes.length - next);
    if (span <= 0) return;
    if (headerGroups.length) layout.push({ spacer: true });
    headerGroups.push({ label: group.label, span });
    planIndexes.slice(next, next + span).forEach((plan) => layout.push({ plan }));
    next += span;
  });
  if (next < planIndexes.length) {
    if (headerGroups.length) headerGroups.push({ label: '', span: planIndexes.length - next, rest: true });
    planIndexes.slice(next).forEach((plan) => layout.push({ plan }));
  }

  const table = el('table');

  // column groups (scope=colgroup headers need matching <colgroup> elements)
  if (headerGroups.length) {
    table.append(el('colgroup', '', { span: '1' }));
    headerGroups.forEach((group, i) => {
      if (i > 0 && !group.rest) table.append(el('colgroup', 'table-plan-compare-spacer-col', { span: '1' }));
      table.append(el('colgroup', '', { span: String(group.span) }));
    });
  }

  const cellClasses = (entry, i) => {
    const classes = [];
    if (layout[i - 1]?.spacer) classes.push('table-plan-compare-after-spacer');
    if (entry.plan === highlight) classes.push('table-plan-compare-highlight');
    return classes.join(' ');
  };

  const fillCell = (cellEl, source, isHeader) => {
    const nodes = cellNodes(source);
    if (!nodes.length || !hasContent(source)) {
      if (!isHeader) {
        const sr = el('span', 'table-plan-compare-sr');
        sr.textContent = 'Not included';
        cellEl.append(sr);
      }
      return;
    }
    cellEl.append(...nodes);
    replaceTokens(cellEl, false);
  };

  const thead = el('thead');
  if (headerGroups.length) {
    const tr = el('tr', 'table-plan-compare-groups');
    tr.append(el('td', 'table-plan-compare-corner'));
    headerGroups.forEach((group, i) => {
      if (i > 0 && !group.rest) tr.append(el('td', 'table-plan-compare-spacer', { 'aria-hidden': 'true' }));
      const th = el(group.rest ? 'td' : 'th', group.rest ? 'table-plan-compare-group-empty' : 'table-plan-compare-group');
      if (!group.rest) th.setAttribute('scope', 'colgroup');
      if (group.span > 1) th.colSpan = group.span;
      th.textContent = group.label;
      tr.append(th);
    });
    thead.append(tr);
  }

  const [headerItem, ...bodyItems] = items;
  if (headerItem) {
    const tr = el('tr', 'table-plan-compare-columns');
    moveInstrumentation(headerItem.row, tr);
    const corner = hasContent(headerItem.cells[0])
      ? el('th', 'table-plan-compare-label', { scope: 'col' })
      : el('td', 'table-plan-compare-label');
    fillCell(corner, headerItem.cells[0], true);
    tr.append(corner);
    layout.forEach((entry, i) => {
      if (entry.spacer) {
        tr.append(el('td', 'table-plan-compare-spacer', { 'aria-hidden': 'true' }));
        return;
      }
      const th = el('th', cellClasses(entry, i), { scope: 'col' });
      fillCell(th, headerItem.cells[entry.plan], true);
      tr.append(th);
    });
    thead.append(tr);
  }
  if (thead.children.length) table.append(thead);

  const tbody = el('tbody');
  bodyItems.forEach(({ row, cells }) => {
    const tr = el('tr');
    moveInstrumentation(row, tr);
    const th = el('th', 'table-plan-compare-label', { scope: 'row' });
    cellNodes(cells[0]).forEach((n) => th.append(n));
    replaceTokens(th, false);
    tr.append(th);
    layout.forEach((entry, i) => {
      if (entry.spacer) {
        tr.append(el('td', 'table-plan-compare-spacer', { 'aria-hidden': 'true' }));
        return;
      }
      const td = el('td', cellClasses(entry, i));
      fillCell(td, cells[entry.plan], false);
      tr.append(td);
    });
    tbody.append(tr);
  });
  table.append(tbody);

  // horizontally scrollable on narrow screens; keyboard-focusable region
  const scroller = el('div', 'table-plan-compare-scroll', { tabindex: '0', role: 'region' });
  const heading = block.closest('.section')?.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading?.id) scroller.setAttribute('aria-labelledby', heading.id);
  else scroller.setAttribute('aria-label', heading?.textContent.trim() || 'Plan comparison');
  scroller.append(table);

  const children = [scroller];
  if (legendCell && hasContent(legendCell)) {
    const legend = el('div', 'table-plan-compare-legend');
    moveInstrumentation(legendCell, legend);
    legend.append(...legendCell.childNodes);
    [...legend.childNodes].forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        const p = el('p');
        node.replaceWith(p);
        p.append(node);
      }
    });
    replaceTokens(legend, true);
    children.push(legend);
  }

  block.replaceChildren(...children);
}
