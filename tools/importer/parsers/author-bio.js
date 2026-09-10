/* eslint-disable */
/* global WebImporter */
/**
 * Parser for author-bio. Base block: author-bio (named block/v1/block).
 * Source: https://www.beckmancoulter.com/en/blog/diagnostics/the-value-of-mpv-in-hematology
 * Model (blocks/author-bio/_author-bio.json): image [reference], imageAlt [collapsed -> img alt], text [richtext]
 * Named-block structure (like hero-blog): row1 = image (field:image),
 *   row2 = richtext (field:text) with name (heading) + bio + CTA link.
 */
export default function parse(element, { document }) {
  // Headshot image.
  const image = element.querySelector('.headshot img, .column-left img, img');

  // Name, bio, CTA.
  const name = element.querySelector('.contributor-name');
  const bio = element.querySelector('.contributor-bio');
  const cta = element.querySelector('.contributor-link a, a.btn-cta, a.button');

  if (!image && !name && !bio) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row: image (field:image). imageAlt collapses into the <img alt>.
  if (image) {
    cells.push([[document.createComment(' field:image '), image]]);
  }

  // Row: text (field:text) -> name heading + bio + CTA.
  const textCell = [document.createComment(' field:text ')];
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
  cells.push([textCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'author-bio', cells });
  element.replaceWith(block);
}
