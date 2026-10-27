import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Replaces an <a> with a <span> holding the same content, so the card can be
 * wrapped in a single outer link (nested links are invalid HTML).
 * @param {HTMLAnchorElement} a
 */
function unwrapLink(a) {
  const span = document.createElement('span');
  span.className = 'cards-promo-title-text';
  moveInstrumentation(a, span);
  span.append(...a.childNodes);
  a.replaceWith(span);
  return span;
}

/**
 * Cards (promo): greyscale 3:2 image that colours and zooms on hover, red
 * eyebrow, title with an animated underline; the whole card is the link.
 *
 * Authored structure: one row per card, 2 cells:
 *   cell 1: image (+ alt)
 *   cell 2: rich text — eyebrow paragraph, title paragraph containing the link
 * @param {Element} block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-promo-item';
    moveInstrumentation(row, li);

    const cells = [...row.children];
    let imageCell;
    let bodyCell;
    cells.forEach((cell) => {
      if (!imageCell && cell.querySelector('picture, img')) imageCell = cell;
      else if (cell.textContent.trim() !== '') bodyCell = bodyCell || cell;
    });

    const link = bodyCell?.querySelector('a[href]');
    const card = document.createElement(link ? 'a' : 'div');
    card.className = 'cards-promo-card';
    if (link) {
      card.href = link.getAttribute('href');
      if (link.target) card.target = link.target;
      if (link.target === '_blank') card.rel = 'noopener';
    }

    if (imageCell) {
      imageCell.className = 'cards-promo-image';
      const img = imageCell.querySelector('img');
      if (img) {
        const pic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
        const newImg = pic.querySelector('img');
        moveInstrumentation(img, newImg);
        (img.closest('picture') || img).replaceWith(pic);
        // grey pulse skeleton until the image has loaded
        const loaded = () => imageCell.classList.add('is-loaded');
        if (newImg.complete && newImg.naturalWidth) loaded();
        else {
          newImg.addEventListener('load', loaded, { once: true });
          newImg.addEventListener('error', loaded, { once: true });
        }
      }
      card.append(imageCell);
    }

    if (bodyCell) {
      bodyCell.className = 'cards-promo-body';
      const paragraphs = [...bodyCell.querySelectorAll(':scope > p, :scope > h2, :scope > h3, :scope > h4')];
      const titleEl = link ? link.closest('p, h2, h3, h4') : paragraphs[paragraphs.length - 1];
      paragraphs.forEach((p) => {
        p.classList.remove('button-wrapper');
        if (p === titleEl) p.classList.add('cards-promo-title');
        else if (!titleEl || paragraphs.indexOf(p) < paragraphs.indexOf(titleEl)) p.classList.add('cards-promo-eyebrow');
      });
      bodyCell.querySelectorAll('a[href]').forEach((a) => {
        const span = unwrapLink(a);
        if (titleEl && !titleEl.contains(span)) span.className = '';
      });
      if (titleEl && !titleEl.querySelector('.cards-promo-title-text')) {
        const span = document.createElement('span');
        span.className = 'cards-promo-title-text';
        span.append(...titleEl.childNodes);
        titleEl.append(span);
      }
      card.append(bodyCell);
    }

    li.append(card);
    ul.append(li);
  });

  block.replaceChildren(ul);
}
