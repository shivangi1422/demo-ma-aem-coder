import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Hero banner: photo with heading, text and buttons on top.
 * Rows: image, optional mobile image, text. Options: left-aligned.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const isPictureOnly = (row) => row.querySelector('picture') && !row.textContent.trim();
  const textRow = [...rows].reverse().find((row) => !isPictureOnly(row) && row.textContent.trim())
    || rows[rows.length - 1];

  const media = document.createElement('div');
  media.className = 'hero-banner-media';
  let mediaCount = 0;
  rows.filter((row) => row !== textRow).forEach((row) => {
    const pic = row.querySelector('picture');
    if (!pic) {
      row.remove();
      return;
    }
    const img = pic.querySelector('img');
    const optimized = createOptimizedPicture(img.src, img.alt, true, [{ media: '(min-width: 600px)', width: '2000' }, { width: '750' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    optimized.querySelector('img').setAttribute('fetchpriority', 'high');
    optimized.classList.add(mediaCount === 0 ? 'hero-banner-image' : 'hero-banner-image-mobile');
    media.append(optimized);
    mediaCount += 1;
    row.remove();
  });
  if (mediaCount > 1) block.classList.add('has-mobile-image');

  const content = textRow.querySelector(':scope > div') || textRow;
  content.className = 'hero-banner-content';
  moveInstrumentation(textRow, content);
  block.replaceChildren(media, content);
}
