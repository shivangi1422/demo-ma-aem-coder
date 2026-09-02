import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Decorates the cards-solutions block.
 * Authored structure: an optional first row holding the section heading, then one
 * row per card. Each card row has an image cell and a body cell (category, title,
 * description, "Learn More" link).
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];

  // First row with no picture is treated as the section heading.
  let headingRow = null;
  if (rows.length && !rows[0].querySelector('picture')) {
    [headingRow] = rows;
  }

  const ul = document.createElement('ul');
  rows.forEach((row) => {
    if (row === headingRow) return;
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'cards-solutions-image';
      } else {
        div.className = 'cards-solutions-body';
      }
    });
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    img.closest('picture').replaceWith(optimized);
  });

  if (headingRow) {
    const heading = document.createElement('div');
    heading.className = 'cards-solutions-heading';
    while (headingRow.firstElementChild) heading.append(headingRow.firstElementChild);
    headingRow.remove();
    block.append(heading);
  }
  block.append(ul);
}
