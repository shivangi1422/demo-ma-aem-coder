import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Hero (curved panel): photo on the left, red gradient panel with a curved
 * left edge on the right. The h1 slides up out of a translucent red band and
 * the intro paragraph fades in after it (CSS-only load animations).
 *
 * Authored structure (2 rows x 1 cell):
 *   row 1: image (+ alt)
 *   row 2: rich text — h1, intro paragraph(s)
 * Either row may be missing; empty rows are dropped.
 * @param {Element} block
 */
export default function decorate(block) {
  let hasImage = false;

  [...block.children].forEach((row) => {
    const img = row.querySelector('picture > img, img');
    if (img && !hasImage) {
      hasImage = true;
      row.className = 'hero-curved-panel-media';
      // LCP image: eager, high priority.
      const optimized = createOptimizedPicture(img.src, img.alt, true, [
        { media: '(min-width: 1024px)', width: '2000' },
        { media: '(min-width: 600px)', width: '1200' },
        { width: '750' },
      ]);
      const newImg = optimized.querySelector('img');
      newImg.setAttribute('fetchpriority', 'high');
      moveInstrumentation(img, newImg);
      (img.closest('picture') || img).replaceWith(optimized);
      return;
    }

    if (row.textContent.trim() === '') {
      row.remove();
      return;
    }

    row.className = 'hero-curved-panel-body';
    const content = row.firstElementChild || row;
    content.classList.add('hero-curved-panel-content');

    // h1 text sits in an overflow-hidden band so it can slide up into view.
    const heading = content.querySelector('h1, h2');
    if (heading && !heading.querySelector('.hero-curved-panel-heading-band')) {
      const band = document.createElement('span');
      band.className = 'hero-curved-panel-heading-band';
      const text = document.createElement('span');
      text.className = 'hero-curved-panel-heading-text';
      text.append(...heading.childNodes);
      band.append(text);
      heading.append(band);
      heading.classList.add('hero-curved-panel-heading');
    }

    content.querySelectorAll(':scope > p').forEach((p) => p.classList.add('hero-curved-panel-intro'));
  });

  if (!hasImage) block.classList.add('no-image');
}
