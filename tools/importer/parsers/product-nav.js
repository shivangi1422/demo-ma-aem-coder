/* eslint-disable */
/* global WebImporter */

/**
 * Parser for product-nav (Product Nav block): sticky in-page links on product pages.
 * Source: https://www.mybeckman.in/flow-cytometry/software/cytobank-enterprise
 * Selector: #intrenal-page-link-wrapper
 * Model: product-nav (links = richtext).
 * One row, one cell: a list of links to the section anchors (#features-wrapper, ...).
 */

const norm = (s) => (s || '').replace(/[\s ]+/g, ' ').trim();

export default function parse(element, { document }) {
  const ul = document.createElement('ul');
  element.querySelectorAll('a[href^="#"]').forEach((a) => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.setAttribute('href', a.getAttribute('href'));
    link.textContent = norm(a.textContent);
    li.appendChild(link);
    ul.appendChild(li);
  });
  const cell = document.createDocumentFragment();
  cell.appendChild(document.createComment(' field:links '));
  cell.appendChild(ul);
  const block = WebImporter.Blocks.createBlock(document, { name: 'Product Nav', cells: [[cell]] });
  element.replaceWith(block);
}
