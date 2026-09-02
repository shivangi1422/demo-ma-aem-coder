import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Decorates the carousel-split block.
 * Authored as a simple block with two rows:
 *   row 0: feature image (renders on the left at desktop)
 *   row 1: text panel (eyebrow, title, description, specs list, View Details link)
 * @param {Element} block
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    const cell = row.firstElementChild;
    if (!cell) return;
    if (cell.querySelector('picture')) {
      cell.classList.add('carousel-split-image');
      const img = cell.querySelector('img');
      if (img) {
        const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '1200' }]);
        moveInstrumentation(img, optimized.querySelector('img'));
        img.closest('picture').replaceWith(optimized);
      }
    } else {
      cell.classList.add('carousel-split-text');
    }
  });
}
