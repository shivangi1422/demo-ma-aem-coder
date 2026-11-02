import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const TEXT_SIZES = ['small', 'regular'];

/**
 * A cell that holds nothing but a single link (the tile's target).
 * @param {Element} cell
 * @returns {HTMLAnchorElement|null}
 */
function linkOnly(cell) {
  const links = cell.querySelectorAll('a');
  if (links.length !== 1) return null;
  return cell.textContent.trim() === links[0].textContent.trim() ? links[0] : null;
}

/** The cell holding the "small" / "regular" description size option. */
function sizeOf(cell) {
  const value = cell.textContent.trim().toLowerCase();
  return TEXT_SIZES.includes(value) ? value : null;
}

/**
 * Only same-origin raster images go through the optimizer (it keeps just the path).
 * @param {HTMLImageElement} img
 */
function canOptimize(img) {
  const url = new URL(img.src, window.location.href);
  return url.origin === window.location.origin && !/\.svg$/i.test(url.pathname);
}

/**
 * Decorates the product-tiles block: one row per tile with
 * image | text (heading = title, then description) | text size | link.
 * The whole tile becomes the link unless the description has links of its own.
 * @param {Element} block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    const cells = [...row.children];
    const imageCell = cells.find((cell) => cell.querySelector('picture, img'));
    const linkCell = [...cells].reverse().find((cell) => cell !== imageCell && linkOnly(cell));
    const sizeCell = cells.find((cell) => cell !== linkCell && sizeOf(cell));
    if (sizeCell) li.classList.add(`product-tiles-text-${sizeOf(sizeCell)}`);
    const textCells = cells.filter((cell) => ![imageCell, linkCell, sizeCell].includes(cell)
      && cell.textContent.trim());

    const link = linkCell ? linkOnly(linkCell) : null;
    const heading = textCells.map((cell) => cell.querySelector('h1, h2, h3, h4, h5, h6')).find(Boolean);
    const hasInnerLinks = textCells.some((cell) => [...cell.querySelectorAll('a')]
      .some((a) => !heading || !heading.contains(a)));
    const tile = document.createElement(link && !hasInnerLinks ? 'a' : 'div');
    tile.className = 'product-tiles-tile';
    if (tile.tagName === 'A') {
      tile.href = link.getAttribute('href');
      moveInstrumentation(link, tile);
    }

    if (imageCell) {
      const holder = document.createElement('div');
      holder.className = 'product-tiles-image';
      const img = imageCell.querySelector('img');
      if (img && canOptimize(img)) {
        const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
        moveInstrumentation(img, optimized.querySelector('img'));
        holder.append(optimized);
      } else {
        holder.append(imageCell.querySelector('picture') || img);
      }
      tile.append(holder);
    }

    const body = document.createElement('div');
    body.className = 'product-tiles-body';
    if (heading) {
      const title = document.createElement('h2');
      title.className = 'product-tiles-title';
      moveInstrumentation(heading, title);
      if (tile.tagName === 'DIV' && link) {
        const a = document.createElement('a');
        a.href = link.getAttribute('href');
        a.textContent = heading.textContent.trim();
        title.append(a);
      } else {
        title.textContent = heading.textContent.trim();
      }
      heading.remove();
      body.append(title);
    }
    textCells.forEach((cell) => {
      if (!cell.textContent.trim()) return;
      const description = document.createElement('div');
      description.className = 'product-tiles-description';
      [...cell.attributes].forEach(({ name, value }) => description.setAttribute(name, value));
      while (cell.firstChild) description.append(cell.firstChild);
      body.append(description);
    });
    tile.append(body);
    li.append(tile);
    ul.append(li);
  });
  block.replaceChildren(ul);
}
