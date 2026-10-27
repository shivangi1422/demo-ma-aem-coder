import { moveInstrumentation, rowContentCells } from '../../scripts/scripts.js';

/**
 * Cards (stats): a row of value + label items (white text on the section's
 * blue band) that stacks one per row on mobile.
 *
 * Authored structure: one row per item, one rich-text cell (an empty image
 * cell is tolerated and dropped):
 *   **Nearly 600**
 *   field service experts worldwide
 * @param {Element} block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const cells = rowContentCells(row).filter((cell) => cell.textContent.trim() !== '');
    if (!cells.length) return;

    const li = document.createElement('li');
    li.className = 'cards-stats-item';
    moveInstrumentation(row, li);

    cells.forEach((cell) => {
      // bare text (no paragraphs) gets a paragraph
      [...cell.childNodes].forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
          const p = document.createElement('p');
          node.replaceWith(p);
          p.append(node);
        }
      });
      li.append(...cell.childNodes);
    });

    const paragraphs = [...li.querySelectorAll(':scope > p, :scope > :is(h1, h2, h3, h4, h5, h6)')];
    if (paragraphs.length) {
      paragraphs[0].classList.add('cards-stats-value');
      paragraphs.slice(1).forEach((p) => p.classList.add('cards-stats-label'));
    }
    li.querySelectorAll('p.button-wrapper, p.button-container').forEach((p) => p.classList.remove('button-wrapper', 'button-container'));

    ul.append(li);
  });

  block.replaceChildren(ul);
}
