/* eslint-disable */
/* global WebImporter */
/**
 * Parser: columns-cta -> block "Columns (cta)" (mybeckman.in /service/plans/centrifuge,
 * "Qualification Services" | "Rotor Repair").
 * Source: .Section > .row > .col-md-6 (x2) = h2 + p + a.btn (wrapped as <p><strong><a> by the
 * cleanup transformer) + <br><br> spacers (dropped; the variant spaces the button itself).
 * xwalk keeps columns variants only as one-word classes (model field `classes` on
 * blocks/columns), so this is the columns block with class "cta".
 * Library convention (Columns): one row, one cell per column. Cells are default content
 * (no field hints): <h2/>, <p/>, button <p><strong><a href>label</a></strong></p>.
 */

function norm(s) {
  return (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function cellContent(document, col) {
  const out = [];
  [...col.children].forEach((el) => {
    if (el.matches('br, style, script')) return;
    const t = norm(el.textContent);
    if (!t) return;
    if (el.matches('h1, h2, h3, h4, h5, h6')) {
      const h = document.createElement(el.tagName.toLowerCase());
      h.textContent = t;
      out.push(h);
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
    const p = document.createElement('p');
    p.textContent = t;
    out.push(p);
  });
  return out;
}

export default function parse(element, { document }) {
  const cols = [...element.children].filter((c) => norm(c.textContent));
  const row = cols.map((c) => cellContent(document, c)).filter((c) => c.length);
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns', variants: ['cta'], cells: [row.length ? row : ['']] });
  element.replaceWith(block);
}
