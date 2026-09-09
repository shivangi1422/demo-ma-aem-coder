/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-blog. Base block: hero.
 * Source: https://www.beckmancoulter.com/en/blog/diagnostics/the-value-of-mpv-in-hematology
 * Library convention: 1 column x 3 rows (row1 = block name, row2 = background image, row3 = text/richtext).
 * Model (blocks/hero-blog/_hero-blog.json): image [reference], imageAlt [collapsed -> img alt], text [richtext]
 */
export default function parse(element, { document }) {
  // --- Image (header image, not the decorative .card-bg background) ---
  const image = element.querySelector('.card-image > img, .card-image img[alt]:not([alt=""]), .card-image img');

  // --- Text content ---
  const title = element.querySelector('h1.card-title, .card-title, h1');
  const readtime = element.querySelector('.card-readtime');
  // Two .card-byline exist; select the one carrying the author.
  const author = element.querySelector('.card-byline .card-author, .card-author');
  const date = element.querySelector('.card-byline .card-date, .card-date');
  const summary = element.querySelector('.card-summary');

  // Empty-block guard
  if (!title && !summary && !image) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row 2 (of block): background/header image. imageAlt collapses into <img alt>.
  if (image) {
    cells.push([[document.createComment(' field:image '), image]]);
  }

  // Row 3 (of block): text richtext (field:text)
  const textCell = [document.createComment(' field:text ')];

  if (readtime && readtime.textContent.trim()) {
    const p = document.createElement('p');
    p.textContent = readtime.textContent.trim();
    textCell.push(p);
  }

  if (title) textCell.push(title);

  if (author || date) {
    const parts = [];
    if (author) parts.push(author.textContent.trim());
    if (date) parts.push(date.textContent.trim());
    const joined = parts.filter(Boolean).join(' | ');
    if (joined) {
      const p = document.createElement('p');
      p.textContent = joined;
      textCell.push(p);
    }
  }

  if (summary && summary.textContent.trim()) {
    const p = document.createElement('p');
    p.textContent = summary.textContent.trim();
    textCell.push(p);
  }

  cells.push([textCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-blog', cells });
  element.replaceWith(block);
}
