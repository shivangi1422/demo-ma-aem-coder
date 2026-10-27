/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-features (template: reagent-product).
 * Source: https://www.mybeckman.in/reagents/particle/valita-titer-assays
 *         https://www.mybeckman.in/reagents/particle/valita-aggregation-pure
 * Selector: #features-wrapper .bc-columns
 *
 * Columns convention: one row, one cell per .bc-column (H4 + bullet list).
 * Block names starting with "columns" are converted by md2jcr into the core
 * columns component (rows/cols), so no xwalk field hints are emitted.
 * blocks/columns-features/columns-features.js accepts this one-row shape.
 */
export default function parse(element, { document }) {
  const clean = (s) => (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();

  let columns = Array.from(element.querySelectorAll(':scope > .bc-column'));
  if (!columns.length) columns = Array.from(element.querySelectorAll('.bc-column'));

  const row = [];
  columns.forEach((col) => {
    const nodes = [];
    const heading = col.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading && clean(heading.textContent)) {
      const h = document.createElement('h4');
      h.innerHTML = heading.innerHTML;
      nodes.push(h);
    }
    const desc = col.querySelector('.bc-rich-text-desc') || col;
    Array.from(desc.querySelectorAll('ul, ol, p')).forEach((src) => {
      if (src.parentElement.closest('ul, ol, p') && desc.contains(src.parentElement.closest('ul, ol, p'))) return;
      const clone = src.cloneNode(true);
      clone.querySelectorAll('input, script, style').forEach((n) => n.remove());
      // drop &nbsp; spacer divs and trailing <br> / whitespace inside list items
      clone.querySelectorAll('div').forEach((d) => { if (!clean(d.textContent)) d.remove(); });
      clone.querySelectorAll('li').forEach((li) => {
        while (li.lastChild && (li.lastChild.nodeName === 'BR'
          || (li.lastChild.nodeType === 3 && !clean(li.lastChild.textContent)))) {
          li.lastChild.remove();
        }
      });
      if (clean(clone.textContent)) nodes.push(clone);
    });
    if (!nodes.length) return;
    const frag = document.createDocumentFragment();
    nodes.forEach((n) => frag.appendChild(n));
    row.push(frag);
  });

  const cells = row.length ? [row] : [['']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-features', cells });
  element.replaceWith(block);
}
