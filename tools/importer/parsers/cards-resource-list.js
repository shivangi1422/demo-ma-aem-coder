/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-resource-list (template: reagent-product).
 * Source: https://www.mybeckman.in/reagents/particle/valita-titer-assays
 *         https://www.mybeckman.in/reagents/particle/valita-aggregation-pure
 * Selector: #product-documentation-wrapper .content-resource-list-wrapper
 *
 * Model (blocks/cards-resource-list/_cards-resource-list.json):
 *   container block (no block model), item "cards-resource-list-item":
 *   format (select: video | pdf | document), link (aem-content) [+ linkText collapsed]
 *
 * Output rows: one per .content-resource-list-child -> [format, linked title]
 *   fa-video -> video, fa-file-pdf -> pdf, anything else -> document
 */
export default function parse(element, { document }) {
  const clean = (s) => (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();

  const toFormat = (child) => {
    const icon = child.querySelector('.content-resource-list-icon i, .content-resource-list-icon [class*="fa-"]');
    const cls = icon ? icon.className : '';
    if (/\bfa-video\b/.test(cls)) return 'video';
    if (/\bfa-file-pdf\b/.test(cls)) return 'pdf';
    return 'document';
  };

  const cells = [];
  Array.from(element.querySelectorAll('.content-resource-list-child')).forEach((child) => {
    const src = child.querySelector('a.content-resource-list-heading[href]')
      || child.querySelector('a[href]');
    if (!src) return;
    const title = clean(src.textContent);
    const href = src.getAttribute('href');
    if (!title || !href) return;

    const formatCell = document.createDocumentFragment();
    formatCell.appendChild(document.createComment(' field:format '));
    formatCell.appendChild(document.createTextNode(toFormat(child)));

    const a = document.createElement('a');
    a.setAttribute('href', href);
    a.textContent = title;
    const linkCell = document.createDocumentFragment();
    linkCell.appendChild(document.createComment(' field:link '));
    linkCell.appendChild(a);

    cells.push([formatCell, linkCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-resource-list', cells });
  element.replaceWith(block);
}
