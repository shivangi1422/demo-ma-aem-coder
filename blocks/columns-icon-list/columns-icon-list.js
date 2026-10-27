import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const isEmpty = (el) => !el || (el.textContent.trim() === '' && !el.querySelector('picture, img'));

function optimize(container, width, eager = false) {
  container.querySelectorAll('picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, eager, [{ width }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    img.closest('picture').replaceWith(optimized);
  });
}

/**
 * Decorates the columns-icon-list block: a large image on one side and a
 * vertical list of icon + text items on the other.
 *
 * Authored structure:
 *   row 0: one cell with the large image (block field)
 *   rows 1..N: one item each — icon image cell | text cell (label line + link)
 * Document-authored content may also use a single row of two cells
 * (image | icons and paragraphs); those are normalised into the same output.
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];
  const media = document.createElement('div');
  media.className = 'columns-icon-list-image';
  const list = document.createElement('ul');
  list.className = 'columns-icon-list-items';

  const addItem = (iconEl, textEl, source) => {
    if (isEmpty(iconEl) && isEmpty(textEl)) return;
    const li = document.createElement('li');
    if (source) moveInstrumentation(source, li);
    if (!isEmpty(iconEl)) {
      const icon = document.createElement('div');
      icon.className = 'columns-icon-list-icon';
      while (iconEl.firstChild) icon.append(iconEl.firstChild);
      li.append(icon);
    }
    if (!isEmpty(textEl)) {
      const text = document.createElement('div');
      text.className = 'columns-icon-list-text';
      while (textEl.firstChild) text.append(textEl.firstChild);
      li.append(text);
    }
    list.append(li);
  };

  rows.forEach((row, i) => {
    const cells = [...row.children];

    // Block-level image row: a single cell holding only a picture.
    if (i === 0 && cells.length === 1 && cells[0].querySelector('picture')) {
      moveInstrumentation(row, media);
      while (cells[0].firstChild) media.append(cells[0].firstChild);
      return;
    }

    // Document shape: one row, image cell | cell with icons + paragraphs.
    if (i === 0 && cells.length === 2 && rows.length === 1) {
      const [left, right] = cells;
      while (left.firstChild) media.append(left.firstChild);
      let icon = null;
      [...right.children].forEach((child) => {
        const onlyPicture = child.querySelector('picture') && child.textContent.trim() === '';
        if (onlyPicture || child.tagName === 'PICTURE') {
          icon = document.createElement('div');
          icon.append(child);
        } else {
          const text = document.createElement('div');
          text.append(child);
          addItem(icon, text);
          icon = null;
        }
      });
      return;
    }

    const iconCell = cells.find((c) => c.querySelector('picture') && c.textContent.trim() === '');
    const textCell = cells.find((c) => c !== iconCell && !isEmpty(c));
    addItem(iconCell, textCell, row);
  });

  optimize(media, '900');
  optimize(list, '96');

  const children = [];
  if (!isEmpty(media)) children.push(media);
  children.push(list);
  block.replaceChildren(...children);
}
