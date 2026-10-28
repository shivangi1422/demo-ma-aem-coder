/* eslint-disable */
/* global WebImporter */

/**
 * Parser for table-striped-mb (block: table-striped).
 * Source: protein-production div.table-wrapper > table.aeo-table
 *   thead > tr > th ×2 ("Expression Host | Example"), tbody > tr ×6 > td ×2
 *   (em / sup kept; trailing &nbsp; / <br><br> in column 1 dropped).
 * The caption paragraph "Table 1. ..." (div.table-wrapper + p) stays default
 * content after the block.
 *
 * Library convention (Table): first row = column headers, following rows =
 * data, same number of cells in every row.
 * xwalk: no container model; every row is a `table-striped-row` item with
 * richtext fields column1..column4 (a 2-cell row maps to column1, column2).
 *
 * Rows: header row, then one row per data row; each cell
 *   <!-- field:columnN --> inline rich text (em, strong, sup, sub, links).
 */

const clean = (str) => (str || '').replace(/[\s ]+/g, ' ').trim();

const isUsableHref = (href) => !!href && href.trim() !== '' && href.trim() !== '#'
  && !/^javascript:/i.test(href.trim());

/** copies inline content (text, links, bold, italics, sup/sub); <br> dropped */
function copyInline(src, dest, document) {
  src.childNodes.forEach((node) => {
    if (node.nodeType === 3) {
      dest.append(document.createTextNode(node.textContent.replace(/[\s ]+/g, ' ')));
      return;
    }
    if (node.nodeType !== 1) return;
    const tag = node.tagName;
    if (tag === 'BR') {
      dest.append(document.createTextNode(' '));
      return;
    }
    if (/^(SCRIPT|STYLE|IMG|SVG)$/.test(tag) || !clean(node.textContent)) return;
    if (tag === 'A' && isUsableHref(node.getAttribute('href'))) {
      const a = document.createElement('a');
      a.href = node.getAttribute('href').trim();
      copyInline(node, a, document);
      dest.append(a);
      return;
    }
    if (/^(STRONG|B|EM|I|SUP|SUB)$/.test(tag)) {
      const el = document.createElement({ B: 'strong', I: 'em' }[tag] || tag.toLowerCase());
      copyInline(node, el, document);
      // move inner edge spaces outside the inline element ("<em>Sf9 </em>(...)")
      const last = el.lastChild;
      const trailing = last && last.nodeType === 3 && /\s$/.test(last.textContent);
      if (trailing) last.textContent = last.textContent.replace(/\s+$/, '');
      dest.append(el);
      if (trailing) dest.append(document.createTextNode(' '));
      return;
    }
    copyInline(node, dest, document);
  });
}

function tidy(el) {
  const first = el.firstChild;
  if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^\s+/, '');
  const last = el.lastChild;
  if (last && last.nodeType === 3) last.textContent = last.textContent.replace(/\s+$/, '');
  [...el.childNodes].forEach((n) => {
    if (n.nodeType === 3 && !n.textContent) n.remove();
  });
  return el;
}

export default function parse(element, { document }) {
  const table = element.matches('table') ? element : element.querySelector('table');
  const rows = table ? [...table.querySelectorAll('tr')] : [];
  const width = Math.min(4, Math.max(0, ...rows.map((tr) => tr.querySelectorAll(':scope > th, :scope > td').length)));

  const cells = [];
  rows.forEach((tr) => {
    const srcCells = [...tr.querySelectorAll(':scope > th, :scope > td')];
    if (!srcCells.some((c) => clean(c.textContent))) return;
    const row = [];
    for (let i = 0; i < width; i += 1) {
      const src = srcCells[i];
      const p = document.createElement('p');
      if (src) copyInline(src, p, document);
      tidy(p);
      // the cell keeps its <p>: loose inline nodes (em + text + sup) would
      // each become a paragraph of their own in the converted page
      row.push(clean(p.textContent)
        ? [document.createComment(` field:column${i + 1} `), p]
        : '');
    }
    cells.push(row);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'table-striped', cells });
  element.replaceWith(block);
}
