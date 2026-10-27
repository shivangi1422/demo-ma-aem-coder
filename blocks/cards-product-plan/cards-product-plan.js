import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation, rowContentCells } from '../../scripts/scripts.js';

const BUTTON_CLASSES = ['button', 'primary', 'secondary', 'accent'];
const INLINE_TAGS = ['A', 'STRONG', 'EM', 'B', 'I', 'SPAN', 'BR', 'U', 'SUB', 'SUP', 'CODE'];

/**
 * Wraps runs of bare text / inline nodes into paragraphs.
 * @param {Element} cell
 */
function wrapInlineRuns(cell) {
  let run = null;
  [...cell.childNodes].forEach((node) => {
    const inline = (node.nodeType === Node.TEXT_NODE)
      || (node.nodeType === Node.ELEMENT_NODE && INLINE_TAGS.includes(node.tagName));
    if (!inline) {
      run = null;
      return;
    }
    if (!run) {
      if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) return;
      run = document.createElement('p');
      node.replaceWith(run);
    }
    run.append(node);
  });
}

/**
 * Finds the paragraph that only holds one link (optionally wrapped in
 * strong/em, or already decorated as p.button-container > a.button) and turns
 * it into the card's blue button.
 * @param {Element} container
 * @param {string} prefix block class prefix
 */
function decorateButton(container, prefix) {
  const buttonP = [...container.querySelectorAll(':scope > p')].find((p) => {
    const links = p.querySelectorAll('a[href]');
    return links.length === 1 && p.textContent.trim() === links[0].textContent.trim();
  });
  if (!buttonP) return;
  const a = buttonP.querySelector('a[href]');
  let outer = a;
  while (outer.parentElement !== buttonP && ['STRONG', 'EM', 'B', 'I'].includes(outer.parentElement.tagName)) {
    outer = outer.parentElement;
  }
  if (outer !== a) outer.replaceWith(a);
  a.classList.remove(...BUTTON_CLASSES);
  a.classList.add(`${prefix}-button`);
  buttonP.classList.remove('button-wrapper', 'button-container');
  buttonP.classList.add(`${prefix}-cta`);
}

/**
 * Cards (product plan): product cards with a 280px contained product photo,
 * an 18px h3 title and a blue Read More button. 214px cards, four per row from
 * 768px, wrapping (min 180px) on mobile. A card without an image keeps the
 * empty 280px image area so card heights stay equal.
 *
 * Authored structure: one row per card, cells image | text:
 *   image (product photo)
 *   ### Title
 *   **[Read More](/service/plans/...)**
 * @param {Element} block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const cells = rowContentCells(row);
    if (!cells.some((cell) => cell.textContent.trim() || cell.querySelector('picture, img'))) return;

    const li = document.createElement('li');
    li.className = 'cards-product-plan-item';
    moveInstrumentation(row, li);

    const imageBox = document.createElement('div');
    imageBox.className = 'cards-product-plan-image';
    const body = document.createElement('div');
    body.className = 'cards-product-plan-body';

    cells.forEach((cell) => {
      const img = cell.querySelector('img');
      if (img && !cell.textContent.trim()) {
        if (!imageBox.querySelector('img')) {
          // an image on another origin (hot-linked) is not run through the media pipeline
          if (new URL(img.src, window.location.href).origin !== window.location.origin) {
            imageBox.append(img.closest('picture') || img);
          } else {
            const picture = createOptimizedPicture(img.src, img.alt || '', false, [{ width: '750' }]);
            moveInstrumentation(img, picture.querySelector('img'));
            imageBox.append(picture);
          }
        }
        return;
      }
      if (!cell.textContent.trim()) return;
      // a picture inside the text cell becomes the card image
      cell.querySelectorAll('picture').forEach((pic) => {
        if (!imageBox.querySelector('img')) imageBox.append(pic);
        else pic.remove();
      });
      wrapInlineRuns(cell);
      body.append(...cell.childNodes);
    });

    // paragraphs left empty by moving the picture out
    body.querySelectorAll(':scope > p').forEach((p) => {
      if (!p.textContent.trim() && !p.querySelector('img, picture, .icon')) p.remove();
    });

    decorateButton(body, 'cards-product-plan');
    const heading = body.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) heading.classList.add('cards-product-plan-title');
    body.querySelectorAll(':scope > p:not(.cards-product-plan-cta)').forEach((p) => {
      p.classList.remove('button-wrapper', 'button-container');
      p.classList.add('cards-product-plan-text');
    });

    li.append(imageBox, body);
    ul.append(li);
  });

  block.replaceChildren(ul);
}
