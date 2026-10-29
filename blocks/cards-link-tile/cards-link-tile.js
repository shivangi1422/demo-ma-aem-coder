import { moveInstrumentation, rowContentCells } from '../../scripts/scripts.js';

const BUTTON_CLASSES = ['button', 'primary', 'secondary', 'accent'];

/**
 * Cards (link tile): 320px square bordered tiles, centred and wrapping, each
 * an h4 title link and a description link to the same page; the tile
 * background turns #f0f3f5 on hover (mybeckman.in /service/tech-support).
 *
 * Authored structure: one row per tile, one rich-text cell:
 *   #### [FAQs](https://www.mybeckman.in/support/faq)
 *   [Fast answers to frequently asked questions.](https://www.mybeckman.in/support/faq)
 * @param {Element} block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const cells = rowContentCells(row).filter((cell) => cell.textContent.trim() !== '');
    if (!cells.length) return;

    const li = document.createElement('li');
    li.className = 'cards-link-tile-item';
    moveInstrumentation(row, li);

    cells.forEach((cell) => {
      // bare text / bare links get a paragraph
      [...cell.childNodes].forEach((node) => {
        if ((node.nodeType === Node.TEXT_NODE && node.textContent.trim())
          || (node.nodeType === Node.ELEMENT_NODE && ['A', 'STRONG', 'EM'].includes(node.tagName))) {
          const p = document.createElement('p');
          node.replaceWith(p);
          p.append(node);
        }
      });

      // links stay plain text links (no button decoration)
      cell.querySelectorAll('a.button').forEach((a) => a.classList.remove(...BUTTON_CLASSES));
      cell.querySelectorAll('p.button-wrapper, p.button-container').forEach((p) => p.classList.remove('button-wrapper', 'button-container'));

      const heading = cell.querySelector('h1, h2, h3, h4, h5, h6');
      if (heading) heading.classList.add('cards-link-tile-title');
      cell.querySelectorAll(':scope > p').forEach((p) => p.classList.add('cards-link-tile-text'));

      li.append(...cell.childNodes);
    });

    ul.append(li);
  });

  block.replaceChildren(ul);
}
