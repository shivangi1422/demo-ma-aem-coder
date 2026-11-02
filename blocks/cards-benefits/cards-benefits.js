import { decorateIcons } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const ICON_TOKEN = /:([a-z0-9-]+):/;

/**
 * Replaces ":icon-name:" tokens in the cell's text with icon spans.
 * Published pages already get span.icon from the pipeline; local previews and
 * freshly imported content keep the raw token.
 * @param {Element} cell
 */
function decorateIconTokens(cell) {
  const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  textNodes.forEach((node) => {
    const parts = node.textContent.split(/(:[a-z0-9-]+:)/);
    if (parts.length === 1) return;
    const nodes = parts.filter((part) => part !== '').map((part) => {
      const match = part.match(new RegExp(`^${ICON_TOKEN.source}$`));
      if (!match) return document.createTextNode(part);
      const span = document.createElement('span');
      span.className = `icon icon-${match[1]}`;
      return span;
    });
    node.replaceWith(...nodes);
  });
}

/**
 * true when the row starts with an icon (span.icon or ":icon:" token), i.e. it is a benefit item.
 * @param {Element} row
 * @returns {boolean}
 */
function isBenefitRow(row) {
  const first = row.querySelector('p, h1, h2, h3, h4, h5, h6') || row;
  if (first.querySelector(':scope > span.icon:first-child')) return true;
  return /^\s*:[a-z0-9-]+:/.test(first.textContent);
}

/**
 * Decorates the cards-benefits block: an intro panel next to a list of benefits,
 * each benefit = icon + bold title + description.
 * Authored structure:
 *   row 1   = intro (heading + paragraph), optional
 *   rows 2+ = one benefit each: ":check-circle: **Title**" paragraph + description paragraph
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const introRow = !isBenefitRow(rows[0]) ? rows[0] : null;
  const itemRows = rows.filter((row) => row !== introRow);

  const children = [];
  if (introRow && introRow.textContent.trim()) {
    const intro = document.createElement('div');
    intro.className = 'cards-benefits-intro';
    moveInstrumentation(introRow, intro);
    [...introRow.children].forEach((cell) => {
      moveInstrumentation(cell, intro);
      while (cell.firstChild) intro.append(cell.firstChild);
    });
    children.push(intro);
  }

  const items = [];
  itemRows.forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    [...row.children].forEach((cell) => {
      if (cell.textContent.trim() === '' && !cell.querySelector('span.icon')) return;
      moveInstrumentation(cell, li);
      while (cell.firstChild) li.append(cell.firstChild);
    });
    // Plain-text cells (no paragraphs) are wrapped so title/description styling applies.
    if (!li.querySelector(':scope > p, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6')) {
      const p = document.createElement('p');
      while (li.firstChild) p.append(li.firstChild);
      li.append(p);
    }
    decorateIconTokens(li);
    const title = li.firstElementChild;
    if (title) title.classList.add('cards-benefits-title');
    // icons are decorative; the title text carries the meaning
    li.querySelectorAll('span.icon').forEach((icon) => icon.setAttribute('aria-hidden', 'true'));
    items.push(li);
  });

  // Benefits are split into two content-sized columns (first half left, rest right),
  // matching the source layout where each column is laid out independently.
  const body = document.createElement('div');
  body.className = 'cards-benefits-body';
  const perColumn = Math.ceil(items.length / 2);
  [items.slice(0, perColumn), items.slice(perColumn)].forEach((columnItems) => {
    if (!columnItems.length) return;
    const ul = document.createElement('ul');
    ul.className = 'cards-benefits-list';
    ul.append(...columnItems);
    body.append(ul);
  });

  decorateIcons(body);
  children.push(body);
  block.replaceChildren(...children);
}
