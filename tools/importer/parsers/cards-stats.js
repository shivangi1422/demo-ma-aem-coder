/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-stats (xwalk model: cards-stats, items: cards-stats-item).
 * Source: div.Section__intro > div (p > strong figure, p description).
 * Output: one row per figure: <!-- field:text --> <p><strong>3x</strong></p><p>…</p>
 */
export default function parse(element, { document }) {
  const cells = [];
  [...element.children].forEach((item) => {
    const parts = [...item.children];
    if (!parts.length) return;
    const cell = document.createDocumentFragment();
    cell.appendChild(document.createComment(' field:text '));
    parts.forEach((n) => cell.appendChild(n));
    cells.push([cell]);
  });
  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-stats', cells });
  element.replaceWith(block);
}
