/* eslint-disable */
/* global WebImporter */

/**
 * Parser for specifications (Specifications block): product specification table.
 * Source: https://www.mybeckman.in/flow-cytometry/software/cytobank-enterprise
 * Selector: #product-specification-wrapper .specification-holder
 * Model: block "specifications" (container), items "specifications-item" (label, value).
 * One row per table row: [label] [value: text or list].
 */

const norm = (s) => (s || '').replace(/[\s ]+/g, ' ').trim();

export default function parse(element, { document }) {
  const cells = [];
  element.querySelectorAll('tr').forEach((tr) => {
    const tds = tr.querySelectorAll(':scope > td, :scope > th');
    if (tds.length < 2) return;
    const label = document.createDocumentFragment();
    label.appendChild(document.createComment(' field:label '));
    label.appendChild(document.createTextNode(norm(tds[0].textContent)));
    const value = document.createDocumentFragment();
    value.appendChild(document.createComment(' field:value '));
    const list = tds[1].querySelector('ul, ol');
    if (list) {
      const ul = document.createElement('ul');
      list.querySelectorAll('li').forEach((li) => {
        if (!norm(li.textContent)) return;
        const item = document.createElement('li');
        item.textContent = norm(li.textContent);
        ul.appendChild(item);
      });
      value.appendChild(ul);
    } else {
      const p = document.createElement('p');
      p.textContent = norm(tds[1].textContent);
      value.appendChild(p);
    }
    cells.push([label, value]);
  });
  const block = WebImporter.Blocks.createBlock(document, { name: 'Specifications', cells });
  element.replaceWith(block);
}
