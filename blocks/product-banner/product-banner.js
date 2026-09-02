import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Decorates the product-banner block.
 * Authored as a simple block with two rows:
 *   row 0: full-width banner image
 *   row 1: content (eyebrow, title, description, 2x2 feature grid, CTA)
 * @param {Element} block
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    const cell = row.firstElementChild;
    if (!cell) return;
    if (cell.querySelector('picture')) {
      cell.classList.add('product-banner-image');
      const img = cell.querySelector('img');
      if (img) {
        const optimized = createOptimizedPicture(img.src, img.alt, true, [{ width: '1600' }]);
        moveInstrumentation(img, optimized.querySelector('img'));
        img.closest('picture').replaceWith(optimized);
      }
    } else {
      cell.classList.add('product-banner-content');
    }
  });
}
