import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Optimizes a same-origin, non-SVG picture; external (migrated) images keep
 * their authored <picture>.
 * @param {HTMLImageElement} img
 * @param {boolean} eager
 */
function optimize(img, eager) {
  const url = new URL(img.src, window.location.href);
  if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) {
    if (eager) img.loading = 'eager';
    return;
  }
  const picture = createOptimizedPicture(img.src, img.alt, eager, [
    { media: '(min-width: 900px)', width: '2000' },
    { width: '900' },
  ]);
  moveInstrumentation(img, picture.querySelector('img'));
  img.closest('picture').replaceWith(picture);
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const mediaRow = rows.find((row) => row.querySelector('picture'));
  const textRow = rows.find((row) => row !== mediaRow && row.textContent.trim());

  rows.forEach((row) => {
    if (row !== mediaRow && row !== textRow && !row.textContent.trim()) row.remove();
  });

  if (mediaRow) {
    mediaRow.classList.add('hero-overlay-left-media');
    const img = mediaRow.querySelector('picture > img');
    if (img) {
      img.setAttribute('fetchpriority', 'high');
      optimize(img, true);
    }
  } else {
    block.classList.add('no-image');
  }

  if (textRow) {
    textRow.classList.add('hero-overlay-left-content');
    // the last paragraph that holds only a link is the call to action
    textRow.querySelectorAll('p').forEach((p) => {
      const a = p.querySelector('a[href]');
      if (a && p.textContent.trim() === a.textContent.trim() && p.children.length === 1) {
        p.classList.add('hero-overlay-left-cta');
        a.classList.add('hero-overlay-left-button');
      }
    });
  }
}
