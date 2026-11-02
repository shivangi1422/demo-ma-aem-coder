/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-grid-products, emitted as the Cards Grid block with the
 * products option. Base: cards.
 * Source: https://www.mybeckman.in/service/plans
 * Selectors: .Section .productCards, .productCards
 * Model: block "cards-grid" (text = optional heading/intro, classes = style)
 *        items "cards-grid-item" (image/imageAlt, text).
 * Row 1: heading/intro (empty - the decorator treats a leading row without a
 *        picture as the heading row, so it must be present to keep card 1).
 * Rows 2..N: one per .productCard - [image, H3 title + <p><a>Read More</a></p>].
 */
export default function parse(element, { document }) {
  const cards = Array.from(element.querySelectorAll(':scope > .productCard'));
  const cells = [];

  // Row 1: block-level heading/intro (none in source) - keep the empty row, no hint.
  cells.push(['']);

  cards.forEach((card) => {
    const img = card.querySelector('img.productCardImg, img');
    const heading = card.querySelector('.productCardBody h1, .productCardBody h2, .productCardBody h3, .productCardBody h4, h3');
    const link = card.querySelector(':scope > a[href], a.btn[href]');
    const title = heading ? heading.textContent.trim() : '';

    // Cell 1: image (source alt is empty - use the card title)
    const imageFrag = document.createDocumentFragment();
    if (img) {
      if (!img.getAttribute('alt') && title) img.setAttribute('alt', title);
      imageFrag.appendChild(document.createComment(' field:image '));
      imageFrag.appendChild(img);
    }

    // Cell 2: H3 title + Read More link
    const textFrag = document.createDocumentFragment();
    if (title || link) textFrag.appendChild(document.createComment(' field:text '));
    if (title) {
      const h3 = document.createElement('h3');
      h3.textContent = title;
      textFrag.appendChild(h3);
    }
    if (link) {
      const a = document.createElement('a');
      a.setAttribute('href', link.getAttribute('href'));
      a.textContent = link.textContent.trim() || 'Read More';
      const p = document.createElement('p');
      p.appendChild(a);
      textFrag.appendChild(p);
    }

    cells.push([imageFrag, textFrag]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards Grid (products)', cells });
  element.replaceWith(block);
}
