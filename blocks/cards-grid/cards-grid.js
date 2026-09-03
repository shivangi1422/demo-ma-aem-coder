import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Decorates the cards-grid block. One block, three styles via the "Style"
 * dropdown (variant class):
 *   - .cards-grid.solutions    heading + 3-up cards (image, category, title, link)
 *   - .cards-grid.productlines heading + 3-up cards (image, title, desc)
 *   - .cards-grid.insights     intro panel + stacked text cards (two-column)
 * Authored structure: row 0 = heading/intro, rows 1..N = one card each.
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const insights = block.classList.contains('insights');

  // Row 0 (no picture) is the heading / intro panel.
  const headingRow = rows[0] && !rows[0].querySelector('picture') ? rows[0] : null;
  const cardRows = rows.filter((r) => r !== headingRow);

  if (insights) {
    // Intro panel on the left, stacked text cards on the right.
    const intro = document.createElement('div');
    intro.className = 'cards-grid-intro';
    if (headingRow) {
      const cell = headingRow.firstElementChild || headingRow;
      while (cell.firstChild) intro.append(cell.firstChild);
    }

    const list = document.createElement('div');
    list.className = 'cards-grid-list';
    cardRows.forEach((row) => {
      const card = document.createElement('div');
      card.className = 'cards-grid-card';
      moveInstrumentation(row, card);
      const cell = row.firstElementChild || row;
      while (cell.firstChild) card.append(cell.firstChild);
      list.append(card);
    });

    block.replaceChildren(intro, list);
    return;
  }

  // Solutions / Product Lines: heading + card grid.
  const ul = document.createElement('ul');
  cardRows.forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'cards-grid-image';
      } else {
        div.className = 'cards-grid-body';
      }
    });
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    img.closest('picture').replaceWith(optimized);
  });

  const children = [];
  if (headingRow) {
    const heading = document.createElement('div');
    heading.className = 'cards-grid-heading';
    while (headingRow.firstElementChild) heading.append(headingRow.firstElementChild);
    children.push(heading);
  }
  children.push(ul);
  block.replaceChildren(...children);
}
