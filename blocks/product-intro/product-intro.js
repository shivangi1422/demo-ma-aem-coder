import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Optimizes a same-origin, non-SVG image; other images keep the authored picture.
 * @param {HTMLImageElement} img authored image
 * @param {boolean} eager load eagerly (block in the first section)
 * @returns {Element} the picture to show
 */
function optimizedPicture(img, eager) {
  const authored = img.closest('picture') || img;
  const url = new URL(img.src, window.location.href);
  if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) {
    if (eager) img.loading = 'eager';
    return authored;
  }
  const pic = createOptimizedPicture(img.src, img.alt, eager, [
    { media: '(min-width: 900px)', width: '600' },
    { width: '750' },
  ]);
  moveInstrumentation(img, pic.querySelector('img'));
  return pic;
}

/**
 * Groups the "Resources + Tools" label (a paragraph that is only bold text)
 * with the link list that follows it.
 * @param {Element} content text column
 */
function decorateResources(content) {
  [...content.querySelectorAll(':scope > ul')].forEach((ul) => {
    const label = ul.previousElementSibling;
    const strong = label && label.tagName === 'P' && label.querySelector('strong');
    if (!strong || label.textContent.trim() !== strong.textContent.trim()) return;
    const items = [...ul.children];
    if (!items.length || !items.every((li) => li.querySelector('a[href]'))) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'product-intro-resources';
    label.classList.add('product-intro-resources-label');
    ul.classList.add('product-intro-resources-list');
    label.before(wrapper);
    wrapper.append(label, ul);
  });
}

/**
 * Wraps consecutive button paragraphs in one actions row.
 * @param {Element} content text column
 */
function decorateActions(content) {
  let group = null;
  [...content.children].forEach((el) => {
    if (!el.classList.contains('button-wrapper')) {
      group = null;
      return;
    }
    if (!group) {
      group = document.createElement('div');
      group.className = 'product-intro-actions';
      el.before(group);
    }
    group.append(el);
  });
}

/**
 * Product intro: product image beside the title, introduction, checklist,
 * call-to-action buttons and a "Resources + Tools" link list.
 * Cells: image, text (authored as one row with two cells, or one row per field).
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')];
  if (!cells.length) return;
  const imageCell = cells.find((cell) => cell.querySelector('picture, img') && !cell.textContent.trim());
  const textCell = cells.find((cell) => cell !== imageCell) || document.createElement('div');
  const firstSection = block.closest('.section') === document.querySelector('main .section');

  const row = document.createElement('div');

  const img = imageCell && imageCell.querySelector('img');
  if (img) {
    const media = document.createElement('div');
    media.className = 'product-intro-media';
    moveInstrumentation(imageCell, media);
    media.append(optimizedPicture(img, firstSection));
    row.append(media);
  }

  const content = document.createElement('div');
  content.className = 'product-intro-content';
  moveInstrumentation(textCell, content);
  content.append(...textCell.childNodes);
  // drop empty paragraphs/headings left over from the source markup
  content.querySelectorAll(':scope > :is(p, h2, h3, ul)').forEach((el) => {
    if (!el.textContent.trim() && !el.querySelector('img, picture')) el.remove();
  });
  decorateResources(content);
  decorateActions(content);
  content.querySelectorAll(':scope > ul').forEach((ul) => ul.classList.add('product-intro-checklist'));
  row.append(content);

  block.replaceChildren(row);
}
