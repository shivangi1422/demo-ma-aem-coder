/* eslint-disable */
/* global WebImporter */

/**
 * Parser for callout-columns (xwalk model: callout-columns, items: callout-columns-item).
 * Source: div.Intro > .Intro__title (h2 + p) | .Intro__body > .Intro__body-item > div (benefit).
 * Output:
 *   row 1: <!-- field:text --> intro (h2, p)
 *   one row per benefit: <!-- field:text --> <p><strong>Title</strong></p><p>description</p>
 * Benefits keep the source reading order (down the first column, then the second).
 */
export default function parse(element, { document }) {
  const introCell = document.createDocumentFragment();
  const title = element.querySelector(':scope > .Intro__title');
  if (title && title.children.length) {
    introCell.appendChild(document.createComment(' field:text '));
    [...title.children].forEach((n) => introCell.appendChild(n));
  }
  const cells = [[introCell]];

  const items = [...element.querySelectorAll(':scope > .Intro__body > .Intro__body-item > div')];
  items.forEach((item) => {
    item.querySelectorAll('span[class*="fa-"]').forEach((s) => s.remove());
    const cell = document.createDocumentFragment();
    const parts = [...item.querySelectorAll('p, h3, h4, ul, ol')].filter((n) => !n.parentElement.closest('p, ul, ol'));
    if (!parts.length) return;
    cell.appendChild(document.createComment(' field:text '));
    parts.forEach((n) => cell.appendChild(n));
    cells.push([cell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'callout-columns', cells });
  element.replaceWith(block);
}
