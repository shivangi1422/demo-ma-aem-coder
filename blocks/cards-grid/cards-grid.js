import { createOptimizedPicture, decorateIcons } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Only same-origin, non-SVG images can be optimized; migrated images still point
 * at the source site until uploaded, and SVGs can't be transcoded.
 * @param {HTMLImageElement} img
 * @returns {boolean}
 */
function canOptimize(img) {
  const url = new URL(img.src, window.location.href);
  return url.origin === window.location.origin && !/\.svg$/i.test(url.pathname);
}

/**
 * Turns a cell holding only icon tokens (e.g. ":user-plus:") into icon spans.
 * Published pages already get span.icon from the pipeline; local previews keep the raw token.
 * @param {Element} cell
 * @returns {boolean} true when the cell is an icon cell
 */
function decorateIconCell(cell) {
  if (cell.querySelector('span.icon') && !cell.textContent.trim()) return true;
  const text = cell.textContent.trim();
  if (!/^(:[a-z0-9-]+:\s*)+$/.test(text)) return false;
  const names = text.match(/:([a-z0-9-]+):/g).map((t) => t.slice(1, -1));
  cell.replaceChildren(...names.map((name) => {
    const span = document.createElement('span');
    span.className = `icon icon-${name}`;
    return span;
  }));
  return true;
}

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
  const features = block.classList.contains('features');

  // Row 0 (no picture) is the heading / intro panel.
  const headingRow = rows[0] && !rows[0].querySelector('picture') ? rows[0] : null;
  const cardRows = rows.filter((r) => r !== headingRow);

  if (features) {
    // Centered feature columns: title → icon → description.
    const ul = document.createElement('ul');
    cardRows.forEach((row) => {
      const li = document.createElement('li');
      moveInstrumentation(row, li);
      const cells = [...row.children];
      const imgCell = cells.find((c) => c.querySelector('picture, img'));
      const textCell = cells.find((c) => c !== imgCell && c.textContent.trim() !== '');

      // Title first.
      const heading = textCell && textCell.querySelector('h2, h3, h4, h5');
      if (heading) li.append(heading);

      // Icon between title and description.
      if (imgCell) {
        const icon = document.createElement('div');
        icon.className = 'cards-grid-image';
        const img = imgCell.querySelector('img');
        if (img && !canOptimize(img)) {
          icon.append(img.closest('picture') || img);
        } else if (img) {
          const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '150' }]);
          moveInstrumentation(img, optimized.querySelector('img'));
          icon.append(optimized);
        }
        li.append(icon);
      }

      // Remaining description text.
      if (textCell) {
        const body = document.createElement('div');
        body.className = 'cards-grid-body';
        while (textCell.firstChild) body.append(textCell.firstChild);
        li.append(body);
      }
      ul.append(li);
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
    return;
  }

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
      // The model gives each item an (empty) image cell + a text cell; use the
      // cell that actually has content.
      const cells = [...row.children];
      const cell = cells.find((c) => c.textContent.trim() !== '') || cells[cells.length - 1] || row;
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
      // Drop empty cells (e.g. an unused image column) so no ghost boxes render.
      if (!div.querySelector('picture, img, span.icon') && div.textContent.trim() === '') {
        div.remove();
        return;
      }
      if (decorateIconCell(div)) {
        div.className = 'cards-grid-icon';
        block.classList.add('cards-grid-icons');
      } else if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'cards-grid-image';
      } else {
        div.className = 'cards-grid-body';
      }
    });
    // A leading bold marker (e.g. "**NEW**") becomes a corner ribbon.
    const body = li.querySelector('.cards-grid-body');
    const firstEl = body && body.firstElementChild;
    const strong = firstEl && firstEl.querySelector(':scope > strong');
    if (strong && firstEl.textContent.trim() === strong.textContent.trim()) {
      const badge = document.createElement('span');
      badge.className = 'cards-grid-badge';
      badge.textContent = strong.textContent.trim();
      firstEl.remove();
      li.prepend(badge);
    }
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    if (!canOptimize(img)) return;
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    img.closest('picture').replaceWith(optimized);
  });

  decorateIcons(ul);

  const children = [];
  // an empty heading row (icon-card grids have none) renders nothing
  if (headingRow && headingRow.textContent.trim()) {
    const heading = document.createElement('div');
    heading.className = 'cards-grid-heading';
    while (headingRow.firstElementChild) heading.append(headingRow.firstElementChild);
    children.push(heading);
  }
  children.push(ul);
  block.replaceChildren(...children);
}
