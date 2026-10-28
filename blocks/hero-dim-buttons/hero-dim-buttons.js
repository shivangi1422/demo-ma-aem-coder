import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation, rowContentCells } from '../../scripts/scripts.js';

const BUTTON_CLASSES = ['button', 'primary', 'secondary', 'accent'];

/**
 * Turns a paragraph that holds only a link into a hero button.
 * <strong><a> (or a.button.primary) = filled, <em><a> (or a.button.secondary)
 * = outline; a plain link defaults to filled.
 * @param {Element} p
 * @returns {boolean} true when the paragraph became a button
 */
function decorateCta(p) {
  const links = p.querySelectorAll('a[href]');
  if (links.length !== 1) return false;
  const a = links[0];
  if (a.querySelector('img, picture') || p.textContent.trim() !== a.textContent.trim()) return false;

  let outline = a.classList.contains('secondary');
  // unwrap <strong>/<em> around the link
  let outer = a;
  while (outer.parentElement !== p && ['STRONG', 'EM', 'B', 'I'].includes(outer.parentElement.tagName)) {
    outer = outer.parentElement;
    if (['EM', 'I'].includes(outer.tagName)) outline = true;
  }
  if (outer !== a) outer.replaceWith(a);

  a.classList.remove(...BUTTON_CLASSES);
  a.classList.add('hero-dim-buttons-button', outline ? 'hero-dim-buttons-button-outline' : 'hero-dim-buttons-button-filled');
  p.classList.remove('button-wrapper', 'button-container');
  p.classList.add('hero-dim-buttons-cta');
  return true;
}

/**
 * Hero (dim buttons): full-bleed photo dimmed to 50% over black with a centred
 * h1, h2 subtitle and a row of buttons (filled + outline).
 *
 * Authored structure (xwalk model: image + imageAlt, text):
 *   row 1: image (alt from imageAlt)
 *   row 2: rich text — h1, h2, <p><strong><a></a></strong></p>, <p><em><a></a></em></p>
 * @param {Element} block
 */
export default function decorate(block) {
  let picture;
  const content = document.createElement('div');
  content.className = 'hero-dim-buttons-content';

  [...block.children].forEach((row) => {
    const img = row.querySelector('img');
    if (img && !picture) {
      // LCP image: eager, high priority
      picture = createOptimizedPicture(img.src, img.alt || '', true, [
        { media: '(min-width: 992px)', width: '2000' },
        { width: '1200' },
      ]);
      const newImg = picture.querySelector('img');
      newImg.setAttribute('fetchpriority', 'high');
      newImg.loading = 'eager';
      moveInstrumentation(img, newImg);
      picture.classList.add('hero-dim-buttons-image');
      (img.closest('picture') || img).remove();
    }

    if (row.textContent.trim() === '') {
      row.remove();
      return;
    }

    rowContentCells(row).forEach((cell) => {
      if (cell.textContent.trim() === '') return;
      moveInstrumentation(cell, content);
      content.append(...cell.childNodes);
    });
    row.remove();
  });

  // bare text nodes (single-cell rows without <p>) get a paragraph
  [...content.childNodes].forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
      const p = document.createElement('p');
      node.replaceWith(p);
      p.append(node);
    }
  });

  // consecutive button paragraphs share one centred row
  let actions = null;
  [...content.children].forEach((el) => {
    if (el.tagName === 'P' && decorateCta(el)) {
      if (!actions) {
        actions = document.createElement('div');
        actions.className = 'hero-dim-buttons-actions';
        el.before(actions);
      }
      actions.append(el);
    } else {
      actions = null;
    }
  });

  block.replaceChildren(...(picture ? [picture] : []), content);
}
