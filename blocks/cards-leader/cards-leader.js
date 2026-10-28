import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((cell) => {
      if (cell.querySelector('picture')) cell.className = 'cards-leader-card-image';
      else if (cell.textContent.trim()) cell.className = 'cards-leader-card-body';
      else cell.className = 'cards-leader-card-empty';
    });
    const body = li.querySelector('.cards-leader-card-body');
    const link = body && [...body.querySelectorAll('a[href]')].pop();
    if (link) link.closest('p')?.classList.add('cards-leader-link');
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    const picture = createOptimizedPicture(img.src, img.alt, false, [{ width: '600' }]);
    moveInstrumentation(img, picture.querySelector('img'));
    img.closest('picture').replaceWith(picture);
  });
  block.replaceChildren(ul);
}
