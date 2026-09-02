import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Decorates the hero-split block.
 * Authored as a simple block with two rows:
 *   row 0: side image (renders on the right at desktop)
 *   row 1: text panel (heading, subtext, CTA buttons)
 * @param {Element} block
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    const cell = row.firstElementChild;
    if (!cell) return;
    if (cell.querySelector('picture')) {
      cell.classList.add('hero-split-image');
      const img = cell.querySelector('img');
      if (img) {
        const optimized = createOptimizedPicture(img.src, img.alt, true, [{ width: '1000' }]);
        moveInstrumentation(img, optimized.querySelector('img'));
        img.closest('picture').replaceWith(optimized);
      }
    } else {
      cell.classList.add('hero-split-text');
    }
  });
}
