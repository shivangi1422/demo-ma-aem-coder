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
 * Returns the image cell and the text cell of an authored card row.
 * @param {Element} row
 * @returns {{imgCell: Element|undefined, textCell: Element|undefined}}
 */
function splitCells(row) {
  const cells = [...row.children];
  const imgCell = cells.find((c) => c.querySelector('picture, img'));
  const textCell = cells.find((c) => c !== imgCell && c.textContent.trim() !== '');
  return { imgCell, textCell };
}

/**
 * Returns the cell's picture (or bare img), optimized when the image allows it.
 * @param {Element} cell
 * @param {string} width
 * @returns {Element|null}
 */
function pictureFrom(cell, width) {
  const img = cell && cell.querySelector('img');
  if (!img) return null;
  if (!canOptimize(img)) return img.closest('picture') || img;
  const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width }]);
  moveInstrumentation(img, optimized.querySelector('img'));
  return optimized;
}

/**
 * Wraps a non-empty heading row in .cards-grid-heading; an empty one renders nothing.
 * @param {Element|null} headingRow
 * @returns {Element[]}
 */
function headingFrom(headingRow) {
  if (!headingRow || !headingRow.textContent.trim()) return [];
  const heading = document.createElement('div');
  heading.className = 'cards-grid-heading';
  while (headingRow.firstElementChild) heading.append(headingRow.firstElementChild);
  return [heading];
}

/**
 * Content list: bordered 4:3 image (linked to the card's title link), H3 title,
 * linked description. The image link is a duplicate of the title link, so it is
 * kept out of the tab order.
 * @param {Element[]} cardRows
 * @returns {Element}
 */
function buildContentList(cardRows) {
  const ul = document.createElement('ul');
  cardRows.forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    const { imgCell, textCell } = splitCells(row);
    const link = textCell && textCell.querySelector('a[href]');

    const picture = pictureFrom(imgCell, '750');
    if (picture) {
      const media = document.createElement('div');
      media.className = 'cards-grid-image';
      moveInstrumentation(imgCell, media);
      if (link) {
        const a = document.createElement('a');
        a.href = link.getAttribute('href');
        a.tabIndex = -1;
        a.setAttribute('aria-label', (textCell.querySelector('h2, h3, h4') || link).textContent.trim());
        a.append(picture);
        media.append(a);
      } else {
        media.append(picture);
      }
      li.append(media);
    }

    if (textCell) {
      const body = document.createElement('div');
      body.className = 'cards-grid-body';
      moveInstrumentation(textCell, body);
      while (textCell.firstChild) body.append(textCell.firstChild);
      li.append(body);
    }
    ul.append(li);
  });
  return ul;
}

/**
 * Icon left: small icon beside a bold title, text and an outlined button
 * (the lone link in its own paragraph).
 * @param {Element[]} cardRows
 * @returns {Element}
 */
function buildIconLeft(cardRows) {
  const ul = document.createElement('ul');
  cardRows.forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    const { imgCell, textCell } = splitCells(row);

    const picture = pictureFrom(imgCell, '150');
    if (picture) {
      const icon = document.createElement('div');
      icon.className = 'cards-grid-image';
      moveInstrumentation(imgCell, icon);
      icon.append(picture);
      li.append(icon);
    }

    if (textCell) {
      const body = document.createElement('div');
      body.className = 'cards-grid-body';
      moveInstrumentation(textCell, body);
      while (textCell.firstChild) body.append(textCell.firstChild);
      body.querySelectorAll(':scope > p').forEach((p) => {
        const a = p.querySelector('a[href]');
        if (a && p.querySelectorAll('a').length === 1 && p.textContent.trim() === a.textContent.trim()) {
          p.replaceChildren(a);
          a.className = 'button';
          p.className = 'button-wrapper cards-grid-action';
        }
      });
      li.append(body);
    }
    ul.append(li);
  });
  return ul;
}

/**
 * Buttons: each item is one red link tile holding the white icon and the label.
 * External links open in a new tab.
 * @param {Element[]} cardRows
 * @returns {Element}
 */
function buildButtons(cardRows) {
  const ul = document.createElement('ul');
  cardRows.forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    const { imgCell, textCell } = splitCells(row);
    const link = textCell && textCell.querySelector('a[href]');

    const tile = document.createElement(link ? 'a' : 'div');
    tile.className = 'cards-grid-tile';
    if (link) {
      tile.href = link.getAttribute('href');
      if (link.title) tile.title = link.title;
      try {
        if (new URL(tile.href, window.location.href).origin !== window.location.origin) {
          tile.target = '_blank';
          tile.rel = 'noopener';
        }
      } catch { /* relative or malformed href: same tab */ }
    }

    const picture = pictureFrom(imgCell, '150');
    if (picture) {
      const icon = document.createElement('span');
      icon.className = 'cards-grid-image';
      // decorative next to the label: keep the tile's accessible name to the label only
      icon.setAttribute('aria-hidden', 'true');
      moveInstrumentation(imgCell, icon);
      icon.append(picture);
      tile.append(icon);
    }

    const label = document.createElement('span');
    label.className = 'cards-grid-label';
    if (textCell) moveInstrumentation(textCell, label);
    label.textContent = (link || textCell)?.textContent.trim() || '';
    tile.append(label);

    li.append(tile);
    ul.append(li);
  });
  return ul;
}

/**
 * Decorates the cards-grid block. One block, three styles via the "Style"
 * dropdown (variant class):
 *   - .cards-grid.solutions    heading + 3-up cards (image, category, title, link)
 *   - .cards-grid.productlines heading + 3-up cards (image, title, desc)
 *   - .cards-grid.insights     intro panel + stacked text cards (two-column)
 *   - .cards-grid.products     single column: large product image, H3 title, Read More button
 *   - .cards-grid.contentlist  3-up: bordered 4:3 linked image, light H3, linked text
 *   - .cards-grid.icon-left    2-up: small icon beside bold title, text, outlined button
 *   - .cards-grid.buttons      red link tiles with a white icon
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

  // Support / Training styles: each has its own builder; existing styles are untouched.
  const builders = {
    contentlist: buildContentList,
    'icon-left': buildIconLeft,
    buttons: buildButtons,
  };
  const style = Object.keys(builders).find((cls) => block.classList.contains(cls));
  if (style) {
    block.replaceChildren(...headingFrom(headingRow), builders[style](cardRows));
    return;
  }

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

  // Products: a lone link in its own paragraph ("Read More") is the card's button,
  // even when it was authored without bold/italic formatting.
  if (block.classList.contains('products')) {
    ul.querySelectorAll('.cards-grid-body > p').forEach((p) => {
      const a = p.querySelector(':scope > a');
      if (a && p.children.length === 1 && p.textContent.trim() === a.textContent.trim()) {
        a.classList.add('button');
        p.classList.add('button-wrapper', 'cards-grid-action');
      }
    });
  }

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
