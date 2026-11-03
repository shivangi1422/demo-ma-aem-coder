/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-tile (xwalk items: cards-tile-item: image, text).
 * Source: div.ProductCards (case-sensitive; lowercase .productCards only with data-tiles, else default content) > .ProductCard (img.ProductCardImg, .ProductCardBody h3, a.btn).
 * Output: one row per card: [<!-- field:image --><img>] [<!-- field:text --><h3>…</h3><p><strong><a/></strong></p>]
 */
export default function parse(element, { document }) {
  // snapshots load in quirks mode, where class selectors ignore case: the lowercase
  // .productCards list on /service/plans is unstyled on the source and stays default content
  // (mybeckman-service-prepare marks lowercase lists the page itself styles as tiles: data-tiles)
  if (!element.className.split(/\s+/).includes('ProductCards') && !element.hasAttribute('data-tiles')) return;
  const cells = [];
  [...element.children].forEach((card) => {
    const imageCell = document.createDocumentFragment();
    const srcImg = card.querySelector('img');
    if (srcImg && srcImg.getAttribute('src')) {
      const img = document.createElement('img');
      img.src = srcImg.getAttribute('src');
      img.alt = srcImg.getAttribute('alt') || '';
      imageCell.appendChild(document.createComment(' field:image '));
      imageCell.appendChild(img);
      srcImg.remove();
    }
    const textCell = document.createDocumentFragment();
    const parts = [];
    card.querySelectorAll(':scope > div > *, :scope > p, :scope > h3, :scope > h4').forEach((n) => parts.push(n));
    if (parts.length) {
      textCell.appendChild(document.createComment(' field:text '));
      parts.forEach((n) => textCell.appendChild(n));
    }
    cells.push([imageCell, textCell]);
  });
  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-tile', cells });
  element.replaceWith(block);
}
