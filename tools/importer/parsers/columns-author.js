/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-author. Base block: columns.
 * Source: https://www.beckmancoulter.com/en/blog/diagnostics/the-value-of-mpv-in-hematology
 * Columns block: row2 = one cell per column of free (default) content. NO field:* hints for columns blocks.
 * Structure: 1 row x 2 cells -> cell1 = headshot image, cell2 = name (heading) + bio + CTA link.
 */
export default function parse(element, { document }) {
  // Cell 1: headshot image
  const image = element.querySelector('.headshot img, .column-left img, img');

  // Cell 2: name, bio, CTA
  const name = element.querySelector('.contributor-name');
  const bio = element.querySelector('.contributor-bio');
  const cta = element.querySelector('.contributor-link a, a.btn-cta, a.button');

  if (!image && !name && !bio) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const imageCell = [];
  if (image) imageCell.push(image);

  const textCell = [];
  if (name && name.textContent.trim()) {
    const h = document.createElement('h3');
    h.textContent = name.textContent.trim();
    textCell.push(h);
  }
  if (bio && bio.textContent.trim()) {
    const p = document.createElement('p');
    p.textContent = bio.textContent.trim();
    textCell.push(p);
  }
  if (cta) {
    const p = document.createElement('p');
    p.appendChild(cta);
    textCell.push(p);
  }

  // Single row, two columns (image | text).
  const cells = [[imageCell, textCell]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-author', cells });
  element.replaceWith(block);
}
