import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Row of statistics on a blue band: a figure (bold) and a short description per item.
 * Options: left-aligned.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    row.querySelectorAll(':scope > div').forEach((cell) => {
      while (cell.firstChild) li.append(cell.firstChild);
    });
    const first = li.querySelector('p, h2, h3, h4');
    if (first) first.classList.add('cards-stats-value');
    ul.append(li);
  });
  block.replaceChildren(ul);
}
