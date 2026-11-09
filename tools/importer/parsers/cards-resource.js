/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-resource (xwalk items: cards-resource-item: image (reference), text (richtext)).
 * Source (www.beckman.com product page, Content and Resources):
 *   .content-resource-list-wrapper > .content-resource-list-child >
 *     .content-resource-list-icon (Font Awesome glyph, or a thumbnail img) +
 *     .content-resource-list-right-content (a.content-resource-list-heading, optional description)
 * Output: one row per resource:
 *   [<!-- field:image --><img>] (empty cell when there is no thumbnail; the block shows a file icon)
 *   [<!-- field:text --><p><a href>Title</a></p><p>description</p>]
 */
const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

export default function parse(element, { document }) {
  const cells = [];
  element.querySelectorAll(':scope > .content-resource-list-child').forEach((item) => {
    const imageCell = document.createDocumentFragment();
    const srcImg = item.querySelector('.content-resource-list-icon img[src]');
    if (srcImg) {
      const img = document.createElement('img');
      img.src = srcImg.getAttribute('src');
      img.alt = srcImg.getAttribute('alt') || '';
      imageCell.appendChild(document.createComment(' field:image '));
      imageCell.appendChild(img);
    }

    const body = item.querySelector('.content-resource-list-right-content') || item;
    const title = body.querySelector('a.content-resource-list-heading[href]') || body.querySelector('a[href]');
    const parts = [];
    if (title && clean(title.textContent)) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = title.getAttribute('href');
      a.textContent = clean(title.textContent);
      p.append(a);
      parts.push(p);
    }
    // optional description: any other text in the right-hand column
    [...body.children].filter((el) => el !== title && !el.contains(title) && clean(el.textContent))
      .forEach((el) => {
        if (/^(P|UL|OL)$/.test(el.tagName)) { parts.push(el); return; }
        const p = document.createElement('p');
        p.textContent = clean(el.textContent);
        parts.push(p);
      });
    if (!parts.length && !srcImg) return;

    const textCell = document.createDocumentFragment();
    if (parts.length) {
      textCell.appendChild(document.createComment(' field:text '));
      parts.forEach((n) => textCell.appendChild(n));
    }
    cells.push([imageCell, textCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-resource', cells });
  element.replaceWith(block);
}
