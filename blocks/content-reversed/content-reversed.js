import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Decorates the content-reversed block.
 * Authored as a simple block with two rows: an image row and a text row
 * (eyebrow, title, description, bullet list, CTA). Rendered as image-left /
 * text-right at desktop widths.
 * @param {Element} block
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    const cell = row.firstElementChild;
    if (!cell) return;
    if (cell.querySelector('picture')) {
      cell.classList.add('content-reversed-image');
      const img = cell.querySelector('img');
      if (img) {
        const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '1000' }]);
        moveInstrumentation(img, optimized.querySelector('img'));
        img.closest('picture').replaceWith(optimized);
      }
    } else {
      cell.classList.add('content-reversed-text');
    }
  });
}
