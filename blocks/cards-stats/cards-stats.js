import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Decorates the cards-stats block: a row of text-only stat items, each a bold
 * value over a short label.
 * Authored structure: one row per stat, one text cell:
 *   <p><strong>Nearly 600</strong></p><p>field service experts worldwide</p>
 * @param {Element} block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    // Use the cell that has content; tolerate extra or empty cells.
    const cells = [...row.children];
    const cell = cells.find((c) => c.textContent.trim() !== '');
    if (!cell) return;

    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (cell.firstChild) li.append(cell.firstChild);

    // The first element, when it is only bold text, is the stat value.
    const first = li.firstElementChild;
    const strong = first && first.querySelector(':scope > strong, :scope > b');
    if (first && (strong ? first.textContent.trim() === strong.textContent.trim()
      : /^H[1-6]$/.test(first.tagName))) {
      first.classList.add('cards-stats-value');
    }
    [...li.children].forEach((el) => {
      if (!el.classList.contains('cards-stats-value')) el.classList.add('cards-stats-label');
    });
    ul.append(li);
  });

  block.replaceChildren(ul);
}
