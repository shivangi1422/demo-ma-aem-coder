/* eslint-disable */
/* global WebImporter */

/**
 * Parser for spec-table.
 * Source: https://www.mybeckman.in/flow-cytometry/software/cytobank-enterprise
 * Selector: #product-specification-wrapper .specification-holder
 * Item: table tr -> td (label) | td (value: text or a bulleted list)
 *
 * XWalk model (blocks/spec-table/_spec-table.json), item spec-row: label (text) | value (richtext)
 */

const clean = (text) => text.replace(/\s+/g, ' ').trim();

export default function parse(element, { document }) {
  const rows = [...element.querySelectorAll('tr')].filter((tr) => tr.children.length >= 2);
  const cells = rows.map((tr) => {
    const [labelTd, valueTd] = tr.children;
    const label = document.createDocumentFragment();
    label.appendChild(document.createComment(' field:label '));
    label.appendChild(document.createTextNode(clean(labelTd.textContent)));

    const value = document.createDocumentFragment();
    value.appendChild(document.createComment(' field:value '));
    const lists = [...valueTd.querySelectorAll('ul, ol')].filter((list) => !list.parentElement.closest('ul, ol'));
    if (lists.length) {
      lists.forEach((list) => {
        const copy = document.createElement(list.tagName.toLowerCase());
        // only real items: the source nests an empty <ul> inside the list
        list.querySelectorAll(':scope > li').forEach((li) => {
          const item = document.createElement('li');
          item.textContent = clean(li.textContent);
          if (item.textContent) copy.appendChild(item);
        });
        value.appendChild(copy);
      });
    } else {
      const p = document.createElement('p');
      p.textContent = clean(valueTd.textContent);
      value.appendChild(p);
    }
    return [label, value];
  });
  const block = WebImporter.Blocks.createBlock(document, { name: 'spec-table', cells });
  element.replaceWith(block);
}
