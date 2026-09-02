import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Decorates the cards-insights block.
 * Authored structure:
 *   row 0: the intro panel (heading, description, "View All" CTA)
 *   row 1..N: one insight card each (meta line, title, description)
 * Renders as a two-column layout: intro on the left, stacked cards on the right.
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const [introRow, ...cardRows] = rows;

  const intro = document.createElement('div');
  intro.className = 'cards-insights-intro';
  const introCell = introRow.firstElementChild || introRow;
  while (introCell.firstChild) intro.append(introCell.firstChild);

  const list = document.createElement('div');
  list.className = 'cards-insights-list';

  cardRows.forEach((row) => {
    const card = document.createElement('div');
    card.className = 'cards-insights-card';
    moveInstrumentation(row, card);
    const cell = row.firstElementChild || row;
    while (cell.firstChild) card.append(cell.firstChild);
    list.append(card);
  });

  block.replaceChildren(intro, list);
}
