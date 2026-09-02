import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Decorates the content-product-detail block.
 * Authored as a simple block with three rows:
 *   row 0: text/spec column (eyebrow, title, descriptions, spec list, CTA)
 *   row 1: main product image
 *   row 2: thumbnail gallery (multiple images)
 * Renders as a two-column layout: text left, image gallery (main + thumbs) right.
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];

  const optimize = (pic) => {
    const img = pic.querySelector('img');
    if (!img) return pic;
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '1000' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    pic.replaceWith(optimized);
    return optimized;
  };

  // Identify rows by content.
  const textRow = rows.find((r) => !r.querySelector('picture'));
  const imageRows = rows.filter((r) => r.querySelector('picture'));

  if (textRow) textRow.firstElementChild?.classList.add('content-product-detail-text');

  // Build the gallery column from the image rows: first single image = main,
  // a row with multiple images = thumbnails.
  const gallery = document.createElement('div');
  gallery.className = 'content-product-detail-gallery';

  imageRows.forEach((row) => {
    const cell = row.firstElementChild;
    const pics = [...cell.querySelectorAll('picture')];
    if (pics.length === 1) {
      const opt = optimize(pics[0]);
      opt.classList.add('content-product-detail-main');
      gallery.append(opt);
    } else if (pics.length > 1) {
      const thumbs = document.createElement('div');
      thumbs.className = 'content-product-detail-thumbs';
      pics.forEach((p) => {
        const opt = optimize(p);
        opt.classList.add('content-product-detail-thumb');
        thumbs.append(opt);
      });
      gallery.append(thumbs);
    }
  });

  // Reassemble: a single row with the text column and the gallery column.
  const layout = document.createElement('div');
  if (textRow) layout.append(textRow.firstElementChild);
  layout.append(gallery);
  block.replaceChildren(layout);
}
