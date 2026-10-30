import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Optimizes a same-origin, non-SVG image; keeps the authored picture otherwise
 * (migrated images still point at the source site until they are uploaded).
 * @param {HTMLImageElement} img
 * @returns {Element} the picture to use
 */
function optimizedPicture(img) {
  const picture = img.closest('picture');
  const url = new URL(img.src, window.location.href);
  if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return picture;
  const optimized = createOptimizedPicture(img.src, img.alt, true, [{ width: '2000' }]);
  moveInstrumentation(img, optimized.querySelector('img'));
  return optimized;
}

/**
 * Decorates the hero-centered block: a full-bleed background photo behind a
 * centered heading, intro text and CTA.
 * Authored structure: row 1 = image (optional), row 2 = text (heading, paragraph, link).
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];

  const background = document.createElement('div');
  background.className = 'hero-centered-background';
  const content = document.createElement('div');
  content.className = 'hero-centered-content';

  rows.forEach((row) => {
    const img = row.querySelector('picture > img');
    if (img && !background.firstElementChild) {
      const picture = optimizedPicture(img);
      img.closest('picture')?.remove();
      background.append(picture);
    }
    // Everything else (text cell, plus any text left in the image row) is content.
    [...row.children].forEach((cell) => {
      if (cell.textContent.trim() === '' && !cell.querySelector('picture, img')) return;
      moveInstrumentation(cell, content);
      while (cell.firstChild) content.append(cell.firstChild);
    });
  });

  const children = [];
  if (background.firstElementChild) {
    block.classList.add('hero-centered-has-image');
    children.push(background);
  }
  children.push(content);
  block.replaceChildren(...children);
}
