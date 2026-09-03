import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Decorates the hero block. One block, three styles selected via the "Style"
 * dropdown (which adds a variant class):
 *   - .hero.home   background image behind centered text (default)
 *   - .hero.banner solid colour, text only, no image
 *   - .hero.split  image beside a text panel
 * Authored structure: an optional image row and a text row.
 * @param {Element} block
 */
export default function decorate(block) {
  const isSplit = block.classList.contains('split');

  if (isSplit) {
    // Two side-by-side cells: image column + text column.
    [...block.children].forEach((row) => {
      const cell = row.firstElementChild;
      if (!cell) return;
      if (cell.querySelector('picture')) {
        cell.classList.add('hero-image');
        const img = cell.querySelector('img');
        if (img) {
          const optimized = createOptimizedPicture(img.src, img.alt, true, [{ width: '1000' }]);
          moveInstrumentation(img, optimized.querySelector('img'));
          img.closest('picture').replaceWith(optimized);
        }
      } else {
        cell.classList.add('hero-text');
      }
    });
    return;
  }

  // Home (and any image-bearing variant): promote the picture to a full-bleed
  // background and drop its now-empty row. Banner has no image, so this no-ops.
  const img = block.querySelector('picture > img');
  if (img) {
    const optimized = createOptimizedPicture(img.src, img.alt, true, [{ width: '1600' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    const imageRow = [...block.children].find((row) => row.contains(img));
    img.closest('picture').remove();
    if (imageRow && !imageRow.querySelector('picture, img') && imageRow.textContent.trim() === '') {
      imageRow.remove();
    }
    block.prepend(optimized);
  }
}
