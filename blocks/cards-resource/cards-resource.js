import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation, unwrapRichtext } from '../../scripts/scripts.js';

const PDF = /(\.pdf($|[?#]))|\/gated-media\b/i;

/**
 * Optimizes a same-origin, non-SVG thumbnail; other images keep the authored picture.
 * @param {HTMLImageElement} img authored image
 * @returns {Element} the picture to show
 */
function thumbnail(img) {
  const authored = img.closest('picture') || img;
  const url = new URL(img.src, window.location.href);
  if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return authored;
  const pic = createOptimizedPicture(img.src, img.alt, false, [{ width: '200' }]);
  moveInstrumentation(img, pic.querySelector('img'));
  return pic;
}

/**
 * Resource list: one document per item, a thumbnail (or a file-type icon when no image
 * is authored) beside the title link and an optional description. Links open in a new tab.
 * Each row: image (optional), text (title link, optional description).
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const imageCell = cells.find((cell) => cell.querySelector('picture, img') && !cell.textContent.trim());
    const textCells = cells.filter((cell) => cell !== imageCell && cell.textContent.trim());
    if (!textCells.length && !imageCell) return;

    const li = document.createElement('li');
    moveInstrumentation(row, li);

    const icon = document.createElement('div');
    icon.className = 'cards-resource-icon';
    const img = imageCell && imageCell.querySelector('img');
    if (img) {
      icon.append(thumbnail(img));
      li.classList.add('cards-resource-has-image');
    } else {
      icon.setAttribute('aria-hidden', 'true');
    }

    const body = document.createElement('div');
    body.className = 'cards-resource-body';
    textCells.forEach((cell) => {
      unwrapRichtext(cell);
      moveInstrumentation(cell, body);
      body.append(...cell.childNodes);
    });
    body.querySelectorAll('.button-wrapper').forEach((p) => p.classList.remove('button-wrapper'));

    const links = [...body.querySelectorAll('a[href]')];
    links.forEach((a) => {
      a.classList.remove('button', 'primary', 'secondary', 'accent');
      a.target = '_blank';
      a.rel = 'noopener';
    });
    if (links[0]) {
      links[0].classList.add('cards-resource-title');
      li.classList.add(PDF.test(links[0].href) ? 'cards-resource-pdf' : 'cards-resource-doc');
    }

    li.append(icon, body);
    ul.append(li);
  });
  block.replaceChildren(ul);
}
