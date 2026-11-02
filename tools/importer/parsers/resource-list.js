/* eslint-disable */
/* global WebImporter */

/**
 * Parser for resource-list.
 * Source: https://www.mybeckman.in/flow-cytometry/software/cytobank-enterprise
 * Selector: #product-documentation-wrapper .content-resource-list-wrapper
 * Item: .content-resource-list-child
 *   type        -> icon class (fa-video = video, fa-file* = document, otherwise web-page),
 *                  recorded on the item as data-icon by the cleanup transformer
 *   link        -> a.content-resource-list-heading (href + title text)
 *   description -> .content-resource-list-text (kept verbatim: the live page shows it as text)
 *
 * XWalk model (blocks/resource-list/_resource-list.json), item resource:
 *   type | link (+ linkText) | description
 */

const clean = (text) => text.replace(/\s+/g, ' ').trim();

function typeOf(item) {
  // the importer drops the empty icon <i>; the cleanup transformer keeps its class
  // in data-icon (Font Awesome may also have swapped it for an inline <svg>)
  const icon = item.querySelector('.content-resource-list-icon [class*="fa-"]');
  const cls = item.dataset.icon || (icon ? icon.getAttribute('class') : '');
  if (/fa-video|fa-play|fa-film/.test(cls)) return 'video';
  if (/fa-file|fa-book/.test(cls)) return 'document';
  return 'web-page';
}

export default function parse(element, { document }) {
  const items = [...element.querySelectorAll(':scope > .content-resource-list-child')];
  const cells = items.map((item) => {
    const link = item.querySelector('a.content-resource-list-heading, a[href]');
    const text = item.querySelector('.content-resource-list-text');

    const type = document.createDocumentFragment();
    type.appendChild(document.createComment(' field:type '));
    type.appendChild(document.createTextNode(typeOf(item)));

    const linkCell = document.createDocumentFragment();
    linkCell.appendChild(document.createComment(' field:link '));
    if (link) {
      const a = document.createElement('a');
      a.setAttribute('href', link.getAttribute('href'));
      a.textContent = clean(link.textContent);
      linkCell.appendChild(a);
    }

    const description = document.createDocumentFragment();
    description.appendChild(document.createComment(' field:description '));
    if (text && clean(text.textContent)) {
      description.appendChild(document.createTextNode(clean(text.textContent)));
    }
    return [type, linkCell, description];
  });
  const block = WebImporter.Blocks.createBlock(document, { name: 'resource-list', cells });
  element.replaceWith(block);
}
