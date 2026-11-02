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
 * Authored structure: row 1 = image (optional), row 2 = text (heading, optional
 * subheading or paragraph, one or more links; bold link = solid primary button,
 * italic or plain link = outlined button), row 3 = optional mobile image
 * (picture only, replaces the background below 768px).
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];

  const background = document.createElement('div');
  background.className = 'hero-centered-background';
  const content = document.createElement('div');
  content.className = 'hero-centered-content';

  // optional mobile image: a picture-only row after the text row (last in the model)
  const mobileRow = rows.length > 2
    ? rows.slice(2).find((row) => row.querySelector('picture > img') && !row.textContent.trim())
    : null;
  const mobileImg = mobileRow && mobileRow.querySelector('picture > img');
  if (mobileRow) {
    mobileRow.remove();
    rows.splice(rows.indexOf(mobileRow), 1);
  }

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

  // A lone link in its own paragraph is the call-to-action button
  // (also covers in-page anchors the global button decoration skips).
  content.querySelectorAll(':scope > p').forEach((p) => {
    const a = p.querySelector(':scope > a');
    if (a && p.children.length === 1 && p.textContent.trim() === a.textContent.trim()) {
      a.classList.add('button');
      p.classList.add('button-wrapper');
    }
  });

  // Consecutive buttons (e.g. "Choose a Plan" + "Contact Support") sit side by side.
  content.querySelectorAll(':scope > .button-wrapper').forEach((p) => {
    if (p.previousElementSibling?.classList.contains('hero-centered-actions')) {
      p.previousElementSibling.append(p);
    } else if (p.nextElementSibling?.classList.contains('button-wrapper')) {
      const actions = document.createElement('div');
      actions.className = 'hero-centered-actions';
      p.replaceWith(actions);
      actions.append(p);
    }
  });

  // the mobile image replaces the background below 768px (one download per viewport)
  const backgroundPicture = background.querySelector('picture');
  if (mobileImg && backgroundPicture) {
    const source = document.createElement('source');
    source.media = '(width < 768px)';
    source.srcset = mobileImg.src;
    backgroundPicture.prepend(source);
    block.classList.add('hero-centered-has-mobile-image');
  }

  const children = [];
  if (background.firstElementChild) {
    block.classList.add('hero-centered-has-image');
    children.push(background);
  }
  children.push(content);
  block.replaceChildren(...children);
}
