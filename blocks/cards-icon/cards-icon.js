import { createOptimizedPicture, decorateIcons } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Icon cards: icon, title and short text, side by side (source .ListingCard).
 * Items: image, text (heading + description). A text paragraph holding only an icon token
 * (:name:, icons/<name>.svg) becomes that icon (bordered cards).
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      // a card without an image (e.g. bordered cards: icon in the text)
      if (!div.children.length && !div.textContent.trim()) div.remove();
      else if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-icon-image';
      else div.className = 'cards-icon-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('.cards-icon-body > p').forEach((p) => {
    const token = p.textContent.trim().match(/^:([a-z0-9-]+):$/);
    if (!token || p.children.length) return;
    const span = document.createElement('span');
    span.className = `icon icon-${token[1]}`;
    p.replaceChildren(span);
  });
  decorateIcons(ul);
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '300' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.replaceChildren(ul);
}
