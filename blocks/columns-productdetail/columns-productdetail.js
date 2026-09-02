import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Decorates the columns-productdetail block.
 * Authored structure: a single row with two cells —
 *   cell 0: text/spec column (eyebrow, title, descriptions, spec list, CTA)
 *   cell 1: image gallery (first image = main, remaining = thumbnails)
 * @param {Element} block
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const imageCell = cells.find((c) => c.querySelector('picture'));
    const textCell = cells.find((c) => c !== imageCell) || cells[0];

    if (textCell) textCell.classList.add('columns-productdetail-text');

    if (imageCell) {
      imageCell.classList.add('columns-productdetail-gallery');
      const pictures = [...imageCell.querySelectorAll('picture')];
      const thumbRow = document.createElement('div');
      thumbRow.className = 'columns-productdetail-thumbs';

      pictures.forEach((pic, i) => {
        const img = pic.querySelector('img');
        let current = pic;
        if (img) {
          const optimized = createOptimizedPicture(img.src, img.alt, i === 0, [{ width: '1000' }]);
          moveInstrumentation(img, optimized.querySelector('img'));
          pic.replaceWith(optimized);
          current = optimized;
        }
        if (i === 0) {
          current.classList.add('columns-productdetail-main');
        } else {
          current.classList.add('columns-productdetail-thumb');
          thumbRow.append(current);
        }
      });

      if (thumbRow.children.length) imageCell.append(thumbRow);
    }
  });
}
