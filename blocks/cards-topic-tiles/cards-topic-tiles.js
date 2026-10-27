import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Cards (topic tiles): text-only link tiles with a decorative arrow and an
 * animated red gradient fill on hover. The whole tile is the link.
 *
 * Authored structure: one row per tile, 2 cells:
 *   cell 1: image (left empty)
 *   cell 2: rich text — one linked title
 * @param {Element} block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const bodyCell = cells.find((cell) => cell.textContent.trim() !== '');
    if (!bodyCell) return;

    const li = document.createElement('li');
    li.className = 'cards-topic-tiles-item';
    moveInstrumentation(row, li);

    const link = bodyCell.querySelector('a[href]');
    const tile = document.createElement(link ? 'a' : 'div');
    tile.className = 'cards-topic-tiles-tile';
    if (link) {
      tile.href = link.getAttribute('href');
      if (link.title) tile.title = link.title;
      if (link.target) tile.target = link.target;
      if (link.target === '_blank') tile.rel = 'noopener';
    }

    const label = document.createElement('span');
    label.className = 'cards-topic-tiles-label';
    moveInstrumentation(bodyCell, label);
    label.textContent = (link || bodyCell).textContent.trim();

    const arrow = document.createElement('span');
    arrow.className = 'cards-topic-tiles-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '->';

    tile.append(label, arrow);
    li.append(tile);
    ul.append(li);
  });

  block.replaceChildren(ul);
}
