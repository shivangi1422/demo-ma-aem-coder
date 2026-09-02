import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Decorates the cards-productlines block.
 * Authored structure: optional first row = section heading, then one row per
 * product card (image cell + body cell with title and description).
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];

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
        div.className = 'cards-productlines-image';
      } else {
        div.className = 'cards-productlines-body';
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
    heading.className = 'cards-productlines-heading';
    while (headingRow.firstElementChild) heading.append(headingRow.firstElementChild);
    headingRow.remove();
    block.append(heading);
  }
  block.append(ul);
}
