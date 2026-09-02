import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Decorates the hero-home block.
 * Expected authored structure (one row, one or two cells):
 *   [ picture ][ heading + subtext + CTA buttons ]
 * The picture becomes the full-bleed background; text is centered on top and the
 * ::after overlay (see CSS) provides the blue tint.
 * @param {Element} block
 */
export default function decorate(block) {
  // Promote the background picture to a direct child of the block.
  const img = block.querySelector('picture > img');
  if (img) {
    const optimized = createOptimizedPicture(img.src, img.alt, true, [{ width: '1600' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    const originalPicture = img.closest('picture');
    // Remove the (now empty) image cell so it doesn't render as a text row.
    const imageCell = originalPicture.closest('div');
    originalPicture.remove();
    if (imageCell && imageCell.textContent.trim() === '' && !imageCell.querySelector('picture, img')) {
      imageCell.remove();
    }
    block.prepend(optimized);
  }
}
