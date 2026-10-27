import { moveInstrumentation, rowContentCells } from '../../scripts/scripts.js';

const BUTTON_CLASSES = ['button', 'primary', 'secondary', 'accent'];

/**
 * Cards (button caption): side-by-side items, each an outline button over a
 * short caption (white on the section's blue band), stacking on mobile.
 *
 * Authored structure: one row per item, one rich-text cell (an empty image
 * cell is tolerated and dropped):
 *   [Call Service](tel:18002109340)     (plain, bold/italic or a.button)
 *   Caption paragraph.
 * @param {Element} block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const cells = rowContentCells(row).filter((cell) => cell.textContent.trim() !== '');
    if (!cells.length) return;

    const li = document.createElement('li');
    li.className = 'cards-button-caption-item';
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
      li.append(...cell.childNodes);
    });

    // first paragraph holding only one link = the button
    const buttonP = [...li.querySelectorAll(':scope > p')].find((p) => {
      const links = p.querySelectorAll('a[href]');
      return links.length === 1 && p.textContent.trim() === links[0].textContent.trim();
    });
    if (buttonP) {
      const a = buttonP.querySelector('a[href]');
      let outer = a;
      while (outer.parentElement !== buttonP && ['STRONG', 'EM', 'B', 'I'].includes(outer.parentElement.tagName)) {
        outer = outer.parentElement;
      }
      if (outer !== a) outer.replaceWith(a);
      a.classList.remove(...BUTTON_CLASSES);
      a.classList.add('cards-button-caption-button');
      buttonP.classList.remove('button-wrapper', 'button-container');
      buttonP.classList.add('cards-button-caption-cta');
    }

    li.querySelectorAll(':scope > p:not(.cards-button-caption-cta)').forEach((p) => {
      p.classList.remove('button-wrapper', 'button-container');
      p.classList.add('cards-button-caption-text');
    });

    ul.append(li);
  });

  block.replaceChildren(ul);
}
