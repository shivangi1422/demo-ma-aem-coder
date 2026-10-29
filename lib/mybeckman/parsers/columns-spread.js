/* eslint-disable */
/* global WebImporter */
/**
 * Parser: columns-spread -> block "Columns (spread)" (mybeckman.in /service/plans/flow-cytometry,
 * "BeckmanConnect Remote Support" | "Qualification Services").
 * Source: .Section > .Section__two-column > .Section__two-column-item (x2) = h2 + p + optional ul
 * + a.btn (wrapped as <p><strong><a> by the cleanup transformer). From 700px the items sit side by
 * side and spread their content over the column height (flex column, space-between).
 * xwalk keeps columns variants only as one-word classes (model field `classes` on
 * blocks/columns), so this is the columns block with class "spread".
 * Library convention (Columns): one row, one cell per column. Cells are default content
 * (no field hints): <h2/>, <p/>, <ul><li/></ul>, button <p><strong><a href>label</a></strong></p>.
 */

function norm(s) {
  return (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function textEl(document, tag, text) {
  const el = document.createElement(tag);
  el.textContent = text;
  return el;
}

function cellContent(document, col) {
  const out = [];
  [...col.children].forEach((el) => {
    if (el.matches('br, style, script')) return;
    const t = norm(el.textContent);
    if (!t) return;
    if (el.matches('h1, h2, h3, h4, h5, h6')) {
      out.push(textEl(document, el.tagName.toLowerCase(), t));
      return;
    }
    if (el.matches('ul, ol')) {
      const list = document.createElement(el.tagName.toLowerCase());
      [...el.querySelectorAll(':scope > li')].forEach((li) => {
        const lt = norm(li.textContent);
        if (lt) list.append(textEl(document, 'li', lt));
      });
      if (list.children.length) out.push(list);
      return;
    }
    const link = el.matches('a[href]') ? el : el.querySelector('a[href]');
    if (link && norm(link.textContent) === t) {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      const a = document.createElement('a');
      a.setAttribute('href', (link.getAttribute('href') || '').trim());
      a.textContent = t;
      strong.append(a);
      p.append(strong);
      out.push(p);
      return;
    }
    out.push(textEl(document, 'p', t));
  });
  return out;
}

export default function parse(element, { document }) {
  const cols = [...element.children].filter((c) => norm(c.textContent));
  const row = cols.map((c) => cellContent(document, c)).filter((c) => c.length);
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns', variants: ['spread'], cells: [row.length ? row : ['']] });
  element.replaceWith(block);
}
