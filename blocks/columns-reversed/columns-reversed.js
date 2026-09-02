import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Decorates the columns-reversed block.
 * Authored structure: a single row with an image cell and a text cell
 * (eyebrow, title, description, bullet list, CTA). Image renders on the left,
 * text on the right at desktop widths.
 * @param {Element} block
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      if (cell.querySelector('picture')) {
        cell.classList.add('columns-reversed-image');
        const img = cell.querySelector('img');
        if (img) {
          const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '1000' }]);
          moveInstrumentation(img, optimized.querySelector('img'));
          img.closest('picture').replaceWith(optimized);
        }
      } else {
        cell.classList.add('columns-reversed-text');
      }
    });
  });
}
