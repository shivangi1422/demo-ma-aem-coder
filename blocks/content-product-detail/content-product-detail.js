import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Decorates the content-product-detail block.
 * Authored as a container block:
 *   row 0: text/spec column (eyebrow, title, descriptions, spec list, CTA)
 *   row 1..N: one image each — first image is the main image, the rest thumbnails
 * Renders as a two-column layout: text left, image gallery (main + thumbs) right.
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];

  const textRow = rows.find((r) => !r.querySelector('picture'));
  const imageRows = rows.filter((r) => r.querySelector('picture'));

  if (textRow) textRow.firstElementChild?.classList.add('content-product-detail-text');

  const gallery = document.createElement('div');
  gallery.className = 'content-product-detail-gallery';
  const thumbs = document.createElement('div');
  thumbs.className = 'content-product-detail-thumbs';

  imageRows.forEach((row, i) => {
    const img = row.querySelector('img');
    if (!img) return;
    const optimized = createOptimizedPicture(img.src, img.alt, i === 0, [{ width: '1000' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    if (i === 0) {
      optimized.classList.add('content-product-detail-main');
      gallery.append(optimized);
    } else {
      optimized.classList.add('content-product-detail-thumb');
      thumbs.append(optimized);
    }
  });

  if (thumbs.children.length) gallery.append(thumbs);

  const layout = document.createElement('div');
  if (textRow) layout.append(textRow.firstElementChild);
  layout.append(gallery);
  block.replaceChildren(layout);
}
