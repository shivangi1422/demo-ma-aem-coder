import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Decorates the hero-home block.
 * Authored as a simple block with two rows:
 *   row 0: background image
 *   row 1: text content (heading, subtext, CTA buttons)
 * The image becomes the full-bleed background; the text stack is centered on top
 * and the ::after overlay (see CSS) provides the blue tint.
 * @param {Element} block
 */
export default function decorate(block) {
  // Promote the background picture to a direct child of the block, then remove
  // its now-empty row so only the text content remains in flow.
  const img = block.querySelector('picture > img');
  if (img) {
    const optimized = createOptimizedPicture(img.src, img.alt, true, [{ width: '1600' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    // The image's row is the direct child of the block that contains it.
    const imageRow = [...block.children].find((row) => row.contains(img));
    img.closest('picture').remove();
    if (imageRow && !imageRow.querySelector('picture, img') && imageRow.textContent.trim() === '') {
      imageRow.remove();
    }
    block.prepend(optimized);
  }
}
