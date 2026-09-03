import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Decorates the hero block. One block, three styles selected via the "Style"
 * dropdown (which adds a variant class):
 *   - .hero.home       background image behind centered text (default)
 *   - .hero.banner     solid colour, text only, no image
 *   - .hero.split      text left, image right
 *   - .hero.split-left image left, text right
 * Authored structure: an optional image row and a text row.
 * @param {Element} block
 */
export default function decorate(block) {
  const isSplit = block.classList.contains('split') || block.classList.contains('split-left')
    || block.classList.contains('gradient');

  if (isSplit) {
    // Two side-by-side columns (split) or a gradient banner with the image
    // bleeding off the right (gradient). The flex children are the row wrappers
    // (direct children of the block), so tag those — the CSS keys off them.
    [...block.children].forEach((row) => {
      if (row.querySelector('picture')) {
        row.classList.add('hero-image');
        const img = row.querySelector('img');
        if (img) {
          const optimized = createOptimizedPicture(img.src, img.alt, true, [{ width: '1000' }]);
          moveInstrumentation(img, optimized.querySelector('img'));
          img.closest('picture').replaceWith(optimized);
        }
      } else if (row.textContent.trim() === '') {
        // Empty image column (the model always supplies one) — drop it so it
        // doesn't get styled as a second text panel.
        row.remove();
      } else {
        row.classList.add('hero-text');
      }
    });
    return;
  }

  // Home (and any image-bearing variant): promote the picture to a full-bleed
  // background and drop its now-empty row.
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

  // Banner (no image): the model still supplies an empty image column, so drop
  // any empty leading row to avoid an unwanted gap.
  [...block.children].forEach((row) => {
    if (!row.querySelector('picture, img') && row.textContent.trim() === '') {
      row.remove();
    }
  });
}
