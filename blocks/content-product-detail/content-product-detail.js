import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Decorates the content-product-detail block.
 * Authored as a simple block with two rows:
 *   row 0: text/spec column (eyebrow, title, descriptions, spec list, CTA)
 *   row 1: images cell — first picture is the main image, the rest are thumbnails
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

  const textRow = rows.find((r) => !r.querySelector('picture'));
  const imageRow = rows.find((r) => r.querySelector('picture'));

  if (textRow) textRow.firstElementChild?.classList.add('content-product-detail-text');

  const gallery = document.createElement('div');
  gallery.className = 'content-product-detail-gallery';

  if (imageRow) {
    const pics = [...imageRow.querySelectorAll('picture')];
    const thumbs = document.createElement('div');
    thumbs.className = 'content-product-detail-thumbs';

    pics.forEach((pic, i) => {
      const opt = optimize(pic);
      if (i === 0) {
        opt.classList.add('content-product-detail-main');
        gallery.append(opt);
      } else {
        opt.classList.add('content-product-detail-thumb');
        thumbs.append(opt);
      }
    });

    if (thumbs.children.length) gallery.append(thumbs);
  }

  // Reassemble: a single row with the text column and the gallery column.
  const layout = document.createElement('div');
  if (textRow) layout.append(textRow.firstElementChild);
  layout.append(gallery);
  block.replaceChildren(layout);
}
