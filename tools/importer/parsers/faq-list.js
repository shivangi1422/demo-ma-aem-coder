/* eslint-disable */
/* global WebImporter */

/**
 * Parser for faq-list (xwalk items faq-list-item: link + linkText, categories).
 * Source: .table-block > table (empty grey header row, one question link per row);
 * row categories are set by mybeckman-faq-listing-prepare (tr[data-categories]).
 * Output: one row per question:
 *   [<!-- field:link --><p><a href="/support/faq/…">Question</a></p>] [<!-- field:categories --><p>A, B</p>]
 * Question text is plain text (the link text field), inline markup in the source link is flattened.
 */
function toSiteRelative(href) {
  try {
    const url = new URL(href, 'https://www.mybeckman.in');
    if (/(^|\.)mybeckman\.in$/i.test(url.hostname) || href.startsWith('/')) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch (e) { /* keep as is */ }
  return href;
}

export default function parse(element, { document }) {
  const cells = [];
  element.querySelectorAll('tbody tr').forEach((tr) => {
    const link = tr.querySelector('a[href]');
    if (!link) return;
    const text = link.textContent.replace(/[\s ]+/g, ' ').trim();
    if (!text) return;
    const linkCell = document.createDocumentFragment();
    linkCell.appendChild(document.createComment(' field:link '));
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = toSiteRelative(link.getAttribute('href'));
    a.textContent = text;
    p.append(a);
    linkCell.appendChild(p);

    const catCell = document.createDocumentFragment();
    const categories = (tr.getAttribute('data-categories') || '').trim();
    if (categories) {
      catCell.appendChild(document.createComment(' field:categories '));
      const cp = document.createElement('p');
      cp.textContent = categories;
      catCell.appendChild(cp);
    }
    cells.push([linkCell, catCell]);
  });
  if (!cells.length) return;
  element.replaceWith(WebImporter.Blocks.createBlock(document, { name: 'faq-list', cells }));
}
