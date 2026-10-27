import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Hero (photo card): full-bleed greyscale background photo with a centred,
 * translucent white card (red left border) holding eyebrow, heading, text and
 * a primary button.
 *
 * Authored structure (2 rows x 1 cell):
 *   row 1: image (+ alt) — background photo
 *   row 2: rich text — eyebrow paragraph, h2, paragraph, **bold link** (button)
 * @param {Element} block
 */
export default function decorate(block) {
  let picture;

  [...block.children].forEach((row) => {
    const img = row.querySelector('img');
    if (img && !picture) {
      // Decorative-but-described background photo: lazy (below the fold).
      picture = createOptimizedPicture(img.src, img.alt, false, [
        { media: '(min-width: 1024px)', width: '2000' },
        { width: '900' },
      ]);
      moveInstrumentation(img, picture.querySelector('img'));
      picture.classList.add('hero-photo-card-image');
      (img.closest('picture') || img).remove();
      if (row.textContent.trim() === '') row.remove();
      return;
    }

    if (row.textContent.trim() === '') {
      row.remove();
      return;
    }

    row.className = 'hero-photo-card-inner';
    const card = row.firstElementChild || row;
    card.classList.add('hero-photo-card-card');

    // Eyebrow: a paragraph that comes before the heading.
    const heading = card.querySelector('h1, h2, h3, h4, h5, h6');
    const first = card.firstElementChild;
    if (heading && first && first.tagName === 'P' && first !== heading) {
      first.classList.add('hero-photo-card-eyebrow');
    }

    // Decorative arrow after each button label (moves on hover). Buttons are
    // decorated by scripts.js (decorateButtons) and styled by the theme.
    card.querySelectorAll('a.button').forEach((a) => {
      if (a.querySelector('.hero-photo-card-arrow')) return;
      const arrow = document.createElement('span');
      arrow.className = 'hero-photo-card-arrow';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '->';
      a.append(' ', arrow);
    });
  });

  if (picture) block.prepend(picture);
}
