/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-category (xwalk items cards-category-item: image, imageAlt, text) — cards convention.
 * Source: #content-holder > div.row with two columns of a.faq-item
 * (image from mybeckman-faq-listing-prepare, .faq-item--content: h4 title + text).
 * Output: one row per card, in source reading order (left column, then right column):
 *   [<!-- field:image --><img>] [<!-- field:text --><h2><a href>Title</a></h2><p>Text</p>]
 * (an empty image cell is kept when a card has no image)
 * The source h4 becomes h2 (next level under the page h1); styled as the source h4.
 */
export default function parse(element, { document }) {
  const items = [...element.querySelectorAll('a.faq-item')];
  if (!items.length) return;
  const cells = items.map((item) => {
    const imageCell = document.createDocumentFragment();
    const srcImg = item.querySelector('img');
    if (srcImg) {
      const img = document.createElement('img');
      img.src = srcImg.getAttribute('src');
      img.alt = srcImg.getAttribute('alt') || '';
      imageCell.appendChild(document.createComment(' field:image '));
      imageCell.appendChild(img);
    }
    const content = item.querySelector('.faq-item--content') || item;
    const heading = content.querySelector('h1, h2, h3, h4, h5, h6');
    const title = heading ? heading.textContent.replace(/\s+/g, ' ').trim() : '';
    if (heading) heading.remove();
    const description = content.textContent.replace(/\s+/g, ' ').trim();

    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));
    const h2 = document.createElement('h2');
    const a = document.createElement('a');
    a.href = item.getAttribute('href') || '';
    a.textContent = title;
    h2.append(a);
    textCell.appendChild(h2);
    if (description) {
      const p = document.createElement('p');
      p.textContent = description;
      textCell.appendChild(p);
    }
    return [imageCell, textCell];
  });
  element.replaceWith(WebImporter.Blocks.createBlock(document, { name: 'cards-category', cells }));
}
