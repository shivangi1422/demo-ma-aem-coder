import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Decorates the feature-columns block: one row per column (heading + feature list),
 * laid out side by side from tablet up.
 * @param {Element} block
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    const column = document.createElement('div');
    column.className = 'feature-columns-column';
    moveInstrumentation(row, column);
    [...row.children].forEach((cell) => column.append(...cell.childNodes));
    row.replaceWith(column);
  });
  block.classList.add(`feature-columns-${block.children.length}-cols`);
}
