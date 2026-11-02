import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Builds the card title as an h2, keeping an authored heading if there is one.
 * @param {Element} cell
 * @returns {Element|null}
 */
function buildTitle(cell) {
  if (!cell || !cell.textContent.trim()) return null;
  const heading = cell.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) return heading;
  const h2 = document.createElement('h2');
  const source = cell.querySelector('[data-aue-prop]') || cell;
  moveInstrumentation(source, h2);
  h2.textContent = cell.textContent.trim();
  return h2;
}

/**
 * Decorates the category-cards block: one row per card with
 * title | description | link (link text merged into the link).
 * @param {Element} block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    const cells = [...row.children];
    const linkCell = cells.find((cell) => cell.querySelector('a'));
    const textCells = cells.filter((cell) => cell !== linkCell);
    const [titleCell, ...descCells] = textCells;

    const title = buildTitle(titleCell);
    if (title) li.append(title);

    descCells.forEach((cell) => {
      if (!cell.textContent.trim()) return;
      const body = document.createElement('div');
      body.className = 'category-cards-description';
      while (cell.firstChild) body.append(cell.firstChild);
      li.append(body);
    });

    const link = linkCell && linkCell.querySelector('a');
    if (link) {
      link.className = 'category-cards-cta';
      link.closest('p, div')?.classList.remove('button-wrapper');
      li.append(link);
    }
    ul.append(li);
  });
  block.replaceChildren(ul);
}
