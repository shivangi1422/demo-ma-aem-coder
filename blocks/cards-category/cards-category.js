import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Category cards: square image beside a title and short text, two columns
 * (source /support/faq .faq-item). The whole card links to the title link.
 * Items: image, text (heading with link + description).
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-category-image';
      else div.className = 'cards-category-body';
    });
    const link = li.querySelector('.cards-category-body a[href]');
    if (link) {
      const card = document.createElement('a');
      card.href = link.href;
      card.className = 'cards-category-link';
      link.replaceWith(...link.childNodes);
      card.append(...li.childNodes);
      li.append(card);
    }
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '180' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  // two columns filled column by column (source: left list, right list)
  ul.style.setProperty('--cards-category-rows', Math.ceil(ul.children.length / 2));
  block.replaceChildren(ul);
}
