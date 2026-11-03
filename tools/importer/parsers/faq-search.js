/* eslint-disable */
/* global WebImporter */

/**
 * Parser for faq-search (xwalk block model faq-search, field "categories" text).
 * Source: the search box + category checkboxes of a FAQ listing, reduced by
 * mybeckman-faq-listing-prepare to div.faq-search-source[data-categories="A, B"].
 * Output (one row, one cell): <!-- field:categories --><p>A, B</p> (empty cell when no filters)
 */
export default function parse(element, { document }) {
  const categories = (element.getAttribute('data-categories') || '').trim();
  const cell = document.createDocumentFragment();
  if (categories) {
    cell.appendChild(document.createComment(' field:categories '));
    const p = document.createElement('p');
    p.textContent = categories;
    cell.appendChild(p);
  }
  const block = WebImporter.Blocks.createBlock(document, { name: 'faq-search', cells: [[cell]] });
  element.replaceWith(block);
}
