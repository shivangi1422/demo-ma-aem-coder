/* eslint-disable */
/* global WebImporter */

/**
 * Parser for related-products.
 * Source: https://www.mybeckman.in/flow-cytometry/software/cytobank-enterprise
 * Selector: #related-parts-wrapper .related-parts (slick carousel)
 * Item: .related-part (not .slick-cloned)
 *   image       -> .related-part__img img
 *   title       -> .related-part__title > a:not(.related-part__desc)
 *   description -> .related-part__desc
 *   link        -> the card's product link (store.beckman.com)
 *
 * XWalk model (blocks/related-products/_related-products.json), item related-product:
 *   image (+ imageAlt) | title | description | link
 */

const clean = (text) => text.replace(/\s+/g, ' ').trim();

export default function parse(element, { document }) {
  const items = [...element.querySelectorAll('.related-part')]
    .filter((item) => !item.classList.contains('slick-cloned'));
  const cells = items.map((item) => {
    const img = item.querySelector('.related-part__img img, img');
    const title = item.querySelector('.related-part__title > a:not(.related-part__desc)');
    const desc = item.querySelector('.related-part__desc');
    const link = item.querySelector('a[href]');

    const imageCell = document.createDocumentFragment();
    imageCell.appendChild(document.createComment(' field:image '));
    if (img && img.getAttribute('src')) {
      const image = document.createElement('img');
      image.setAttribute('src', img.getAttribute('src'));
      image.setAttribute('alt', img.getAttribute('alt') || '');
      imageCell.appendChild(image);
    }

    const titleCell = document.createDocumentFragment();
    titleCell.appendChild(document.createComment(' field:title '));
    if (title) titleCell.appendChild(document.createTextNode(clean(title.textContent)));

    const descCell = document.createDocumentFragment();
    descCell.appendChild(document.createComment(' field:description '));
    if (desc) descCell.appendChild(document.createTextNode(clean(desc.textContent)));

    const linkCell = document.createDocumentFragment();
    linkCell.appendChild(document.createComment(' field:link '));
    if (link) {
      const a = document.createElement('a');
      a.setAttribute('href', link.getAttribute('href'));
      a.textContent = link.getAttribute('href');
      linkCell.appendChild(a);
    }
    return [imageCell, titleCell, descCell, linkCell];
  });
  const block = WebImporter.Blocks.createBlock(document, { name: 'related-products', cells });
  element.replaceWith(block);
}
